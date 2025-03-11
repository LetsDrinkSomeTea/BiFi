import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, Achievement } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Beer, History, Trophy, LogOut, Key, BarChart } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/purchase");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const achievements = user ? (JSON.parse(user.achievements) as Achievement[]) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beer className="h-6 w-6" />
            <h1 className="font-bold text-lg">BiFi Strichliste</h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link href="/admin">
                <Button variant="outline">Admin Panel</Button>
              </Link>
            )}
            <Link href="/stats">
              <Button variant="outline">
                <BarChart className="h-4 w-4 mr-2" />
                Statistics
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={changePasswordMutation.isPending}
                  >
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${user?.balance! < 0 ? 'text-destructive' : 'text-primary'}`}>
                €{user?.balance?.toFixed(2)}
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
              >
                <Beer className="h-4 w-4 mr-2" />
                Purchase Drink (€1)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Achievements</CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <Badge
                    key={achievement.id}
                    className={`${achievement.unlockedAt ? "" : "text-muted-foreground"} cursor-help`}
                    title={`${achievement.description} - Unlocked: ${achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleString() : 'Not yet'}`}
                  >
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <History className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions?.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.createdAt), "MMM d, HH:mm")}
                    </div>
                    <div className={transaction.amount < 0 ? "text-destructive" : "text-primary"}>
                      €{transaction.amount.toFixed(2)}
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