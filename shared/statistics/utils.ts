import {
  BuyablesMap,
  DAYS_OF_WEEK,
  DaysOfWeekMapToHumanReadable,
  Transaction,
  User,
} from "@shared/schema";
import {
  Statistics,
  StatisticsParams,
  UserStatistics,
  CountByItem,
  HourlyStatistics,
  DayOfWeekStatistics,
  TimeStatistics,
  SystemStatistics, TimeRange,
} from "@shared/statistics/types";
import { storage } from "server/storage";

/**
 * Berechnet die Statistiken für einen Nutzer und das gesamte System innerhalb eines gegebenen Zeitbereichs.
 */
export async function calculateStatistics({
                                            userId,
                                            timeRange,
                                          }: StatisticsParams): Promise<Statistics> {
  // Hole die Transaktionen des Nutzers und alle Systemtransaktionen
  const userTransactions: Transaction[] = await storage.getTransactions(userId);
  const allTransactions: Transaction[] = await storage.getAllTransactions();
  const user: User | undefined = await storage.getUser(userId);
  const buyablesMap = await storage.getBuyablesMap();
  if (!user) throw new Error("User not found");

  // Filtere Transaktionen anhand des übergebenen Zeitbereichs
  const filteredUserTx = userTransactions.filter((tx) =>
      filterByTimeRange(tx, timeRange)
  );
  const filteredAllTx = allTransactions.filter((tx) =>
      filterByTimeRange(tx, timeRange)
  );

  // Trenne Käufe und Einzahlungen für den Nutzer
  const userPurchases = filteredUserTx
      .filter((tx) => tx.type === "PURCHASE")
      .map((tx) => ({ ...tx, amount: -tx.amount }));
  const userDeposits = filteredUserTx.filter((tx) => tx.type === "DEPOSIT");

  // Berechne Nutzerspezifische Statistiken
  const totalSpent = calculateTotalSpent(userPurchases);
  const averagePurchaseAmount = userPurchases.length > 0 ? totalSpent / userPurchases.length : 0;
  const totalDeposited = calculateTotalDeposited(userDeposits);
  const purchaseCountTotal = userPurchases.length;
  const purchaseCountByItem = calculatePurchaseCountByItem(userPurchases, buyablesMap);
  const hourlyStatistics = calculateHourlyStatistics(userPurchases);
  const dayOfWeekStatistics = calculateDayOfWeekStatistics(userPurchases);
  const timeline = calculateTimeline(userPurchases, timeRange);
  const averagePurchaseTime = calculateAveragePurchaseTime(userPurchases);
  const mostActiveDay = determineMostActiveDay(dayOfWeekStatistics);

  const userStatistics: UserStatistics = {
    totalSpent,
    averagePurchaseAmount,
    totalDeposited,
    balance: user.balance,
    purchaseCountTotal,
    purchaseCountByItem,
    hourlyStatistics,
    dayOfWeekStatistics,
    timeline,
    averagePurchaseTime,
    mostActiveDay,
  };

  // Systemstatistiken: Alle Kauftransaktionen im System (innerhalb des Zeitbereichs)
  const systemPurchases = filteredAllTx.filter((tx) => tx.type === "PURCHASE");
  const systemStatistics = calculateSystemStatistics(systemPurchases);

  return {
    users: userStatistics,
    system: systemStatistics,
  };
}

/* Hilfsfunktionen */

// Filtert eine Transaktion anhand des Zeitbereichs
function filterByTimeRange(tx: Transaction, timeRange: { start?: Date; end: Date }): boolean {
  const createdAt = new Date(tx.createdAt);
  if (timeRange.start && createdAt < timeRange.start) return false;
  if (createdAt > timeRange.end) return false;
  return true;
}

// Berechnet die Summe der Beträge aller Kauftransaktionen
function calculateTotalSpent(purchases: Transaction[]): number {
  return purchases.reduce((sum, tx) => sum + tx.amount, 0);
}

// Berechnet die Summe der Beträge aller Einzahlungs-Transaktionen
function calculateTotalDeposited(deposits: Transaction[]): number {
  return deposits.reduce((sum, tx) => sum + tx.amount, 0);
}

