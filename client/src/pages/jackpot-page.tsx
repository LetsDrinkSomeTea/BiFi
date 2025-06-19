import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Buyable, BuyablesMap, Transaction } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainNav } from "@/components/main-nav";
import { TransactionsCard } from "@/components/transactions-card.tsx";
import JackpotWheel from "@/components/jackpot-wheel.tsx";
import { AchievementsCard } from "@/components/achievement-card.tsx";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {Gem} from "lucide-react";

export default function JackpotPage() {
    const { user } = useAuth();
    if (!user || !user.allowedJackpot) {
        return <div>Keine Berechtigung</div>;
    }

    // Load buyables and transactions data
    const { data: buyables, isLoading: isLoadingBuyables } = useQuery<Buyable[]>({
        queryKey: ["/api/buyables"],
    });
    const { data: buyablesMap, isLoading: isLoadingBuyablesMap } = useQuery<BuyablesMap>({
        queryKey: ["/api/buyables/map"],
    });
    const { data: transactions } = useQuery<Transaction[]>({
        queryKey: ["/api/transactions"],
    });

    // Available buyables (non-deleted)
    const availableBuyables: Buyable[] = React.useMemo(() => {
        return buyables
            ? buyables.filter((b) => !b.deleted).sort((a, b) => a.name.localeCompare(b.name))
            : [];
    }, [buyables]);

    // State for selected buyable
    const [selectedBuyableId, setSelectedBuyableId] = React.useState<number | null>(null);
    React.useEffect(() => {
        if (availableBuyables.length > 0 && selectedBuyableId === null) {
            setSelectedBuyableId(availableBuyables[0].id);
        }
    }, [availableBuyables, selectedBuyableId]);

    const [spinning, setSpinning] = React.useState(false);
    const [resultDialogOpen, setResultDialogOpen] = React.useState(false);
    const [resultMultiplier, setResultMultiplier] = React.useState<number | null>(null);
    const [wheelMultiplier, setWheelMultiplier] = React.useState<number | null>(null);

    const jackpotMutation = useMutation({
        mutationFn: async (args: { buyableId: number }) => {
            const res = await apiRequest("POST", "/api/jackpot", args);
            return res.json() as Promise<{ transaction: Transaction; user: typeof user; multiplier: number }>;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            setResultMultiplier(data.multiplier);
            setWheelMultiplier(data.multiplier); // This triggers the wheel to spin to the correct position
        },
        onError: () => {
            setSpinning(false); // Reset spinning state on error
        },
    });

    const onSpinStart = () => {
        setSpinning(true);
        setWheelMultiplier(null); // Reset wheel multiplier
        jackpotMutation.mutate({ buyableId: selectedBuyableId! });
    };

    const onSpinComplete = () => {
        setSpinning(false);
        setResultDialogOpen(true);
    };

    if (isLoadingBuyables || isLoadingBuyablesMap || !buyables || !buyablesMap || !transactions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse">Dashboard wird geladen...</div>
            </div>
        );
    }

    const selectedBuyable = buyablesMap![selectedBuyableId!];

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <MainNav currentPath={window.location.pathname} />
            </header>
            <main className="container mx-auto px-4 py-8 space-y-8">
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                    {/* Jackpot-Bereich */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Jackpot</CardTitle>
                            <Gem className="h-5 w-5 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <CardDescription>Zahle zwischen 0% und 200% des original Preises</CardDescription>
                                <select
                                    value={selectedBuyableId || ""}
                                    onChange={(e) => setSelectedBuyableId(Number(e.target.value))}
                                    className="p-2 border rounded w-full"
                                    disabled={spinning}
                                >
                                    {availableBuyables.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} (0€ - {(b.price * 2).toFixed(2)}€)
                                        </option>
                                    ))}
                                </select>
                                <JackpotWheel
                                    onSpinStart={onSpinStart}
                                    onSpinComplete={onSpinComplete}
                                    buyable={selectedBuyable}
                                    multiplier={wheelMultiplier}
                                    isSpinning={spinning}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid gap-4 grid-rows-3">
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
                            </CardContent>
                        </Card>
                        <div className="row-span-2 grid gap-4">
                            <TransactionsCard transactions={transactions} buyablesMap={buyablesMap} />
                        </div>
                    </div>
                    <AchievementsCard user={user} />
                </div>
                <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ergebnis</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {resultMultiplier !== null && (
                                <p className="text-lg font-medium">
                                    Du hast <strong>{selectedBuyable.name}</strong> zum Preis von{" "}
                                    {(selectedBuyable.price * resultMultiplier).toFixed(2)}€ erspielt! ({(resultMultiplier * 100).toFixed(0)}%)
                                </p>
                            )}
                        </div>
                        <DialogClose asChild>
                            <Button className="w-full" onClick={() => setResultDialogOpen(false)}>
                                OK
                            </Button>
                        </DialogClose>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}