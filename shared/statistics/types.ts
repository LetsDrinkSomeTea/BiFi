export interface TimeRange {
  start?: Date;
  end: Date;
}

export interface UserStatistics {
  totalSpent: number;
  averagePurchaseAmount: number;
  totalDeposited: number;
  balance: number;
  purchaseCountTotal: number;
  purchaseCountByItem: CountByItem[];
  hourlyStatistics: HourlyStatistics[];
  dayOfWeekStatistics: DayOfWeekStatistics[];
  timeline: TimeStatistics[];
  averagePurchaseTime: string | null;
  mostActiveDay: string | null;
}

export interface CountByItem {
  itemId: number;
  name: string;
  count: number;
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

export interface SystemStatistics {
  totalPurchases: number;
  totalAmount: number;
  averagePurchaseAmount: number;
  uniqueActiveUsers: number;
}

export interface Statistics {
  users: UserStatistics;
  system: SystemStatistics;
}

export interface StatisticsParams {
  userId: number;
  timeRange: TimeRange;
}