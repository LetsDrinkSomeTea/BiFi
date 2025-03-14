import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Trash2, Plus, Edit, Package, ArchiveRestore} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { MainNav } from "@/components/main-nav";
import { Buyable } from "@shared/schema"

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Nur Admins haben Zugriff
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  // Hole alle Buyables
  const { data: buyables } = useQuery<Buyable[]>({
    queryKey: ["/api/buyables"],
  });

  // State für Dialogs und Formularfelder
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  const [selectedBuyable, setSelectedBuyable] = useState<Buyable | null>(null);
  const [selectedBuyableForDeletion, setSelectedBuyableForDeletion] = useState<Buyable | null>(null);

  // Felder für "Neues Buyable"
  const [newBuyableName, setNewBuyableName] = useState("");
  const [newBuyablePrice, setNewBuyablePrice] = useState("");
  const [newBuyableStock, setNewBuyableStock] = useState("");
  const [newBuyableCategory, setNewBuyableCategory] = useState("");

  // Felder für "Buyable bearbeiten"
  const [editBuyablePrice, setEditBuyablePrice] = useState("");
  const [editBuyableStock, setEditBuyableStock] = useState("");
  const [editBuyableCategory, setEditBuyableCategory] = useState("");

  const [restockAmount, setRestockAmount] = useState("");

  // Mutation zum Erstellen eines neuen Buyables
  const createBuyableMutation = useMutation({
    mutationFn: async ({
                         name,
                         price,
                         stock,
                         category,
                       }: {
      name: string;
      price: number;
      stock: number;
      category: string;
    }) => {
      await apiRequest("POST", "/api/admin/buyables", { name, price, stock, category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyables"] });
      toast({ title: "Buyable erfolgreich erstellt" });
      setNewBuyableName("");
      setNewBuyablePrice("");
      setNewBuyableStock("");
      setNewBuyableCategory("");
      setIsCreateDialogOpen(false);
    },
  });

  // Mutation zum Bearbeiten eines Buyables
  const editBuyableMutation = useMutation({
    mutationFn: async ({
                         id,
                         price,
                         stock,
                         category,
                       }: {
      id: number;
      price: number;
      stock: number;
      category: string;
    }) => {
      await apiRequest("PATCH", `/api/admin/buyables/${id}`, { price, stock, category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyables"] });
      toast({ title: "Buyable erfolgreich aktualisiert" });
      setIsEditDialogOpen(false);
      setSelectedBuyable(null);
    },
  });

  // Mutation zum Löschen eines Buyables
  const deleteBuyableMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/buyables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyables"] });
      toast({ title: "Buyable erfolgreich gelöscht" });
      setIsDeleteDialogOpen(false);
      setSelectedBuyableForDeletion(null);
    },
  });
  
  // Mutation zum Wiederherstellen eines Buyables
  const restoreBuyableMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/buyables/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/buyables"]});
      toast({title: "Buyable erfolgreich wiederhergestellt"});
      setIsRestoreDialogOpen(false);
      setSelectedBuyable(null);
    },
  });

  // Mutation zum restocken eines Buyables
  const restockBuyableMutation = useMutation({
    mutationFn: async ({id, amount} : {id: number, amount: number}) => {
      await apiRequest("PATCH", `/api/admin/buyables/${id}/restock`, {amount});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyables"] });
      toast({ title: "Buyable erfolgreich aufgestockt" });
      setIsRestockDialogOpen(false);
      setSelectedBuyable(null);
    }
  })

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <MainNav currentPath={window.location.pathname} />
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventar</CardTitle>
              <div className="flex flex-row gap-4 items-center">
                <Package className="h-5 w-5 text-muted-foreground" />
                {/* Dialog zum Erstellen eines neuen Buyables */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="icon">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neues Buyable anlegen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                          placeholder="Name"
                          value={newBuyableName}
                          onChange={(e) => setNewBuyableName(e.target.value)}
                      />
                      <Input
                          type="number"
                          placeholder="Preis"
                          value={newBuyablePrice}
                          onChange={(e) => setNewBuyablePrice(e.target.value)}
                      />
                      <Input
                          type="number"
                          placeholder="Lagerbestand"
                          value={newBuyableStock}
                          onChange={(e) => setNewBuyableStock(e.target.value)}
                      />
                      <Input
                          placeholder="Kategorie"
                          value={newBuyableCategory}
                          onChange={(e) => setNewBuyableCategory(e.target.value)}
                      />
                      <Button
                          className="w-full"
                          onClick={() =>
                              createBuyableMutation.mutate({
                                name: newBuyableName,
                                price: parseFloat(newBuyablePrice),
                                stock: parseInt(newBuyableStock),
                                category: newBuyableCategory,
                              })
                          }
                          disabled={createBuyableMutation.isPending}
                      >
                        Buyable erstellen
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
                    <TableHead>Name</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead>Lagerbestand</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyables
                      ?.filter((b) => {return !b.deleted}).sort((a, b) => a.name.localeCompare(b.name))
                      .map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell>{b.price.toFixed(2)}€</TableCell>
                            <TableCell className={b.stock < 10 ? "text-destructive" : "text-primary"}>{b.stock}</TableCell>
                            <TableCell>{b.category}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {/* Löschen Button*/}
                                {b.id > 3 ? ( // Bier, Wein und Softdrinks können nicht gelöscht werden
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedBuyableForDeletion(b);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>) : ''
                                }
                                {/* Aufstocken */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedBuyable(b);
                                      setIsRestockDialogOpen(true)
                                    }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedBuyable(b);
                                      setEditBuyablePrice(b.price.toString());
                                      setEditBuyableStock(b.stock.toString());
                                      setEditBuyableCategory(b.category);
                                      setIsEditDialogOpen(true);
                                    }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {/* Löschen */}
                              </div>
                            </TableCell>
                          </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {buyables!.filter((b) => {return b.deleted}).length > 0 ? (<Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gelöschte Gegenstände</CardTitle>
              <div className="flex flex-row gap-4 items-center">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyables
                      ?.filter((b) => {return b.deleted}).sort((a, b) => a.name.localeCompare(b.name))
                      .map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell>{b.price.toFixed(2)}€</TableCell>
                            <TableCell>{b.category}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedBuyable(b);
                                      setIsRestoreDialogOpen(true)
                                    }}
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                            </TableCell>
                          </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>) : ''}

          {/* Dialog zum Bearbeiten eines Buyables */}
          {selectedBuyable && (
              <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedBuyable(null);
                    }
                    setIsEditDialogOpen(open);
                  }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buyable bearbeiten – {selectedBuyable.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex-col gap-2">
                      <div className="flex text-muted-foreground text-sm">Preis</div>
                    <Input
                        type="number"
                        placeholder="Preis"
                        value={editBuyablePrice}
                        onChange={(e) => setEditBuyablePrice(e.target.value)}
                    />
                    </div>
                    <div className="flex-col gap-2">
                      <div className="flex text-muted-foreground text-sm">Lagerbestand</div>
                    <Input
                        type="number"
                        placeholder="Lagerbestand"
                        value={editBuyableStock}
                        onChange={(e) => setEditBuyableStock(e.target.value)}
                    />
                    </div>
                      <div className="flex-col gap-2">
                        <div className="flex text-muted-foreground text-sm">Kategorie</div>
                    <Input
                        placeholder="Kategorie"
                        value={editBuyableCategory}
                        onChange={(e) => setEditBuyableCategory(e.target.value)}
                    />
                      </div>
                    <Button
                        className="w-full"
                        onClick={() => {
                          if (selectedBuyable) {
                            editBuyableMutation.mutate({
                              id: selectedBuyable.id,
                              price: parseFloat(editBuyablePrice),
                              stock: parseInt(editBuyableStock),
                              category: editBuyableCategory,
                            });
                          }
                        }}
                        disabled={editBuyableMutation.isPending}
                    >
                      Änderungen speichern
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
          )}

          {/* Bestätigungsdialog zum Löschen eines Buyables */}
          {selectedBuyableForDeletion && (
              <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedBuyableForDeletion(null);
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
                      Bist du sicher, dass du das Buyable{" "}
                      <strong>{selectedBuyableForDeletion.name}</strong> löschen möchtest?
                    </p>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Abbrechen</Button>
                      </DialogTrigger>
                      <Button
                          variant="destructive"
                          onClick={() =>
                              deleteBuyableMutation.mutate(selectedBuyableForDeletion.id)
                          }
                          disabled={deleteBuyableMutation.isPending}
                      >
                        Löschen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
          )}
          {/* Dialog für Restock */}
          {selectedBuyable && (
              <Dialog
                  open={isRestockDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedBuyable(null);
                    }
                    setIsRestockDialogOpen(open);
                  }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lagerbestand aufstocken - {selectedBuyable.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex-col gap-2">
                      <div className="flex text-muted-foreground text-sm">Aufstocken um</div>
                      <Input
                          type="number"
                          placeholder="Stückzahl"
                          value={restockAmount}
                          onChange={(e) => setRestockAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Abbrechen</Button>
                      </DialogTrigger>
                      <Button
                          variant="default"
                          onClick={() =>
                              restockBuyableMutation.mutate({id: selectedBuyable.id, amount: parseInt(restockAmount)})
                          }
                          disabled={deleteBuyableMutation.isPending}
                      >
                        Aufstocken
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
          )}

          {/* Bestätigungsdialog zum Wiederherstellen eines Buyables */}
          {selectedBuyable && (
              <Dialog
                  open={isRestoreDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedBuyable(null);
                    }
                    setIsRestoreDialogOpen(open);
                  }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Wiederherstellen bestätigen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p>
                      Bist du sicher, dass du das Buyable{" "}
                      <strong>{selectedBuyable.name}</strong> wiederherstellen möchtest?
                    </p>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Abbrechen</Button>
                      </DialogTrigger>
                      <Button
                          variant="default"
                          onClick={() =>
                              restoreBuyableMutation.mutate(selectedBuyable.id)
                          }
                          disabled={restoreBuyableMutation.isPending}
                      >
                        Wiederherstellen
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
