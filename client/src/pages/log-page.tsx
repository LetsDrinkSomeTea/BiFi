import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LogInfo } from '@shared/schema'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScrollText,
} from 'lucide-react'
import { useLocation } from "wouter";
import React from "react";
import { MainNav } from "@/components/main-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx'

export default function LogPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user?.isAdmin) {
    setLocation("/");
    return <div>Keine Berechtigung</div>;
  }

  const { data: log } = useQuery<LogInfo>({
    queryKey: ["/api/admin/log"],
  });



  return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <MainNav currentPath={window.location.pathname} />
        </header>
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Log</CardTitle>
              <ScrollText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {log ? (
              <div>
                <Table className="min-w-full border-collapse">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-2 border-b text-left">Transaction ID</TableHead>
                      <TableHead className="px-4 py-2 border-b text-left">User (ID)</TableHead>
                      <TableHead className="px-4 py-2 border-b text-left">Betrag</TableHead>
                      <TableHead className="px-4 py-2 border-b text-left">Typ</TableHead>
                      <TableHead className="px-4 py-2 border-b text-left">Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.map((entry) => (
                      <TableRow key={entry.transaction.id}>
                        <TableCell className="px-4 py-2 border-b">{entry.transaction.id}</TableCell>
                        <TableCell className="px-4 py-2 border-b">{entry.user?.username} ({entry.user.id})</TableCell>
                        <TableCell className="px-4 py-2 border-b">{entry.transaction.amount}</TableCell>
                        <TableCell className="px-4 py-2 border-b">{entry.transaction.type}</TableCell>
                        <TableCell className="px-4 py-2 border-b">
                          {new Date(entry.transaction.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div>Lade Log...</div>
            )}
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
