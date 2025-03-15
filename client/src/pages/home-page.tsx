import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {Buyable, BuyablesMap, Transaction} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuyButton } from "@/components/ui/buy-button.tsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Beer, GlassWater, History, Trophy, Wine } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainNav } from "@/components/main-nav";
import { AchievementBadge } from "@/components/ui/achievement-badge.tsx";
import React from "react";

export default function HomePage() {
  const { user } = useAuth();
  if (!user) {return <div>Keine Berechtigung</div>;}

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: buyables, isLoading: isLoadingBuyables } = useQuery<Buyable[]>({
    queryKey: ["/api/buyables"],
  });

  const { data: buyablesMap, isLoading: isLoadingBuyablesMap } = useQuery<BuyablesMap>({
    queryKey: ["/api/buyables/map"],
  });


  // Filter für Buyables mit id 4 ... n
  const otherBuyables = React.useMemo(() => {
    return buyables ? buyables.filter((b) => b.id >= 4 && !b.deleted).sort((a,b) => a.name.localeCompare(b.name)) : [];
  }, [buyables]);

  // State für das Dropdown (Auswahl eines Buyables aus den IDs 4...n)
  const [selectedOtherBuyableId, setSelectedOtherBuyableId] = React.useState<number | null>(null);

  // Setze initial den ersten Eintrag, falls vorhanden
  React.useEffect(() => {
    if (otherBuyables.length > 0 && selectedOtherBuyableId === null) {
      setSelectedOtherBuyableId(otherBuyables[0].id);
    }
  }, [otherBuyables, selectedOtherBuyableId]);

  // Belasse die Mutation, sodass der Kauf weiterhin mit buyableId erfolgt
  const purchaseMutation = useMutation({
    mutationFn: async (args: { buyableId: number }) => {
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

  if (isLoadingBuyables || isLoadingBuyablesMap || !buyables || !buyablesMap) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Dashboard wird geladen...</div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
            <MainNav currentPath={window.location.pathname} />
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Kontostand</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                    className={`text-3xl font-bold ${
                        user?.balance! < 0 ? "text-destructive" : "text-primary"
                    }`}
                >
                  €{user?.balance?.toFixed(2)}
                </p>
                {/* Fixe Buttons für die Buyable IDs 1, 2 und 3 */}
                <BuyButton
                    buyable={buyablesMap![1]}
                    onBuy={purchaseMutation.mutate}
                    icon={Beer}
                />
                <BuyButton
                    buyable={buyablesMap![2]}
                    onBuy={purchaseMutation.mutate}
                    icon={GlassWater}
                />
                <BuyButton
                    buyable={buyablesMap![3]}
                    onBuy={purchaseMutation.mutate}
                    icon={Wine}
                />

                {/* Dropdown für Buyables mit id 4 ... n */}
                {otherBuyables.length > 0 && (
                    <div className="flex items-center gap-2 mt-4">
                      <select
                          value={selectedOtherBuyableId || ""}
                          onChange={(e) =>
                              setSelectedOtherBuyableId(Number(e.target.value))
                          }
                          className="p-2 border rounded w-full"
                      >
                        {otherBuyables.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.price.toFixed(2)}€)
                            </option>
                        ))}
                      </select>
                      <Button className="w-1/2"
                          onClick={() => {
                            if (selectedOtherBuyableId) {
                              purchaseMutation.mutate({ buyableId: selectedOtherBuyableId });
                            }
                          }}
                          disabled={purchaseMutation.isPending || !selectedOtherBuyableId}
                      >
                        Kaufen
                      </Button>
                    </div>
                )}
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
                      <AchievementBadge
                          achievement={achievement}
                          activeTooltipId={activeTooltipId}
                          setActiveTooltipId={setActiveTooltipId}
                          key={achievement.id}
                      />
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
                  {transactions?.slice(0, 5).map((transaction) => {
                    // Wir gehen davon aus, dass transaction.item die buyableId enthält
                    const buyableName =
                        buyablesMap![transaction.item as number]?.name || transaction.item;
                    return (
                        <div key={transaction.id} className="flex justify-between">
                          <div className="text-sm text-muted-foreground w-32">
                            {format(new Date(transaction.createdAt), "d. MMM, HH:mm", {
                              locale: de,
                            })}
                          </div>
                          <div className="text-sm text-foreground flex-1">{buyableName}</div>
                          <div
                              className={
                                transaction.amount < 0
                                    ? "text-destructive"
                                    : "text-primary"
                              }
                          >
                            €{transaction.amount.toFixed(2)}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  );
}
