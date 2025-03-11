import { defineAchievement } from "./types";

export const achievements = [
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
  })
];
