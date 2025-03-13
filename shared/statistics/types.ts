export interface TimeRange {
  start: Date;
  end: Date;
}

export interface StatisticsFilters {
  timeRange: TimeRange;
  userIds?: number[];
}

export interface UserStatistics {
  userId: number;
  username: string;
  totalSpent: number;
  totalDeposited: number;
  balance: number;
  purchaseCount: number;
  averagePurchaseTime: string | null;
  mostActiveDay: string | null;
}

export interface TimeStatistics {
  date: Date;
  totalPurchases: number;
  totalAmount: number;
  uniqueUsers: number;
}

export interface DayOfWeekStatistics {
  day: string;
  purchases: number;
  amount: number;
}

export interface HourlyStatistics {
  hour: number;
  purchases: number;
  amount: number;
}

export interface Statistics {
  users: UserStatistics[];
  timeline: TimeStatistics[];
  dayOfWeek: DayOfWeekStatistics[];
  hourly: HourlyStatistics[];
  totals: {
    totalPurchases: number;
    totalAmount: number;
    averagePurchaseAmount: number;
    uniqueUsers: number;
  };
}
