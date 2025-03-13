import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Beer,
  Users,
  Trash2,
  Key,
  CreditCard,
  ShieldCheck,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { MainNav } from "@/components/main-nav";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const depositMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
    }: {
      userId: number;
      amount: number;
    }) => {
      await apiRequest("POST", "/api/admin/deposit", { userId, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Einzahlung erfolgreich" });
      setDepositAmount("");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: number;
      newPassword: string;
    }) => {
      await apiRequest("POST", "/api/admin/reset-password", {
        userId,
        newPassword,
      });
    },
    onSuccess: () => {
      toast({ title: "Passwort erfolgreich zurückgesetzt" });
      setNewPassword("");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Benutzer gelöscht" });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: number;
      isAdmin: boolean;
    }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: `Benutzerrolle aktualisiert` });
    },
  });

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Benutzer</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzername</TableHead>
                  <TableHead>Kontostand</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erfolge</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => {
                  const achievements = JSON.parse(u.achievements);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.username}
                      </TableCell>
                      <TableCell
                        className={
                          u.balance < 0 ? "text-destructive" : "text-primary"
                        }
                      >
                        €{u.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isAdmin ? "default" : "secondary"}>
                          {u.isAdmin ? "Admin" : "Benutzer"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {achievements.map((achievement: any) => (
                            <Badge
                              key={achievement.id}
                              variant="outline"
                              className="text-xs hover:bg-accent cursor-help"
                              title={`${achievement.description} - Freigeschaltet: ${
                                achievement.unlockedAt
                                  ? new Date(
                                      achievement.unlockedAt,
                                    ).toLocaleString()
                                  : "Noch nicht"
                              }`}
                            >
                              {achievement.name}
                            </Badge>
                          ))}
                          {achievements.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              Noch keine Erfolge
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Deposit Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedUser(u)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Geld einzahlen - {selectedUser?.username}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input
                                  type="number"
                                  placeholder="Betrag in €"
                                  value={depositAmount}
                                  onChange={(e) =>
                                    setDepositAmount(e.target.value)
                                  }
                                />
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    if (selectedUser) {
                                      depositMutation.mutate({
                                        userId: selectedUser.id,
                                        amount: parseFloat(depositAmount),
                                      });
                                    }
                                  }}
                                  disabled={depositMutation.isPending}
                                >
                                  Einzahlen
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Reset Password Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedUser(u)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Passwort zurücksetzen -{" "}
                                  {selectedUser?.username}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input
                                  type="password"
                                  placeholder="Neues Passwort"
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                />
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    if (selectedUser) {
                                      resetPasswordMutation.mutate({
                                        userId: selectedUser.id,
                                        newPassword,
                                      });
                                    }
                                  }}
                                  disabled={resetPasswordMutation.isPending}
                                >
                                  Passwort zurücksetzen
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Toggle Admin Status */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (user.id !== u?.id) {
                                // Prevent toggling own admin status
                                toggleAdminMutation.mutate({
                                  userId: u.id,
                                  isAdmin: !u.isAdmin,
                                });
                              }
                            }}
                            disabled={user.id === u?.id}
                          >
                            <ShieldCheck
                              className={`h-4 w-4 ${u.isAdmin ? "text-primary" : ""}`}
                            />
                          </Button>

                          {/* Delete User */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  "Bist du sicher, dass du diesen Benutzer löschen möchtest?",
                                )
                              ) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            disabled={user.id === u?.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
