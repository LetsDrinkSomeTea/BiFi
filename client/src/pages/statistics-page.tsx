import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Statistics } from "@shared/statistics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Beer, Clock, Euro, MonitorCog, Users } from "lucide-react";
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

export default function StatisticsPage() {
  const { user } = useAuth();

  // Setze Standardwerte: Standardmäßig geht der Zeitraum von vor 7 Tagen bis heute.
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);

  // State zur Auswahl der Metrik für die Diagramme:
  // Für "Käufe über die Zeit": totalPurchases oder totalAmount
  const [timeMetric, setTimeMetric] = useState("totalPurchases");
  // Für "Käufe nach Wochentagen": purchases oder amount
  const [dayMetric, setDayMetric] = useState("purchases");
  // Für "Käufe pro Stunde": purchases oder amount
  const [hourMetric, setHourMetric] = useState("purchases");

  // Query-Key beinhaltet nun auch from und to als Parameter
  const { data: statistics, isLoading } = useQuery<Statistics>({
    queryKey: [`/api/stats/${user?.id}`, { from: startDate, to: endDate }],
    queryFn: async ({ queryKey }) => {
      const [base, { from, to }] = queryKey as [string, { from: string; to: string }];
      const res = await fetch(`${base}?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Statistiken");
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading || !statistics) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Statistiken werden geladen...</div>
        </div>
    );
  }

  const personalStats = statistics.users;
  const systemStats = statistics.system;

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <MainNav currentPath={window.location.pathname} />
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Zeit-Auswahl-Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col">
                <div className="text-muted-foreground text-sm">Von:</div>
                <input
                    type="date"
                    lang="de-DE"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <div className="text-muted-foreground text-sm">Bis:</div>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-2 border rounded"
                />
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meine Käufe</CardTitle>
                <Beer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{personalStats.purchaseCountTotal}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meine Ausgaben</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{personalStats.totalSpent.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground">
                  Ø {personalStats.averagePurchaseAmount.toFixed(2)}€ pro Einkauf
                </p>
              </CardContent>
            </Card>

            {personalStats.averagePurchaseTime && (<Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Durchschnittliche Uhrzeit</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{personalStats.averagePurchaseTime || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  Aktivster Tag: <span className="text-foreground">{personalStats.mostActiveDay || "N/A"}</span>
                </p>
              </CardContent>
            </Card>)}

          {/* Diagramme */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Diagramm: Käufe über die Zeit */}
            <Card>
              <CardHeader>
                <CardTitle>Aktivität über die Zeit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Metrik:</span>
                  <Select value={timeMetric} onValueChange={setTimeMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalPurchases">Käufe</SelectItem>
                      <SelectItem value="totalAmount">Ausgaben</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                            `${timeMetric === "totalAmount" ? `${value.toFixed(2)}€` : `${value}`}`,
                          ]}
                      />
                      <Line type="monotone" dataKey={timeMetric} stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Diagramm: Käufe nach Wochentagen */}
            <Card>
              <CardHeader>
                <CardTitle>Aktivität nach Wochentagen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Metrik:</span>
                  <Select value={dayMetric} onValueChange={setDayMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchases">Käufe</SelectItem>
                      <SelectItem value="amount">Ausgaben</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personalStats.dayOfWeekStatistics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip
                          formatter={(value: number) => [
                            `${timeMetric === "totalAmount" ? `${value.toFixed(2)}€` : `${value}`}`,
                          ]}
                      />
                      <Bar dataKey={dayMetric} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Diagramm: Käufe pro Stunde */}
            <Card>
              <CardHeader>
                <CardTitle>Aktivität pro Stunde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Metrik:</span>
                  <Select value={hourMetric} onValueChange={setHourMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchases">Käufe</SelectItem>
                      <SelectItem value="amount">Ausgaben</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personalStats.hourlyStatistics}>
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
                            `${timeMetric === "amount" ? `${value.toFixed(2)}€` : `${value}`}`,
                          ]}
                      />
                      <Bar dataKey={hourMetric} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Diagramm: Beliebteste Produkte */}
            <Card>
              <CardHeader>
                <CardTitle>Beliebteste Produkte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] content-center">
                  {personalStats.purchaseCountByItem.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={personalStats.purchaseCountByItem}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value}`, "Stück"]} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="text-center text-lg text-muted-foreground">
                        Noch keine Einkäufe vorhanden
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Systemweite Statistiken */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Systemweite Statistiken</CardTitle>
              <MonitorCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gesamtkäufe</CardTitle>
                    <Beer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.totalPurchases}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.totalAmount.toFixed(2)}€</div>
                    <p className="text-xs text-muted-foreground">
                      Ø €{systemStats.averagePurchaseAmount.toFixed(2)} pro Einkauf
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aktive Nutzer</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.uniqueActiveUsers}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
  );
}
