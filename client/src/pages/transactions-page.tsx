import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BuyablesMap, Transaction, User } from '@shared/schema'
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText } from 'lucide-react';
import { MainNav } from "@/components/main-nav";
import { TransactionsTableCard } from '@/components/transactions-table-card.tsx'

export default function TransactionsPage() {
  const { user } = useAuth();
  if (!user) {
    return <div>Keine Berechtigung</div>;
  }

  const [selectedUser, setSelectedUser] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!selectedUser) {
      setSelectedUser(user.id);
    }
  }, [selectedUser, user.id]);

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${selectedUser}`],
    enabled: !!selectedUser,
  });

  const { data: buyablesMap, isLoading: isLoadingBuyablesMap } = useQuery<BuyablesMap>({
    queryKey: ["/api/buyables/map"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user.isAdmin,
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
            <div>
            <CardTitle>Transaktionen</CardTitle>
              {user.isAdmin && (
                <div className="flex flex-row gap-2 items-center p-2">
                <label className="text-muted-foreground">von</label>
                <select
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(Number(e.target.value))}
                  className="p-2 border rounded w-full"
                >
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {user.id == u.id ? `Ich (${u.username})` : u.username}
                    </option>
                  ))}
                </select>
                </div>
              )}
            </div>
            <ReceiptText className="h-5 w-5 text-muted-foreground"/>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {purchases.length > 0 &&(<TransactionsTableCard transactions={purchases} buyablesMap={buyablesMap} variant="purchases"/>)}
          {deposits.length > 0 &&(<TransactionsTableCard transactions={deposits} buyablesMap={buyablesMap} variant="deposits"/>)}
          {purchases.length == 0 && deposits.length == 0 && (
            <Card>
              <CardHeader className="text-muted-foreground">Keine Transaktionen vorhanden.</CardHeader>
            </Card>
          )}
        </div>

      </main>
    </div>
  );
}
