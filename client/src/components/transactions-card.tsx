import { ExternalLink, History } from 'lucide-react'
import {BuyablesMap, Transaction} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {format} from "date-fns";
import {de} from "date-fns/locale";
import { Link } from 'wouter'

export interface TransactionsCardProps {
    transactions: Transaction[];
    buyablesMap: BuyablesMap;
}

export function TransactionsCard({transactions, buyablesMap}: TransactionsCardProps) {
    return (
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Letzte Transaktionen</CardTitle>
              <Link href="/transactions">
               <ExternalLink className="text-muted-foreground h-4 w-4"/>
              </Link>
            </div>
              <History className="h-5 w-5 text-muted-foreground"/>
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
                                <div className="text-sm text-foreground flex-1">{buyableName} <strong>{transaction.isJackpot && "(Jackpot)"}</strong> <strong>{transaction.groupId && "(Gruppe)"}</strong></div>
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
    );
}