import { defineAchievement } from "./types";

// Hilfsfunktion: Konvertiert ein Datum in die Zeitzone "Europe/Berlin"
function getBerlinDate(date: string | Date): Date {
  return new Date(
    new Date(date).toLocaleString("en-US", { timeZone: "Europe/Berlin" }),
  );
}

export const achievements = [
  // Existing achievements
  defineAchievement({
    id: "first_purchase",
    name: "First Purchase",
    description: "Made your first drink purchase",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      return transactions.filter((t) => t.type === "PURCHASE").length === 1;
    },
  }),

  defineAchievement({
    id: "regular_customer",
    name: "Regular Customer",
    description: "Purchased 10 or more drinks",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      return transactions.filter((t) => t.type === "PURCHASE").length >= 10;
    },
  }),

  defineAchievement({
    id: "big_spender",
    name: "Big Spender",
    description: "Balance went below -€10",
    check: ({ user }) => user.balance <= -10,
  }),

  defineAchievement({
    id: "early_bird",
    name: "Early Bird",
    description: "Purchased a drink before 9 AM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const hour = getBerlinDate(currentTransaction.createdAt).getHours();
      console.log(hour);
      return hour < 9;
    },
  }),

  defineAchievement({
    id: "night_owl",
    name: "Night Owl",
    description: "Purchased a drink after 10 PM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const hour = getBerlinDate(currentTransaction.createdAt).getHours();
      return hour >= 22;
    },
  }),

  defineAchievement({
    id: "responsible_drinker",
    name: "Responsible Drinker",
    description: "Deposit money before your balance goes negative",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT")
        return false;
      return user.balance > 0;
    },
  }),

  defineAchievement({
    id: "marathon_session",
    name: "Marathon Session",
    description: "Purchased 5 drinks in a single day",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const today = getBerlinDate(currentTransaction.createdAt).toDateString();
      const todayTransactions = transactions.filter(
        (t) =>
          getBerlinDate(t.createdAt).toDateString() === today &&
          t.type === "PURCHASE",
      );
      return todayTransactions.length >= 5;
    },
  }),

  defineAchievement({
    id: "round_number",
    name: "Round Number",
    description:
      "Made exactly the 100th, 500th, or 1000th purchase in the system",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseCount = transactions.filter(
        (t) => t.type === "PURCHASE",
      ).length;
      return (
        purchaseCount === 100 || purchaseCount === 500 || purchaseCount === 1000
      );
    },
  }),

  defineAchievement({
    id: "exact_change",
    name: "Exact Change",
    description: "Deposited the exact amount to bring balance to zero",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT")
        return false;
      const previousBalance = user.balance - currentTransaction.amount;
      return previousBalance < 0 && user.balance === 0;
    },
  }),

  defineAchievement({
    id: "lucky_seven",
    name: "Lucky Seven",
    description: "Make a deposit as the 7th, 77th, or 777th transaction",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT")
        return false;
      const count = transactions.length;
      return count === 7 || count === 77 || count === 777;
    },
  }),

  defineAchievement({
    id: "caffeine_rush",
    name: "Caffeine Rush",
    description: "Made 3 purchases within a single hour",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseTime = getBerlinDate(
        currentTransaction.createdAt,
      ).getTime();
      const hourAgo = purchaseTime - 3600000; // 1 hour in milliseconds
      const recentPurchases = transactions.filter((t) => {
        if (t.type !== "PURCHASE") return false;
        const tTime = getBerlinDate(t.createdAt).getTime();
        return tTime >= hourAgo && tTime <= purchaseTime;
      });
      return recentPurchases.length >= 3;
    },
  }),

  defineAchievement({
    id: "collector",
    name: "Achievement Collector",
    description: "Earned 10 different achievements",
    check: ({ user }) => {
      return user.achievements.length >= 10;
    },
  }),

  defineAchievement({
    id: "master_collector",
    name: "Master Collector",
    description: "Earned 20 different achievements",
    check: ({ user }) => {
      return user.achievements.length >= 20;
    },
  }),

  defineAchievement({
    id: "debt_collector",
    name: "Debt Collector",
    description: "Went from negative balance to positive in one deposit",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT")
        return false;
      return user.balance > 0 && user.balance - currentTransaction.amount < 0;
    },
  }),

  defineAchievement({
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Purchased a drink on Sunday and also on Saturday (yesterday)",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const currentDate = getBerlinDate(currentTransaction.createdAt);
      // Prüfe, ob currentTransaction an einem Sonntag stattfindet
      if (currentDate.getDay() !== 0) return false; // Sonntag hat getDay() === 0
      // Berechne den Vortag (Samstag)
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      // Suche nach einer Kauftransaktion, die am Samstag stattfand
      return transactions.some(
        (t) =>
          t.type === "PURCHASE" &&
          getBerlinDate(t.createdAt).toDateString() === yesterdayStr,
      );
    },
  }),

  defineAchievement({
    id: "happy_hour",
    name: "Happy Hour",
    description: "Purchased a drink between 4 PM and 6 PM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const hour = getBerlinDate(currentTransaction.createdAt).getHours();
      return hour >= 16 && hour < 18;
    },
  }),

  defineAchievement({
    id: "hydration_expert",
    name: "Hydration Expert",
    description:
      "Purchased 3 drinks in a single day on at least 5 different days",
    check: ({ transactions }) => {
      // Gruppiere Kauftransaktionen nach Tag (basierend auf Berliner Zeit)
      const purchasesByDay = transactions
        .filter((t) => t.type === "PURCHASE")
        .reduce(
          (acc, t) => {
            const day = getBerlinDate(t.createdAt).toDateString();
            if (!acc[day]) acc[day] = 0;
            acc[day]++;
            return acc;
          },
          {} as Record<string, number>,
        );
      // Zähle Tage mit 3 oder mehr Käufen
      const daysWithThreePurchases = Object.values(purchasesByDay).filter(
        (count) => count >= 3,
      ).length;
      return daysWithThreePurchases >= 5;
    },
  }),

  defineAchievement({
    id: "month_streak",
    name: "Month Streak",
    description: "Purchased at least one drink in each of 4 consecutive weeks",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      if (transactions.length < 4) return false;
      // Filtere Kauftransaktionen und sortiere nach Datum (Berliner Zeit)
      const purchases = transactions
        .filter((t) => t.type === "PURCHASE")
        .sort(
          (a, b) =>
            getBerlinDate(a.createdAt).getTime() -
            getBerlinDate(b.createdAt).getTime(),
        );
      if (purchases.length < 4) return false;
      // Gruppiere nach Woche (unter Verwendung der Berliner Zeit)
      const weekMap = new Map<string, boolean>();
      purchases.forEach((p) => {
        const date = getBerlinDate(p.createdAt);
        const weekNum = getISOWeekNumber(date);
        weekMap.set(weekNum, true);
      });
      // Prüfe auf 4 aufeinanderfolgende Wochen
      const weeks = Array.from(weekMap.keys()).sort();
      let maxStreak = 1;
      let currentStreak = 1;
      for (let i = 1; i < weeks.length; i++) {
        const [prevYear, prevWeek] = weeks[i - 1].split("-").map(Number);
        const [currYear, currWeek] = weeks[i].split("-").map(Number);
        if (
          (prevYear === currYear && currWeek - prevWeek === 1) ||
          (currYear - prevYear === 1 && prevWeek === 52 && currWeek === 1)
        ) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      return maxStreak >= 4;
    },
  }),

  // NEW ACHIEVEMENTS BELOW

  defineAchievement({
    id: "perfect_balance",
    name: "Perfect Balance",
    description: "End a day with exactly €0.00 balance",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction) return false;
      return user.balance === 0;
    },
  }),

  defineAchievement({
    id: "lunch_break",
    name: "Lunch Break",
    description: "Purchased a drink between 12 PM and 1 PM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const hour = getBerlinDate(currentTransaction.createdAt).getHours();
      return hour === 12;
    },
  }),

  defineAchievement({
    id: "daily_ritual",
    name: "Daily Ritual",
    description:
      "Purchased at least one drink every day for 5 consecutive days",
    check: ({ transactions }) => {
      // Gruppiere Kauftransaktionen nach Tag (Berliner Zeit)
      const purchasesByDay = new Map<string, boolean>();
      transactions
        .filter((t) => t.type === "PURCHASE")
        .forEach((t) => {
          const day = getBerlinDate(t.createdAt).toISOString().split("T")[0];
          purchasesByDay.set(day, true);
        });
      // Sortiere Tage
      const days = Array.from(purchasesByDay.keys()).sort();
      let maxStreak = 1;
      let currentStreak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diffDays = Math.floor(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      return maxStreak >= 5;
    },
  }),

  defineAchievement({
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Made 5 purchases within 15 minutes",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseTime = getBerlinDate(
        currentTransaction.createdAt,
      ).getTime();
      const timeWindow = 15 * 60 * 1000; // 15 Minuten in Millisekunden
      const recentPurchases = transactions.filter((t) => {
        if (t.type !== "PURCHASE") return false;
        const tTime = getBerlinDate(t.createdAt).getTime();
        return tTime >= purchaseTime - timeWindow && tTime <= purchaseTime;
      });
      return recentPurchases.length >= 5;
    },
  }),

  defineAchievement({
    id: "elite",
    name: "Elite",
    description: "Made the 1337th purchase",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseCount = transactions.filter(
        (t) => t.type === "PURCHASE",
      ).length;
      return purchaseCount === 1337;
    },
  }),

  defineAchievement({
    id: "monday_blues",
    name: "Monday Blues",
    description: "Purchased more than 3 drinks on a Monday",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseDate = getBerlinDate(currentTransaction.createdAt);
      if (purchaseDate.getDay() !== 1) return false; // Montag hat getDay() === 1
      const mondayStr = purchaseDate.toDateString();
      const mondayPurchases = transactions.filter(
        (t) =>
          t.type === "PURCHASE" &&
          getBerlinDate(t.createdAt).toDateString() === mondayStr,
      );
      return mondayPurchases.length > 3;
    },
  }),

  defineAchievement({
    id: "big_deposit",
    name: "Big Deposit",
    description: "Made a single deposit of €50 or more",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT")
        return false;
      return currentTransaction.amount >= 50;
    },
  }),

  defineAchievement({
    id: "triple_digits",
    name: "Triple Digits",
    description: "Reached a balance of €100 or more",
    check: ({ user }) => user.balance >= 100,
  }),

  defineAchievement({
    id: "deep_in_debt",
    name: "Deep in Debt",
    description: "Balance went below -€20",
    check: ({ user }) => user.balance <= -20,
  }),

  defineAchievement({
    id: "financial_recovery",
    name: "Financial Recovery",
    description: "Went from below -€20 to positive balance",
    check: ({ user, transactions }) => {
      if (user.balance <= 0) return false;
      return transactions.some((t) => {
        const txnIndex = transactions.indexOf(t);
        const txnsUntil = transactions.slice(0, txnIndex + 1);
        const balanceAtPoint = txnsUntil.reduce((sum, t) => sum + t.amount, 0);
        return balanceAtPoint <= -20;
      });
    },
  }),

  defineAchievement({
    id: "seasonal_drinker",
    name: "Seasonal Drinker",
    description: "Purchased drinks in all four seasons of a year",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseMonths = new Set<number>();
      transactions
        .filter((t) => t.type === "PURCHASE")
        .forEach((t) => {
          const month = getBerlinDate(t.createdAt).getMonth();
          purchaseMonths.add(month);
        });
      const winter = [11, 0, 1].some((m) => purchaseMonths.has(m));
      const spring = [2, 3, 4].some((m) => purchaseMonths.has(m));
      const summer = [5, 6, 7].some((m) => purchaseMonths.has(m));
      const fall = [8, 9, 10].some((m) => purchaseMonths.has(m));
      return winter && spring && summer && fall;
    },
  }),

  defineAchievement({
    id: "holiday_spirit",
    name: "Holiday Spirit",
    description:
      "Made a purchase on a major holiday (Christmas, New Year's, etc.)",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const date = getBerlinDate(currentTransaction.createdAt);
      const month = date.getMonth();
      const day = date.getDate();
      return (
        (month === 0 && day === 1) || // Neujahr
        (month === 11 && day === 25) || // Weihnachten
        (month === 11 && day === 31) || // Silvester
        (month === 10 && day === 31) || // Halloween
        (month === 6 && day === 4) || // US-Unabhängigkeitstag
        (month === 1 && day === 14) // Valentinstag
      );
    },
  }),

  defineAchievement({
    id: "fibonacci_balance",
    name: "Fibonacci Balance",
    description:
      "Balance matched a Fibonacci number (1, 2, 3, 5, 8, 13, 21, 34, 55, 89)",
    check: ({ user }) => {
      const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      const balance = Math.abs(user.balance);
      return (
        fibonacci.includes(balance) || fibonacci.includes(Math.round(balance))
      );
    },
  }),

  defineAchievement({
    id: "consistent_buyer",
    name: "Consistent Buyer",
    description: "Made purchases at the same time of day (±30 min) for 5 days",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const purchaseTimes = transactions
        .filter((t) => t.type === "PURCHASE")
        .map((t) => {
          const date = getBerlinDate(t.createdAt);
          return date.getHours() * 60 + date.getMinutes(); // Minuten seit Mitternacht
        });
      if (purchaseTimes.length < 5) return false;
      for (let time of purchaseTimes) {
        const similarTimes = purchaseTimes.filter(
          (t) =>
            Math.abs(t - time) <= 30 ||
            Math.abs(t - time - 1440) <= 30 ||
            Math.abs(t - time + 1440) <= 30,
        );
        if (similarTimes.length >= 5) return true;
      }
      return false;
    },
  }),

  defineAchievement({
    id: "perfect_ten",
    name: "Perfect Ten",
    description: "Made exactly 10 purchases in a single week",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const txnDate = getBerlinDate(currentTransaction.createdAt);
      const weekStart = new Date(txnDate);
      weekStart.setDate(txnDate.getDate() - txnDate.getDay()); // Wochenstart (Sonntag)
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const weekPurchases = transactions.filter((t) => {
        if (t.type !== "PURCHASE") return false;
        const date = getBerlinDate(t.createdAt);
        return date >= weekStart && date < weekEnd;
      });
      return weekPurchases.length === 10;
    },
  }),

  defineAchievement({
    id: "golden_ratio",
    name: "Golden Ratio",
    description:
      "Deposit-to-purchase ratio is close to the golden ratio (1.618)",
    check: ({ transactions }) => {
      const deposits = transactions.filter((t) => t.type === "DEPOSIT").length;
      const purchases = transactions.filter(
        (t) => t.type === "PURCHASE",
      ).length;
      if (deposits < 5 || purchases < 5) return false;
      const ratio = deposits / purchases;
      return Math.abs(ratio - 1.618) < 0.1;
    },
  }),

  defineAchievement({
    id: "binary_balance",
    name: "Binary Balance",
    description: "Balance is a power of 2 (2, 4, 8, 16, 32, 64)",
    check: ({ user }) => {
      const balance = Math.abs(user.balance);
      const powers = [2, 4, 8, 16, 32, 64];
      return powers.includes(balance) || powers.includes(Math.round(balance));
    },
  }),

  defineAchievement({
    id: "balanced_diet",
    name: "Balanced Diet",
    description:
      "Made the same number of purchases on each day of the workweek",
    check: ({ transactions }) => {
      const purchasesByDay = [0, 0, 0, 0, 0]; // Montag bis Freitag
      transactions
        .filter((t) => t.type === "PURCHASE")
        .forEach((t) => {
          const day = getBerlinDate(t.createdAt).getDay();
          if (day >= 1 && day <= 5) {
            purchasesByDay[day - 1]++;
          }
        });
      return purchasesByDay.every(
        (count) => count > 0 && count === purchasesByDay[0],
      );
    },
  }),

  defineAchievement({
    id: "minute_to_midnight",
    name: "Minute to Midnight",
    description: "Made a purchase between 11:45 PM and midnight",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const date = getBerlinDate(currentTransaction.createdAt);
      const hour = date.getHours();
      const minute = date.getMinutes();
      return hour === 23 && minute >= 45;
    },
  }),

  defineAchievement({
    id: "first_light",
    name: "First Light",
    description: "Made a purchase between midnight and 5 AM",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE")
        return false;
      const hour = getBerlinDate(currentTransaction.createdAt).getHours();
      return hour >= 0 && hour < 5;
    },
  }),
];

// Helper-Funktion zur Berechnung der ISO-Woche (unter Verwendung der Berliner Zeit)
function getISOWeekNumber(date: Date): string {
  const berlinDate = getBerlinDate(date);
  berlinDate.setHours(0, 0, 0, 0);
  berlinDate.setDate(
    berlinDate.getDate() + 3 - ((berlinDate.getDay() + 6) % 7),
  );
  const week1 = new Date(berlinDate.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((berlinDate.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${berlinDate.getFullYear()}-${weekNum}`;
}
