
import { defineAchievement } from "./types";

export const achievements = [
  // Existing achievements
  defineAchievement({
    id: "first_purchase",
    name: "First Purchase",
    description: "Made your first drink purchase",
    check: ({ transactions }) => transactions.length === 1
  }),
  
  defineAchievement({
    id: "regular_customer",
    name: "Regular Customer",
    description: "Purchased 10 or more drinks",
    check: ({ transactions }) => 
      transactions.filter(t => t.type === "PURCHASE").length >= 10
  }),
  
  defineAchievement({
    id: "big_spender",
    name: "Big Spender",
    description: "Balance went below -€10",
    check: ({ user }) => user.balance <= -10
  }),
  
  defineAchievement({
    id: "early_bird",
    name: "Early Bird",
    description: "Purchased a drink before 9 AM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction) return false;
      const hour = new Date(currentTransaction.createdAt).getHours();
      return hour < 9;
    }
  }),
  
  defineAchievement({
    id: "night_owl",
    name: "Night Owl",
    description: "Purchased a drink after 10 PM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction) return false;
      const hour = new Date(currentTransaction.createdAt).getHours();
      return hour >= 22;
    }
  }),
  
  defineAchievement({
    id: "responsible_drinker",
    name: "Responsible Drinker",
    description: "Deposit money before your balance goes negative",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      return user.balance > 0;
    }
  }),
  
  defineAchievement({
    id: "marathon_session",
    name: "Marathon Session",
    description: "Purchased 5 drinks in a single day",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction) return false;
      const today = new Date(currentTransaction.createdAt).toDateString();
      const todayTransactions = transactions.filter(t => 
        new Date(t.createdAt).toDateString() === today && 
        t.type === "PURCHASE"
      );
      return todayTransactions.length >= 5;
    }
  }),
  
  // New achievements
  defineAchievement({
    id: "debt_collector",
    name: "Debt Collector",
    description: "Went from negative balance to positive in one deposit",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      return user.balance > 0 && (user.balance - currentTransaction.amount) < 0;
    }
  }),
  
  defineAchievement({
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Purchased a drink on both Saturday and Sunday",
    check: ({ transactions }) => {
      const saturdayPurchase = transactions.some(t => {
        const day = new Date(t.createdAt).getDay();
        return day === 6 && t.type === "PURCHASE";
      });
      
      const sundayPurchase = transactions.some(t => {
        const day = new Date(t.createdAt).getDay();
        return day === 0 && t.type === "PURCHASE";
      });
      
      return saturdayPurchase && sundayPurchase;
    }
  }),
  
  defineAchievement({
    id: "happy_hour",
    name: "Happy Hour",
    description: "Purchased a drink between 4 PM and 6 PM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      const hour = new Date(currentTransaction.createdAt).getHours();
      return hour >= 16 && hour < 18;
    }
  }),
  
  defineAchievement({
    id: "hydration_expert",
    name: "Hydration Expert",
    description: "Purchased 3 drinks in a single day on at least 5 different days",
    check: ({ transactions }) => {
      // Group transactions by day
      const purchasesByDay = transactions
        .filter(t => t.type === "PURCHASE")
        .reduce((acc, t) => {
          const day = new Date(t.createdAt).toDateString();
          if (!acc[day]) acc[day] = 0;
          acc[day]++;
          return acc;
        }, {} as Record<string, number>);
      
      // Count days with 3+ purchases
      const daysWithThreePurchases = Object.values(purchasesByDay)
        .filter(count => count >= 3)
        .length;
      
      return daysWithThreePurchases >= 5;
    }
  }),
  
  defineAchievement({
    id: "month_streak",
    name: "Month Streak",
    description: "Purchased at least one drink in each of 4 consecutive weeks",
    check: ({ transactions }) => {
      if (transactions.filter(t => t.type === "PURCHASE").length < 4) return false;
      
      // Group purchases by week
      const purchasesByWeek = transactions
        .filter(t => t.type === "PURCHASE")
        .reduce((acc, t) => {
          const date = new Date(t.createdAt);
          const year = date.getFullYear();
          const week = Math.floor((date.getDate() - 1) / 7) + 1;
          const month = date.getMonth();
          const key = `${year}-${month}-${week}`;
          
          if (!acc[key]) acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
      
      // Get ordered weeks
      const weeks = Object.keys(purchasesByWeek)
        .map(key => {
          const [year, month, week] = key.split('-').map(Number);
          return { year, month, week, key };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.month !== b.month) return a.month - b.month;
          return a.week - b.week;
        });
      
      // Check for streak of 4 consecutive weeks
      for (let i = 0; i <= weeks.length - 4; i++) {
        let isStreak = true;
        for (let j = 0; j < 3; j++) {
          const current = weeks[i + j];
          const next = weeks[i + j + 1];
          
          const isConsecutive = 
            (current.year === next.year && current.month === next.month && next.week - current.week === 1) ||
            (current.year === next.year && next.month - current.month === 1 && current.week === 4 && next.week === 1) ||
            (next.year - current.year === 1 && current.month === 11 && next.month === 0 && current.week === 4 && next.week === 1);
          
          if (!isConsecutive) {
            isStreak = false;
            break;
          }
        }
        
        if (isStreak) return true;
      }
      
      return false;
    }
  }),
  
  defineAchievement({
    id: "big_tipper",
    name: "Big Tipper",
    description: "Made a deposit of €20 or more",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      return currentTransaction.amount >= 20;
    }
  }),
  
  defineAchievement({
    id: "monday_blues",
    name: "Monday Blues",
    description: "Purchased a drink on a Monday before noon",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      const date = new Date(currentTransaction.createdAt);
      return date.getDay() === 1 && date.getHours() < 12;
    }
  }),
  
  defineAchievement({
    id: "one_for_the_road",
    name: "One for the Road",
    description: "Last purchase of the day after 8 PM",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      
      const purchaseDate = new Date(currentTransaction.createdAt);
      const purchaseHour = purchaseDate.getHours();
      
      if (purchaseHour < 20) return false;
      
      const sameDayPurchases = transactions.filter(t => {
        if (t.type !== "PURCHASE") return false;
        const tDate = new Date(t.createdAt);
        return tDate.toDateString() === purchaseDate.toDateString() &&
               tDate > purchaseDate;
      });
      
      return sameDayPurchases.length === 0;
    }
  }),
  
  defineAchievement({
    id: "balanced_budget",
    name: "Balanced Budget",
    description: "Maintained a balance of exactly €0.00",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction) return false;
      return user.balance === 0;
    }
  }),
  
  defineAchievement({
    id: "holiday_spirit",
    name: "Holiday Spirit",
    description: "Purchased a drink on a major holiday (Dec 25, Jan 1, etc.)",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      
      const date = new Date(currentTransaction.createdAt);
      const month = date.getMonth();
      const day = date.getDate();
      
      // Check for major holidays
      const isChristmas = month === 11 && day === 25;  // Dec 25
      const isNewYear = month === 0 && day === 1;      // Jan 1
      const isHalloween = month === 9 && day === 31;   // Oct 31
      const isValentines = month === 1 && day === 14;  // Feb 14
      
      return isChristmas || isNewYear || isHalloween || isValentines;
    }
  }),
  
  defineAchievement({
    id: "round_number",
    name: "Round Number",
    description: "Made exactly the 100th, 500th, or 1000th purchase in the system",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      
      const purchaseCount = transactions.filter(t => t.type === "PURCHASE").length;
      return purchaseCount === 100 || purchaseCount === 500 || purchaseCount === 1000;
    }
  }),
  
  defineAchievement({
    id: "exact_change",
    name: "Exact Change",
    description: "Deposited the exact amount to bring balance to zero",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      const previousBalance = user.balance - currentTransaction.amount;
      return previousBalance < 0 && user.balance === 0;
    }
  }),
  
  defineAchievement({
    id: "lucky_seven",
    name: "Lucky Seven",
    description: "Made a purchase as the 7th, 77th, or 777th transaction",
    check: ({ transactions }) => {
      const count = transactions.length;
      return count === 7 || count === 77 || count === 777;
    }
  }),
  
  defineAchievement({
    id: "caffeine_rush",
    name: "Caffeine Rush",
    description: "Made 3 purchases within a single hour",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      
      const purchaseTime = new Date(currentTransaction.createdAt).getTime();
      const hourAgo = purchaseTime - 3600000; // 1 hour in milliseconds
      
      const recentPurchases = transactions.filter(t => {
        if (t.type !== "PURCHASE") return false;
        const tTime = new Date(t.createdAt).getTime();
        return tTime >= hourAgo && tTime <= purchaseTime;
      });
      
      return recentPurchases.length >= 3;
    }
  }),
  
  defineAchievement({
    id: "collector",
    name: "Achievement Collector",
    description: "Earned 10 different achievements",
    check: ({ user }) => {
      return user.achievements.length >= 10;
    }
  }),
  
  defineAchievement({
    id: "master_collector",
    name: "Master Collector",
    description: "Earned 20 different achievements",
    check: ({ user }) => {
      return user.achievements.length >= 20;
    }
  })
];
