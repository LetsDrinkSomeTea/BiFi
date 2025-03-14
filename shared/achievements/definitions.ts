import { defineAchievement } from "./types";
import { toZonedTime } from 'date-fns-tz';

// Helper-Funktion zur Umrechnung in Berliner Zeit
const toBerlinTime = (dateInput: string | Date): Date => {
  return toZonedTime(new Date(dateInput), 'Europe/Berlin');
};

export const achievements = [
  // Getränke-Käufe
  defineAchievement({
    id: "erster_kauf",
    name: "Erster Kauf",
    description: "Dein allererster Einkauf",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE") return false;
      const purchaseCount = transactions.filter(t => t.type === "PURCHASE").length;
      return purchaseCount >= 1;
    }
  }),
  defineAchievement({
    id: "dauergast",
    name: "Dauergast",
    description: "10 Mal eingekauft",
    check: ({ transactions }) => {
      const purchaseCount = transactions.filter(t => t.type === "PURCHASE").length;
      return purchaseCount >= 10;
    }
  }),

  // Kontostand-/Einzahlungs-Erfolge
  defineAchievement({
    id: "pleite",
    name: "Pleite",
    description: "Kontostand fiel unter –10€",
    check: ({ user }) => user.balance < -10
  }),
  defineAchievement({
    id: "tief_verschuldet",
    name: "Tief verschuldet",
    description: "Kontostand fiel unter –20€",
    check: ({ user }) => user.balance < -20
  }),
  defineAchievement({
    id: "verantwortungsvoll",
    name: "Verantwortungsvoll",
    description: "Habe einen positiven Kontostand",
    check: ({ user }) => user.balance > 0
  }),
  defineAchievement({
    id: "passendes_kleingeld",
    name: "Passendes Kleingeld",
    description: "Exakten Betrag eingezahlt, um den Kontostand auf Null zu bringen",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      // Berechne den vorherigen Kontostand
      const previousBalance = user.balance - currentTransaction.amount;
      return user.balance === 0 && previousBalance < 0;
    }
  }),
  defineAchievement({
    id: "wendepunkt",
    name: "Wendepunkt",
    description: "Von negativ zu positiv in einer Einzahlung gewechselt",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      const previousBalance = user.balance - currentTransaction.amount;
      return previousBalance < 0 && user.balance > 0;
    }
  }),
  defineAchievement({
    id: "grosse_einzahlung",
    name: "Große Einzahlung",
    description: "Eine einzelne Einzahlung von 50€ getätigt",
    check: ({ currentTransaction }) => {
      if(!currentTransaction) return false;
      return currentTransaction!.type === "DEPOSIT" &&
          currentTransaction!.amount >= 50;
    }
  }),
  defineAchievement({
    id: "dreistellig",
    name: "Dreistellig",
    description: "Kontostand von 100€ erreicht",
    check: ({ user }) => user.balance >= 100
  }),
  defineAchievement({
    id: "finanz_phenix",
    name: "Finanz-Phönix",
    description: "Von unter –20€ in den positiven Bereich mit einer Einzahlung gewechselt",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      const previousBalance = user.balance - currentTransaction.amount;
      return previousBalance < -20 && user.balance > 0;
    }
  }),
  defineAchievement({
    id: "ich_hab_s_ja",
    name: "Ich habs ja",
    description: "Bei einem positiven Kontostand nochmal etwas eingezahlt",
    check: ({ user, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT") return false;
      const previousBalance = user.balance - currentTransaction.amount;
      return previousBalance > 0 && user.balance > previousBalance;
    }
  }),

  // Zeitbezogene Getränkekäufe
  defineAchievement({
    id: "frueher_vogel",
    name: "Früher Vogel",
    description: "Ein Getränk zwischen 6 und 10 Uhr morgens gekauft",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      const hour = berlinDate.getHours();
      return hour >= 6 && hour < 10;
    }
  }),
  defineAchievement({
    id: "geisterstunde",
    name: "Geisterstunde",
    description: "Ein Einkauf um Mitternacht getätigt",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      const hour = berlinDate.getHours();
      const minute = berlinDate.getMinutes();
      return (hour === 23 && minute >= 59) || (hour === 0 && minute < 1);
    }
  }),
  defineAchievement({
    id: "happy_hour",
    name: "Happy Hour",
    description: "Ein Getränk zwischen 16 und 18 Uhr gekauft",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      const hour = berlinDate.getHours();
      return hour >= 16 && hour < 18;
    }
  }),
  defineAchievement({
    id: "mittagspause",
    name: "Mittagspause",
    description: "Ein Getränk zwischen 12 und 13 Uhr gekauft",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      return berlinDate.getHours() === 12;
    }
  }),
  defineAchievement({
    id: "morgenroete",
    name: "Morgenröte",
    description: "Ein Getränk zwischen 4 und 6 Uhr morgens gekauft",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      const hour = berlinDate.getHours();
      return hour >= 4 && hour < 6;
    }
  }),

  // Kaufmuster
  defineAchievement({
    id: "shopper",
    name: "Shopper",
    description: "5 Einkäufe an einem Tag gekauft",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;

      // Bestimme den Ziel-Tag (in Berliner Zeit) basierend auf dem aktuellen Kauf
      const berlinCurrent = toBerlinTime(currentTransaction.createdAt);
      const targetDay = berlinCurrent.toISOString().split("T")[0];

      // Filtere alle Käufe des Ziel-Tages
      const dayPurchases = transactions.filter(t =>
          t.type === "PURCHASE" &&
          t.createdAt &&
          toBerlinTime(t.createdAt).toISOString().split("T")[0] === targetDay
      );

      if (dayPurchases.length < 5) return false;

      // Sortiere die Käufe chronologisch
      const sortedPurchases = dayPurchases.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Suche nach einer Sequenz von 5 Käufen, bei denen jeweils der Abstand zum Vorgänger >= 15 Minuten beträgt.
      let streak = 1; // Der erste Kauf zählt als Start der Sequenz.
      for (let i = 1; i < sortedPurchases.length; i++) {
        const prevTime = new Date(sortedPurchases[i - 1].createdAt).getTime();
        const currTime = new Date(sortedPurchases[i].createdAt).getTime();
        if (currTime - prevTime >= 15 * 60 * 1000) {
          streak++;
          if (streak >= 5) return true;
        } else {
          // Bricht die Sequenz ab, starte neu mit dem aktuellen Kauf
          streak = 1;
        }
      }
      return false;
    }
  }),

  defineAchievement({
    id: "schnellfeuer",
    name: "Schnellfeuer",
    description: "Drei Käufe innerhalb einer Stunde (mindestens 5 Minuten Abstand)",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const purchases = transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 0; i < purchases.length - 2; i++) {
        const first = new Date(purchases[i].createdAt);
        const second = new Date(purchases[i + 1].createdAt);
        const third = new Date(purchases[i + 2].createdAt);
        if (
            (second.getTime() - first.getTime() >= 5 * 60 * 1000) &&
            (third.getTime() - second.getTime() >= 5 * 60 * 1000) &&
            (third.getTime() - first.getTime() <= 60 * 60 * 1000)
        ) {
          return true;
        }
      }
      return false;
    }
  }),

  defineAchievement({
    id: "intervall_trinker",
    name: "Intervall-Trinker",
    description: "Zwei exakt gleichlange Pausen zwischen aufeinanderfolgenden Einkäufen",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) {
        return false;
      }

      // Filtere alle Käufe, egal an welchem Tag
      const purchases = transactions.filter(t =>
          t.type === "PURCHASE" && t.createdAt
      );

      // Es müssen mindestens drei Käufe vorhanden sein, um zwei Intervalle zu haben
      if (purchases.length < 3) return false;

      // Sortiere die Käufe chronologisch
      const sortedPurchases = purchases.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Iteriere über die sortierten Käufe und prüfe benachbarte Tripel
      for (let i = 0; i < sortedPurchases.length - 2; i++) {
        const first = new Date(sortedPurchases[i].createdAt).getTime();
        const second = new Date(sortedPurchases[i + 1].createdAt).getTime();
        const third = new Date(sortedPurchases[i + 2].createdAt).getTime();

        // Berechne die Pausen in Minuten (auf Minutenpräzision gerundet)
        const gap1 = Math.round((second - first) / (60 * 1000));
        const gap2 = Math.round((third - second) / (60 * 1000));

        // Prüfe, ob beide Pausen mindestens 2 Minuten betragen und exakt gleich sind
        if (gap1 >= 2 && gap2 >= 2 && gap1 === gap2) {
          return true;
        }
      }
      return false;
    }
  }),

