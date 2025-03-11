import { Transaction, User } from "../schema";
import { Statistics, StatisticsFilters, TimeRange, UserStatistics, TimeStatistics, DayOfWeekStatistics, HourlyStatistics } from "./types";

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isInTimeRange(date: Date, range: TimeRange): boolean {
  return date >= range.start && date <= range.end;
}

function calculateUserStatistics(
  user: User,
  transactions: Transaction[],
  timeRange: TimeRange
): UserStatistics {
  const userTransactions = transactions
    .filter(t => t.userId === user.id && isInTimeRange(new Date(t.createdAt), timeRange));

  const purchases = userTransactions.filter(t => t.type === 'PURCHASE');
  const deposits = userTransactions.filter(t => t.type === 'DEPOSIT');

  // Calculate most active day
  const dayCount = new Map<string, number>();
  purchases.forEach(p => {
    const day = DAYS_OF_WEEK[new Date(p.createdAt).getDay()];
    dayCount.set(day, (dayCount.get(day) || 0) + 1);
  });

  let mostActiveDay = null;
  let maxCount = 0;
  dayCount.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDay = day;
    }
  });

  // Calculate average purchase time
  const purchaseTimes = purchases.map(p => {
    const date = new Date(p.createdAt);
    return date.getHours() * 60 + date.getMinutes();
  });

  let averagePurchaseTime = null;
  if (purchaseTimes.length > 0) {
    const avgMinutes = Math.floor(purchaseTimes.reduce((a, b) => a + b, 0) / purchaseTimes.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    averagePurchaseTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return {
    userId: user.id,
    username: user.username,
    totalSpent: Math.abs(purchases.reduce((sum, t) => sum + t.amount, 0)),
    totalDeposited: deposits.reduce((sum, t) => sum + t.amount, 0),
    balance: user.balance,
    purchaseCount: purchases.length,
    averagePurchaseTime,
    mostActiveDay,
    largestPurchase: Math.abs(Math.min(...purchases.map(t => t.amount), 0)),
    largestDeposit: Math.max(...deposits.map(t => t.amount), 0),
  };
}

function calculateTimeStatistics(
  transactions: Transaction[],
  timeRange: TimeRange
): TimeStatistics[] {
  const dailyStats = new Map<string, TimeStatistics>();
  
  const start = new Date(timeRange.start);
  const end = new Date(timeRange.end);
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyStats.set(dateStr, {
      date: new Date(d),
      totalPurchases: 0,
      totalAmount: 0,
      uniqueUsers: 0,
    });
  }

  transactions
    .filter(t => t.type === 'PURCHASE' && isInTimeRange(new Date(t.createdAt), timeRange))
    .forEach(t => {
      const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
      const stats = dailyStats.get(dateStr);
      if (stats) {
        stats.totalPurchases++;
        stats.totalAmount += Math.abs(t.amount);
        const uniqueUsers = new Set(transactions
          .filter(tx => tx.type === 'PURCHASE' && 
            new Date(tx.createdAt).toISOString().split('T')[0] === dateStr
          )
          .map(tx => tx.userId)
        );
        stats.uniqueUsers = uniqueUsers.size;
      }
    });

  return Array.from(dailyStats.values());
}

function calculateDayOfWeekStatistics(
  transactions: Transaction[],
  timeRange: TimeRange
): DayOfWeekStatistics[] {
  const stats = DAYS_OF_WEEK.map(day => ({
    day,
    purchases: 0,
    amount: 0,
  }));

  transactions
    .filter(t => t.type === 'PURCHASE' && isInTimeRange(new Date(t.createdAt), timeRange))
    .forEach(t => {
      const day = DAYS_OF_WEEK[new Date(t.createdAt).getDay()];
      const dayStats = stats.find(s => s.day === day)!;
      dayStats.purchases++;
      dayStats.amount += Math.abs(t.amount);
    });

  return stats;
}

function calculateHourlyStatistics(
  transactions: Transaction[],
  timeRange: TimeRange
): HourlyStatistics[] {
  const stats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    purchases: 0,
    amount: 0,
  }));

  transactions
    .filter(t => t.type === 'PURCHASE' && isInTimeRange(new Date(t.createdAt), timeRange))
    .forEach(t => {
      const hour = new Date(t.createdAt).getHours();
      stats[hour].purchases++;
      stats[hour].amount += Math.abs(t.amount);
    });

  return stats;
}

export function calculateStatistics(
  users: User[],
  transactions: Transaction[],
  filters: StatisticsFilters
): Statistics {
  const filteredUsers = filters.userIds 
    ? users.filter(u => filters.userIds!.includes(u.id))
    : users;

  const userStats = filteredUsers.map(user => 
    calculateUserStatistics(user, transactions, filters.timeRange)
  );

  const filteredTransactions = filters.userIds
    ? transactions.filter(t => filters.userIds!.includes(t.userId))
    : transactions;

  const purchases = filteredTransactions.filter(t => 
    t.type === 'PURCHASE' && 
    isInTimeRange(new Date(t.createdAt), filters.timeRange)
  );

  return {
    users: userStats,
    timeline: calculateTimeStatistics(filteredTransactions, filters.timeRange),
    dayOfWeek: calculateDayOfWeekStatistics(filteredTransactions, filters.timeRange),
    hourly: calculateHourlyStatistics(filteredTransactions, filters.timeRange),
    totals: {
      totalPurchases: purchases.length,
      totalAmount: Math.abs(purchases.reduce((sum, t) => sum + t.amount, 0)),
      averagePurchaseAmount: purchases.length ? 
        Math.abs(purchases.reduce((sum, t) => sum + t.amount, 0)) / purchases.length : 
        0,
      uniqueUsers: new Set(purchases.map(t => t.userId)).size,
    },
  };
}
