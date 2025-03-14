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
  Users,
  Trash2,
  Key,
  CreditCard,
  ShieldCheck,
  Plus,
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
import React, { useState } from "react";
import { MainNav } from "@/components/main-nav";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // State for dialog forms
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  // Controlled dialog states for deposit, reset password, create user
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  // New state variables for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserForDeletion, setSelectedUserForDeletion] = useState<User | null>(null);

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
      setIsDepositDialogOpen(false);
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
      setIsResetPasswordDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Benutzer gelöscht" });
      // Optionally close the dialog after deletion:
      setIsDeleteDialogOpen(false);
      setSelectedUserForDeletion(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({
                         username,
                         password,
                         isAdmin,
                       }: {
      username: string;
      password: string;
      isAdmin: boolean;
    }) => {
      await apiRequest("POST", "/api/admin/users", {
        username,
        password,
        isAdmin,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Benutzer erfolgreich erstellt" });
      setIsCreateUserDialogOpen(false);
      // Reset the form fields
      setNewUsername("");
      setNewPassword("");
      setNewIsAdmin(false);
    },
    onError: (error: any) => {
      toast({
        title: "Benutzer konnte nicht erstellt werden",
        description: error.message,
        variant: "destructive",
      });
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
          <MainNav currentPath={window.location.pathname} />
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Benutzer</CardTitle>
              <div className="flex flex-row gap-4 items-center">
                <Users className="h-5 w-5 text-muted-foreground" />
                {/* Create User Dialog */}
                <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="icon">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neuen Nutzer anlegen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                          placeholder="Benutzername"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                      />
                      <Input
                          type="password"
                          placeholder="Passwort"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newIsAdmin}
                            onChange={(e) => setNewIsAdmin(e.target.checked)}
                            id="isAdminCheckbox"
                            className="w-4 h-4"
                        />
                        <label htmlFor="isAdminCheckbox" className="text-sm">
                          Admin
                        </label>
                      </div>
                      <Button
                          className="w-full"
                          onClick={() => {
                            createUserMutation.mutate({
                              username: newUsername,
                              password: newPassword,
                              isAdmin: newIsAdmin,
                            });
                          }}
                          disabled={createUserMutation.isPending}
                      >
                        Nutzer anlegen
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                  {users
                      ?.sort((a, b) => a.username.localeCompare(b.username))
                      .map((u) => {
                        const achievements = JSON.parse(u.achievements);
                        return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.username}</TableCell>
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
                                                  ? new Date(achievement.unlockedAt).toLocaleString()
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
                                  <Dialog
                                      open={isDepositDialogOpen}
                                      onOpenChange={setIsDepositDialogOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedUser(u);
                                            setIsDepositDialogOpen(true);
                                          }}
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
                                  <Dialog
                                      open={isResetPasswordDialogOpen}
                                      onOpenChange={setIsResetPasswordDialogOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedUser(u);
                                            setIsResetPasswordDialogOpen(true);
                                          }}
                                      >
                                        <Key className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Passwort zurücksetzen - {selectedUser?.username}
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
                                          toggleAdminMutation.mutate({
                                            userId: u.id,
                                            isAdmin: !u.isAdmin,
                                          });
                                        }
                                      }}
                                      disabled={user.id === u?.id}
                                  >
                                    <ShieldCheck
                                        className={`h-4 w-4 ${
                                            u.isAdmin ? "text-primary" : ""
                                        }`}
                                    />
                                  </Button>

                                  {/* Delete User Dialog Trigger */}
                                  <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedUserForDeletion(u);
                                        setIsDeleteDialogOpen(true);
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

          {/* Delete User Confirmation Dialog */}
          {selectedUserForDeletion && (
              <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedUserForDeletion(null);
                    }
                    setIsDeleteDialogOpen(open);
                  }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Löschen bestätigen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p>
                      Bist du sicher, dass du den Benutzer{" "}
                      <strong>{selectedUserForDeletion.username}</strong> löschen möchtest?
                    </p>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Abbrechen</Button>
                      </DialogTrigger>
                      <Button
                          variant="destructive"
                          onClick={() => {
                            deleteUserMutation.mutate(selectedUserForDeletion.id);
                          }}
                          disabled={deleteUserMutation.isPending}
                      >
                        Löschen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
          )}
        </main>
      </div>
  );
}
