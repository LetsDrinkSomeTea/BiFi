import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Beer, History, Trophy, Key } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainNav } from "@/components/main-nav";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
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
      toast({ title: "Passwort erfolgreich geändert" });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Passwort konnte nicht geändert werden",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const achievements = user ? JSON.parse(user.achievements) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beer className="h-6 w-6" />
            <h1 className="font-bold text-lg">BiFi Strichliste</h1>
          </div>
          <MainNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Kontostand</CardTitle>
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
                Getränk kaufen (€1)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Errungenschaften</CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement: any) => (
                  <Badge
                    key={achievement.id}
                    className={`${achievement.unlockedAt ? "" : "text-muted-foreground"} cursor-help`}
                    title={`${achievement.description}${achievement.unlockedAt ? ` - Freigeschaltet: ${new Date(achievement.unlockedAt).toLocaleString('de-DE')}` : ''}`}
                  >
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Letzte Transaktionen</CardTitle>
              <History className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions?.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.createdAt), "d. MMM, HH:mm", { locale: de })}
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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="fixed bottom-4 right-4 lg:static">
              <Key className="h-4 w-4 mr-2" />
              Passwort ändern
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Passwort ändern</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="password"
                placeholder="Aktuelles Passwort"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Neues Passwort"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={() => changePasswordMutation.mutate()}
                disabled={changePasswordMutation.isPending}
              >
                Passwort ändern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}