// Gruppiert die Käufe des Nutzers nach Artikel und zählt diese
function calculatePurchaseCountByItem(purchases: Transaction[], buyablesMap: BuyablesMap): CountByItem[] {
  const map = new Map<number, CountByItem>();
  for (const tx of purchases) {
    if (tx.item == null) continue;
    if (map.has(tx.item)) {
      map.get(tx.item)!.count++;
    } else {
      map.set(tx.item, { itemId: tx.item, name: buyablesMap[tx.item].name, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// Berechnet stündliche Statistiken (Käufe und Beträge) über 24 Stunden
function calculateHourlyStatistics(purchases: Transaction[]): HourlyStatistics[] {
  const hourlyMap = new Map<number, { purchases: number; amount: number }>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { purchases: 0, amount: 0 });
  }
  purchases.forEach((tx) => {
    const hour = new Date(tx.createdAt).getHours();
    const stats = hourlyMap.get(hour)!;
    stats.purchases++;
    stats.amount += tx.amount;
  });
  return Array.from(hourlyMap.entries()).map(([hour, stats]) => ({
    hour,
    purchases: stats.purchases,
    amount: stats.amount,
  }));
}

// Berechnet Statistiken für die einzelnen Wochentage
function calculateDayOfWeekStatistics(purchases: Transaction[]): DayOfWeekStatistics[] {
  const dayMap = new Map<string, { purchases: number; amount: number }>();
  // Initialisiere mit den Tagen aus DAYS_OF_WEEK
  DAYS_OF_WEEK.forEach((day) => dayMap.set(day, { purchases: 0, amount: 0 }));
  purchases.forEach((tx) => {
    const dayAbbr = getDayAbbreviation(new Date(tx.createdAt));
    if (dayMap.has(dayAbbr)) {
      const stats = dayMap.get(dayAbbr)!;
      stats.purchases++;
      stats.amount += tx.amount;
    }
  });
  return Array.from(dayMap.entries()).map(([day, stats]) => ({
    day,
    purchases: stats.purchases,
    amount: stats.amount,
  }));
}

// Wandelt ein Datum in die Wochentagsabkürzung (Mo, Di, …, So) um
function getDayAbbreviation(date: Date): string {
  return DAYS_OF_WEEK[date.getDay()];
}

function calculateTimeline(purchases: Transaction[], timeSpan: TimeRange): TimeStatistics[] {
  // Erstelle eine Map, um Käufe nach Tag zu gruppieren.
  const timelineMap = new Map<
      string,
      { date: Date; totalPurchases: number; totalAmount: number; uniqueUsers: Set<number> }
  >();

  // Nur Transaktionen berücksichtigen, die innerhalb des Zeitraums liegen.
  purchases.forEach((tx) => {
    const date = new Date(tx.createdAt);
    // Überspringe Transaktionen, die vor dem Start oder nach dem Enddatum liegen.
    if (timeSpan.start && date < timeSpan.start) return;
    if (date > timeSpan.end) return;
    const key = date.toISOString().split("T")[0];
    if (!timelineMap.has(key)) {
      timelineMap.set(key, {
        date: new Date(key),
        totalPurchases: 0,
        totalAmount: 0,
        uniqueUsers: new Set<number>(),
      });
    }
    const entry = timelineMap.get(key)!;
    entry.totalPurchases++;
    entry.totalAmount += tx.amount;
    entry.uniqueUsers.add(tx.userId);
  });

  // Bestimme den Start- und Endtag: Falls timeSpan.start nicht definiert ist, nutzen wir timeSpan.end als einzigen Tag.
  const startDate = timeSpan.start ? new Date(timeSpan.start) : new Date(timeSpan.end);
  const endDate = new Date(timeSpan.end);

  // Erzeuge für jeden Tag im Zeitraum einen Eintrag (auch wenn keine Käufe vorhanden sind)
  const result: TimeStatistics[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    if (timelineMap.has(key)) {
      const entry = timelineMap.get(key)!;
      result.push({
        date: entry.date,
        totalPurchases: entry.totalPurchases,
        totalAmount: entry.totalAmount,
        uniqueUsers: entry.uniqueUsers.size,
      });
    } else {
      result.push({
        date: new Date(key),
        totalPurchases: 0,
        totalAmount: 0,
        uniqueUsers: 0,
      });
    }
  }

  return result;
}

// Berechnet die durchschnittliche Kaufzeit (HH:mm) über alle Käufe
function calculateAveragePurchaseTime(purchases: Transaction[]): string | null {
  if (purchases.length === 0) return null;
  const totalMinutes = purchases.reduce((sum, tx) => {
    const date = new Date(tx.createdAt);
    return sum + date.getHours() * 60 + date.getMinutes();
  }, 0);
  const avgMinutes = Math.floor(totalMinutes / purchases.length);
  const hours = Math.floor(avgMinutes / 60);
  const minutes = avgMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// Bestimmt den aktivsten Wochentag anhand der Kaufanzahl und übersetzt ihn in eine menschenlesbare Form
function determineMostActiveDay(dayStats: DayOfWeekStatistics[]): string | null {
  let mostActive: DayOfWeekStatistics | null = null;
  for (const stat of dayStats) {
    if (!mostActive || stat.purchases > mostActive.purchases) {
      mostActive = stat;
    }
  }
  return mostActive ? DaysOfWeekMapToHumanReadable[mostActive.day] || mostActive.day : null;
}

// Berechnet die Systemstatistiken aus allen Kauftransaktionen
function calculateSystemStatistics(purchases: Transaction[]): SystemStatistics {
  const totalPurchases = purchases.length;
  const totalAmount = -purchases.reduce((sum, tx) => sum + tx.amount, 0);
  const averagePurchaseAmount =
      totalPurchases > 0 ? totalAmount / totalPurchases : 0;
  const uniqueActiveUsers = new Set(purchases.map((tx) => tx.userId)).size;
  return {
    totalPurchases,
    totalAmount,
    averagePurchaseAmount,
    uniqueActiveUsers,
  };
}
