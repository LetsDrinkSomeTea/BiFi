import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BuyablesMap, Transaction } from "@shared/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText } from 'lucide-react';
import { MainNav } from "@/components/main-nav";
import { TransactionsTableCard } from '@/components/transactions-table-card.tsx'

export default function TransactionsPage() {
  const { user } = useAuth();
  if (!user) {
    return <div>Keine Berechtigung</div>;
  }

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: buyablesMap, isLoading: isLoadingBuyablesMap } = useQuery<BuyablesMap>({
    queryKey: ["/api/buyables/map"],
  });

  if (isLoadingBuyablesMap || !buyablesMap || !transactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Dashboard wird geladen...</div>
      </div>
    );
  }

  const purchases = transactions.filter((t) => t.amount < 0);
  const deposits = transactions.filter((t) => t.amount > 0);


  // Zustände für Sortierung und Filterung
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <MainNav currentPath={window.location.pathname} />
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaktionen</CardTitle>
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <TransactionsTableCard transactions={purchases} buyablesMap={buyablesMap} variant="purchases"/>
          <TransactionsTableCard transactions={deposits} buyablesMap={buyablesMap} variant="deposits"/>
        </div>

      </main>
    </div>
);
}
