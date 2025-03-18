import { LucideProps } from 'lucide-react'
import {BuyablesMap, Transaction} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table.tsx'
import React, { useState } from 'react'

export interface TransactionsCardProps {
    transactions: Transaction[];
    buyablesMap: BuyablesMap;
    tableHeader: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

export function TransactionsTableCard(args: TransactionsCardProps) {
    const [sortColumn, setSortColumn] = useState<string>("Datum"); // Standard-Sortierung nach Datum
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sortiere Transaktionen basierend auf sortColumn und sortDirection
  const sortedTransactions = [...args.transactions].sort((a, b) => {
    let aVal: any, bVal: any;
    if (sortColumn === "Produkt") {
      aVal =
        args.buyablesMap[a.item as number]?.name || a.item || "Einzahlung";
      bVal =
        args.buyablesMap[b.item as number]?.name || b.item || "Einzahlung";
    } else if (sortColumn === "Betrag") {
      aVal = Math.abs(a.amount);
      bVal = Math.abs(b.amount);
    } else if (sortColumn === "Datum") {
      aVal = new Date(a.createdAt);
      bVal = new Date(b.createdAt);
    }
    if (aVal < bVal) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Umschalten der Sortierung beim Klicken auf die Spaltenüberschrift
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{args.tableHeader}</CardTitle>
            <args.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableRow>
                <TableHead onClick={() => handleSort("Produkt")} className="cursor-pointer w-1/3">
                  Produkt {sortColumn === "Produkt" && (sortDirection === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead onClick={() => handleSort("Betrag")} className="cursor-pointer w-1/3">
                  Betrag {sortColumn === "Betrag" && (sortDirection === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead onClick={() => handleSort("Datum")} className="cursor-pointer w-1/3">
                  Datum {sortColumn === "Datum" && (sortDirection === "asc" ? "▲" : "▼")}
                </TableHead>
              </TableRow>

              {sortedTransactions.map((transaction) => {
                const buyableName =
                  args.buyablesMap[transaction.item as number]?.name ||
                  transaction.item ||
                  "Einzahlung";
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{buyableName}</TableCell>
                    <TableCell className={transaction.amount < 0 ? "text-destructive" : "text-primary"}>
                      {transaction.amount.toFixed(2)}€
                    </TableCell>
                    <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </CardContent>
        </Card>
    );
}