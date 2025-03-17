import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {Buyable, BuyablesMap, Transaction} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuyButton } from "@/components/ui/buy-button.tsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Beer, GlassWater, Wine } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import React from "react";
import {TransactionsCard} from "@/components/transactions-card.tsx";
import {AchievementsCard} from "@/components/achievement-card.tsx";

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

  if (isLoadingBuyables || isLoadingBuyablesMap || !buyables || !buyablesMap || !transactions) {
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
            <AchievementsCard user={user}/>
            <TransactionsCard transactions={transactions} buyablesMap={buyablesMap}/>
          </div>
        </main>
      </div>
  );
}
