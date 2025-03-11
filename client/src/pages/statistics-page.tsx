import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, Transaction } from "@shared/schema";
import { StatisticsFilters, Statistics, calculateStatistics } from "@shared/statistics/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Beer, ArrowLeft, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
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
import { useState } from "react";
import { format } from "date-fns";

const TIME_RANGES = {
  "24h": { days: 1 },
  "7d": { days: 7 },
  "30d": { days: 30 },
  "90d": { days: 90 },
  "1y": { days: 365 },
};

export default function StatisticsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  if (!users || !transactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading statistics...</div>
      </div>
    );
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - TIME_RANGES[timeRange as keyof typeof TIME_RANGES].days);

  const filters: StatisticsFilters = {
    timeRange: { start, end },
    userIds: selectedUsers.length > 0 ? selectedUsers.map(Number) : undefined,
  };

  const stats = calculateStatistics(users, transactions, filters);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beer className="h-6 w-6" />
            <h1 className="font-bold text-lg">BiFi Strichliste Statistics</h1>
          </div>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Users</Label>
              <Select
                value={selectedUsers.join(",")}
                onValueChange={(value) => setSelectedUsers(value ? value.split(",") : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Beer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.totalPurchases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
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
              <div className="text-2xl font-bold">€{stats.totals.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Purchase</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totals.averagePurchaseAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchases Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                      formatter={(value: number) => [`€${value.toFixed(2)}`, "Amount"]}
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
              <CardTitle>Purchases by Day of Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchases by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(hour) => `${hour}:00 - ${(hour + 1) % 24}:00`}
                      formatter={(value: number) => [`€${value.toFixed(2)}`, "Amount"]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {stats.users.map((userStat) => (
                  <div key={userStat.userId} className="space-y-2">
                    <h3 className="font-medium">{userStat.username}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Total Spent: €{userStat.totalSpent.toFixed(2)}</div>
                      <div>Purchase Count: {userStat.purchaseCount}</div>
                      <div>Average Time: {userStat.averagePurchaseTime || "N/A"}</div>
                      <div>Most Active: {userStat.mostActiveDay || "N/A"}</div>
                      <div>Largest Purchase: €{userStat.largestPurchase.toFixed(2)}</div>
                      <div>Current Balance: €{userStat.balance.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
