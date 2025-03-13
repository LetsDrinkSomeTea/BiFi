import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {Beer, GlassWater, History, Trophy, Wine} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainNav } from "@/components/main-nav";
import {Tooltip, TooltipProvider, TooltipTrigger, TooltipContent} from "@/components/ui/tooltip.tsx";
import {AchievementBadge} from "@/components/ui/achievement-badge.tsx";
import React from "react";

export default function HomePage() {
  const { user } = useAuth();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (args: {amount: Number, item: string}) => {
      const res = await apiRequest("POST", "/api/purchase", args);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const [activeTooltipId, setActiveTooltipId] = React.useState<string | null>(null);

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
                  onClick={() => purchaseMutation.mutate({amount:1, item:"Bier"})}
                  disabled={purchaseMutation.isPending}
              >
                <Beer className="h-4 w-4 mr-2" />
                Bier kaufen (€1)
              </Button>
              <Button
                  className="w-full mt-4"
                  onClick={() => purchaseMutation.mutate({amount:1, item:"Softdrink"})}
                  disabled={purchaseMutation.isPending}
              >
                <GlassWater className="h-4 w-4 mr-2" />
                Spezi kaufen (€1)
              </Button>
              <Button
                  className="w-full mt-4"
                  onClick={() => purchaseMutation.mutate({amount:4, item:"Wein"})}
                  disabled={purchaseMutation.isPending}
              >
                <Wine className="h-4 w-4 mr-2" />
                Wein kaufen (€4)
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
                    <AchievementBadge achievement={achievement} activeTooltipId={activeTooltipId} setActiveTooltipId={setActiveTooltipId} key={achievement.id} />
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
                    <div key={transaction.id} className="flex justify-between">
                      <div className="text-sm text-muted-foreground w-32">
                        {format(new Date(transaction.createdAt), "d. MMM, HH:mm", {locale: de})}
                      </div>
                      <div className="text-sm text-foreground flex-1">
                        {transaction.item}
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