defineAchievement({
    id: "weekend_warrior",
    name: "Weekend-Warrior",
    description: "Ein Getränk sowohl am Samstag als auch am Sonntag des gleichen Wochenendes gekauft",
    check: ({ transactions }) => {
      const berlinPurchases = transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .map(t => toBerlinTime(t.createdAt));
      for (const d of berlinPurchases) {
        const day = d.getDay(); // 0 = Sonntag, 6 = Samstag
        if (day === 6) {
          const sunday = new Date(d);
          sunday.setDate(d.getDate() + 1);
          if (berlinPurchases.some(p =>
              p.getFullYear() === sunday.getFullYear() &&
              p.getMonth() === sunday.getMonth() &&
              p.getDate() === sunday.getDate()
          )) {
            return true;
          }
        }
        if (day === 0) {
          const saturday = new Date(d);
          saturday.setDate(d.getDate() - 1);
          if (berlinPurchases.some(p =>
              p.getFullYear() === saturday.getFullYear() &&
              p.getMonth() === saturday.getMonth() &&
              p.getDate() === saturday.getDate()
          )) {
            return true;
          }
        }
      }
      return false;
    }
  }),
  defineAchievement({
    id: "hydrationsexperte",
    name: "Hydrationsexperte",
    description: "An mindestens 15 verschiedenen Tagen 5 Getränke an einem Tag gekauft",
    check: ({ transactions }) => {
      const dayCounts: { [day: string]: number } = {};
      transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .forEach(t => {
            const berlinDate = toBerlinTime(t.createdAt);
            const day = berlinDate.toISOString().split("T")[0];
            dayCounts[day] = (dayCounts[day] || 0) + 1;
          });
      const daysWithFive = Object.values(dayCounts).filter(count => count >= 5).length;
      return daysWithFive >= 15;
    }
  }),
  defineAchievement({
    id: "monats_streak",
    name: "Monats Streak",
    description: "In 4 aufeinanderfolgenden Wochen mindestens ein Getränk gekauft",
    check: ({ transactions }) => {
      const weeks = new Set<string>();
      transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .forEach(t => {
            const berlinDate = toBerlinTime(t.createdAt);
            const year = berlinDate.getFullYear();
            const onejan = new Date(year, 0, 1);
            const diff = (berlinDate.getTime() - onejan.getTime()) / 86400000;
            const week = Math.ceil((diff + onejan.getDay() + 1) / 7);
            weeks.add(`${year}-W${week}`);
          });
      const weekArr = Array.from(weeks).sort();
      let consecutive = 1;
      for (let i = 1; i < weekArr.length; i++) {
        const currentWeek = parseInt(weekArr[i].split("-W")[1]);
        const prevWeek = parseInt(weekArr[i - 1].split("-W")[1]);
        if (currentWeek === prevWeek + 1) {
          consecutive++;
          if (consecutive >= 4) return true;
        } else {
          consecutive = 1;
        }
      }
      return false;
    }
  }),
  defineAchievement({
    id: "taegliches_ritual",
    name: "Tägliches Ritual",
    description: "5 Tage in Folge jeden Tag mindestens ein Getränk gekauft",
    check: ({ transactions }) => {
      const days = new Set<string>();
      transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .forEach(t => {
            const berlinDate = toBerlinTime(t.createdAt);
            const day = berlinDate.toISOString().split("T")[0];
            days.add(day);
          });
      const dayArr = Array.from(days).sort();
      for (let i = 0; i <= dayArr.length - 5; i++) {
        let streak = 1;
        for (let j = i + 1; j < dayArr.length; j++) {
          const prev = new Date(dayArr[j - 1]);
          const curr = new Date(dayArr[j]);
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            streak++;
            if (streak >= 5) return true;
          } else {
            break;
          }
        }
      }
      return false;
    }
  }),
  defineAchievement({
    id: "die_runde_geht_auf_mich",
    name: "Die Runde geht auf mich",
    description: "5 Käufe innerhalb von 5 Minuten getätigt",
    check: ({ transactions }) => {
      const purchases = transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 0; i < purchases.length; i++) {
        let count = 1;
        const start = new Date(purchases[i].createdAt).getTime();
        for (let j = i + 1; j < purchases.length; j++) {
          const diff = new Date(purchases[j].createdAt).getTime() - start;
          if (diff <= 5 * 60 * 1000) {
            count++;
            if (count >= 5) return true;
          } else {
            break;
          }
        }
      }
      return false;
    }
  }),
  defineAchievement({
    id: "monday_blues",
    name: "Monday Blues",
    description: "Mehr als 3 Getränke an einem Montag gekauft",
    check: ({ transactions }) => {
      const mondayCount = transactions.filter(t => {
        if (t.type !== "PURCHASE" || !t.createdAt) return false;
        const berlinDate = toBerlinTime(t.createdAt);
        return berlinDate.getDay() === 1; // Montag
      }).length;
      return mondayCount > 3;
    }
  }),
  defineAchievement({
    id: "saisontrinker",
    name: "Saisontrinker",
    description: "In allen vier Jahreszeiten Getränke gekauft",
    check: ({ transactions }) => {
      const seasons = new Set<string>();
      transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .forEach(t => {
            const berlinDate = toBerlinTime(t.createdAt);
            const month = berlinDate.getMonth() + 1;
            let season;
            if (month >= 3 && month <= 5) season = "Fruehling";
            else if (month >= 6 && month <= 8) season = "Sommer";
            else if (month >= 9 && month <= 11) season = "Herbst";
            else season = "Winter";
            seasons.add(season);
          });
      return seasons.size === 4;
    }
  }),
  defineAchievement({
    id: "feierlaune",
    name: "Feierlaune",
    description: "An einem wichtigen Feiertag (Weihnachten, Neujahr, Halloween) ein Getränk gekauft",
    check: ({ currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "PURCHASE" || !currentTransaction.createdAt) return false;
      const berlinDate = toBerlinTime(currentTransaction.createdAt);
      const month = berlinDate.getMonth() + 1;
      const day = berlinDate.getDate();
      // Feiertage: 25.12. (Weihnachten), 1.1. (Neujahr) und 31.10. (Halloween)
      return (month === 12 && day === 25) ||
          (month === 1 && day === 1) ||
          (month === 10 && day === 31);
    }
  }),
  defineAchievement({
    id: "puenktlich_pils",
    name: "Pünktlich-Pils",
    description: "5 Tage in Folge zu nahezu gleicher Tageszeit (±30 Minuten) eingekauft",
    check: ({ transactions }) => {
      const dayTimes: { [day: string]: number } = {};
      transactions
          .filter(t => t.type === "PURCHASE" && t.createdAt)
          .forEach(t => {
            const berlinDate = toBerlinTime(t.createdAt);
            const day = berlinDate.toISOString().split("T")[0];
            if (!(day in dayTimes)) {
              dayTimes[day] = berlinDate.getHours() * 60 + berlinDate.getMinutes();
            }
          });
      const days = Object.keys(dayTimes).sort();
      for (let i = 0; i <= days.length - 5; i++) {
        let streak = 1;
        const times = [dayTimes[days[i]]];
        for (let j = i + 1; j < days.length; j++) {
          const prev = new Date(days[j - 1]);
          const curr = new Date(days[j]);
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            times.push(dayTimes[days[j]]);
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            if (maxTime - minTime <= 30) {
              streak++;
              if (streak >= 5) return true;
            }
          } else {
            break;
          }
        }
      }
      return false;
    }
  }),

  // Einzahlung Achievement
  defineAchievement({
    id: "lucky_seven",
    name: "Lucky Seven",
    description: "Eine Einzahlung als 7., 77. oder 777. Transaktion vorgenommen",
    check: ({ transactions, currentTransaction }) => {
      if (!currentTransaction || currentTransaction.type !== "DEPOSIT" || !currentTransaction.createdAt) return false;
      const sorted = transactions
          .filter(t => t.createdAt)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const index = sorted.findIndex(t => t === currentTransaction);
      const position = index + 1; // 1-indexiert
      return currentTransaction.type === "DEPOSIT" &&
          (position === 7 || position === 77 || position === 777);
    }
  }),

  // Meta-Achievements (Anzahl freigeschalteter Erfolge)
  defineAchievement({
    id: "erfolgsjaeger",
    name: "Erfolgsjäger",
    description: "10 verschiedene Erfolge freigeschaltet",
    check: ({ user }) => user.achievements.length >= 10
  }),
  defineAchievement({
    id: "meistersammler",
    name: "Meistersammler",
    description: "20 verschiedene Erfolge freigeschaltet",
    check: ({ user }) => user.achievements.length >= 20
  }),
  defineAchievement({
    id: "trophaeen_titan",
    name: "Trophäen-Titan",
    description: "30 verschiedene Erfolge freigeschaltet",
    check: ({ user }) => user.achievements.length >= 30
  }),



  // Kategorienvielfalt: In allen fünf Kategorien mindestens ein Kauf getätigt.
  defineAchievement({
    id: "kategorienvielfalt",
    name: "Kategorienvielfalt",
    description: "In allen fünf Kategorien mindestens ein Kauf getätigt",
    check: ({ transactions, buyablesMap}) => {
      const purchaseCategories = new Set(
          transactions
              .filter(t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category)
              .map(t => buyablesMap[t.item!]!.category)
      );
      return purchaseCategories.size >= 5;
    }
  }),

  // Kategorie-basierte Achievements:
  defineAchievement({
    id: "hopfenheld",
    name: "Hopfenheld",
    description: "100 alkoholische Getränke gekauft",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "alcohol"
      ).length;
      return count >= 100;
    }
  }),
  defineAchievement({
    id: "legende_im_krug",
    name: "Legende im Krug",
    description: "1337 alkoholische Getränke gekauft",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "alcohol"
      ).length;
      return count >= 1337;
    }
  }),

  // Softdrink Achievements:
  defineAchievement({
    id: "zuckerschock",
    name: "Zuckerschock",
    description: "100 Softdrinks gekauft",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "softdrink"
      ).length;
      return count >= 100;
    }
  }),
  defineAchievement({
    id: "limo_legende",
    name: "Limo-Legende",
    description: "1337 Softdrinks gekauft",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "softdrink"
      ).length;
      return count >= 1337;
    }
  }),
    
  defineAchievement({
    id: "schlemmerchampion",
    name: "Schlemmerchampion",
    description: "100 Essenskäufe getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "food"
      ).length;
      return count >= 100;
    }
  }),
  defineAchievement({
    id: "teller_titan",
    name: "Teller-Titan",
    description: "1337 Essenskäufe getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "food"
      ).length;
      return count >= 1337;
    }
  }),
    
  defineAchievement({
    id: "snack_koenig",
    name: "Snack-König",
    description: "100 Snack-Käufe getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "snack"
      ).length;
      return count >= 100;
    }
  }),
  defineAchievement({
    id: "knusper_kaiser",
    name: "Knusper-Kaiser",
    description: "1337 Snack-Käufe getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "snack"
      ).length;
      return count >= 1337;
    }
  }),

  defineAchievement({
    id: "sammler",
    name: "Sammler",
    description: "100 Käufe in Sonstiges getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "other"
      ).length;
      return count >= 100;
    }
  }),
  defineAchievement({
    id: "kuriositaeten_koenig",
    name: "Kuriositäten-König",
    description: "1337 Käufe in Sonstiges getätigt",
    check: ({ transactions, buyablesMap }) => {
      const count = transactions.filter(
          t => t.type === "PURCHASE" && buyablesMap[t.item!]!.category === "other"
      ).length;
      return count >= 1337;
    }
  }),



];
