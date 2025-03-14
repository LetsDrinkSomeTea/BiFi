import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Statistics, CountByItem,  } from "@shared/statistics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {Beer, Clock, Users} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import React, { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainNav } from "@/components/main-nav";
import {Buyable} from "@shared/schema.ts";

export default function StatisticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");

  const { data: personalStats, isLoading: isLoadingPersonal } = useQuery<Statistics>({
    queryKey: [`/api/stats/user/${user?.id}`, timeRange],
    enabled: !!user?.id,
  });

  const { data: systemStats, isLoading: isLoadingSystem } = useQuery<Statistics>({
    queryKey: ["/api/stats/system", timeRange],
  });

  const { data: buyables } = useQuery<Buyable[]>({
    queryKey: ["/api/buyables"],
  });

  // Umwandlung des Buyables-Arrays in ein Map-Objekt, damit wir z. B. buyableMap[1].name verwenden können
  const buyableMap = React.useMemo(() => {
    const map: Record<number, Buyable> = {};
    if (buyables) {
      buyables.forEach((b) => {
        map[b.id] = b;
      });
    }
    return map;
  }, [buyables]);

  if (isLoadingPersonal || isLoadingSystem || !personalStats || !systemStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Statistiken werden geladen...</div>
      </div>
    );
  }

    const countByItemWithBuyableName = personalStats.users[0].purchaseCountByItem.slice(0, 5)
        .map((item): CountByItem => ({
            itemId: item.itemId,
            name: buyableMap[item.itemId].name,
            count: item.count
        }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <MainNav currentPath={window.location.pathname} />
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="space-y-2">
              <Label>Zeitraum</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                  <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                  <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                  <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                  <SelectItem value="1y">Letztes Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Personal Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Meine Käufe
              </CardTitle>
              <Beer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {personalStats.totals.totalPurchases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Meine Ausgaben
              </CardTitle>
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{personalStats.totals.totalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ø {personalStats.totals.averagePurchaseAmount.toFixed(2)}€ pro Einkauf
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Durchschnittliche Uhrzeit
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {personalStats.users[0].averagePurchaseTime || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {personalStats.users[0].mostActiveDay || "Noch nicht genug Daten"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Käufe über die Zeit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={personalStats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "d. MMM", { locale: de })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(new Date(date), "d. MMM yyyy", { locale: de })
                      }
                      formatter={(value: number) => [
                        `€${value.toFixed(2)}`,
                        "Betrag",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAmount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Käufe nach Wochentagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={personalStats.dayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `€${value.toFixed(2)}`,
                        "Betrag",
                      ]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Käufe pro Stunde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={personalStats.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(hour) =>
                        `${hour}:00 - ${(hour + 1) % 24}:00`
                      }
                      formatter={(value: number) => [
                        `€${value.toFixed(2)}`,
                        "Betrag",
                      ]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beliebte Einkäufe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countByItemWithBuyableName}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                        formatter={(value: number) => [
                          `${value}`,
                          "Stück",
                        ]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>


        </div>
        {/* System Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamtkäufe
              </CardTitle>
              <Beer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.totals.totalPurchases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamtumsatz
              </CardTitle>
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.totals.totalAmount.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground">
                Ø €{systemStats.totals.averagePurchaseAmount.toFixed(2)} pro Einkauf
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Nutzer
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.totals.uniqueUsers}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}