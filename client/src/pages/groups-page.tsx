import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import {Beer, GlassWater, Plus, Trash2, UserPlus, Users, Wine} from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {Group, Buyable, BuyablesMap, GroupWithUsers, UserWithStatus, groupStatusMap} from "@shared/schema";
import {BuyButton} from "@/components/ui/buy-button.tsx";

export default function GroupsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    // ----------------- Neue Gruppe erstellen -----------------
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);

    const createGroupMutation = useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            // Hier wird der Endpunkt /api/groups erwartet, der zusätzlich die User-ID des Erstellers verwendet.
            return await apiRequest("POST", "/api/groups", { name });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
            toast({ title: "Gruppe erstellt" });
            setNewGroupName("");
            setIsCreateGroupDialogOpen(false);
        },
    });

    // ----------------- Eigene Gruppen abrufen -----------------
    const { data: myGroups, isLoading: groupsLoading } = useQuery<GroupWithUsers[]>({
        queryKey: ["/api/groups"],
    });

    // ----------------- Gruppeneinladungen abrufen -----------------
    const { data: invitations, isLoading: invitationsLoading } = useQuery<Group[]>({
        queryKey: ["/api/groups/invitations"],
    });

    // ----------------- Einladung beantworten -----------------
    const respondInvitationMutation = useMutation({
        mutationFn: async ({
                               groupId,
                               response,
                           }: {
            groupId: number;
            response: "accepted" | "rejected";
        }) => {
            return await apiRequest("POST", `/api/groups/${groupId}/respond`, { response });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups/invitations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
            toast({ title: "Antwort gespeichert" });
        },
    });

    // ----------------- Gruppe verlassen -----------------
    const [selectedGroupForDeletion, setSelectedGroupForDeletion] = useState<Group | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const leaveGroupMutation = useMutation({
        mutationFn: async (groupId: number) => {
            return await apiRequest("DELETE", `/api/groups/${groupId}/leave`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
            toast({ title: "Gruppe verlassen" });
            setSelectedGroupForDeletion(null);
            setIsDeleteDialogOpen(false);
        },
    });

    // ----------------- Benutzer einladen -----------------
    const [inviteUsername, setInviteUsername] = useState("");
    const [inviteGroupId, setInviteGroupId] = useState<number | null>(null);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    const inviteUserMutation = useMutation({
        mutationFn: async ({
                               groupId,
                               username,
                           }: {
            groupId: number;
            username: string;
        }) => {
            return await apiRequest("POST", `/api/groups/${groupId}/invite`, { username });
        },
        onSuccess: (groupId) => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
            queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
            toast({ title: "Einladung gesendet" });
            setInviteUsername("");
            setInviteGroupId(null);
            setIsInviteDialogOpen(false);
        },
    });

    // ----------------- Mitglieder einer Gruppe anzeigen -----------------
    const [viewMembersGroupId, setViewMembersGroupId] = useState<number | null>(null);
    const { data: groupMembers } = useQuery<UserWithStatus[]>({
        queryKey: [`/api/groups/${viewMembersGroupId}/members`],
        enabled: viewMembersGroupId !== null,
    });

    // ----------------- Gruppeneinkäufe -----------------
    // Auswahl, für welche Gruppe einkaufen werden soll
    const [selectedGroupForPurchase, setSelectedGroupForPurchase] = useState<number | null>(null);
    React.useEffect(() => {
        if (myGroups && myGroups.length > 0 && selectedGroupForPurchase === null) {
            setSelectedGroupForPurchase(myGroups[0].id);
        }
    }, [myGroups, selectedGroupForPurchase]);

    // Buyables laden (gleich wie in der Home‑Page)
    const { data: buyables, isLoading: buyablesLoading } = useQuery<Buyable[]>({
        queryKey: ["/api/buyables"]
    });

    const { data: buyablesMap, isLoading: buyablesMapLoading } = useQuery<BuyablesMap>({
        queryKey: ["/api/buyables/map"]
    });

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

    const groupPurchaseMutation = useMutation({
        mutationFn: async ({
                               buyableId,
                               groupId
                           }: {
            buyableId: number,
            groupId: number;
        }) => {
            return await apiRequest("POST", `/api/groups/${groupId}/purchase`, { buyableId});
        },
        onSuccess: () => {
            toast({ title: "Einkauf erfolgreich" });
        },
    });

    // Handler für Gruppeneinkauf: Hier wird momentan immer 1 Stück gekauft
    const handleGroupPurchase = (args: {buyableId: number}) => {
        if (selectedGroupForPurchase) {
            groupPurchaseMutation.mutate({
                buyableId: args.buyableId, groupId: selectedGroupForPurchase
            });
        } else {
            toast({ title: "Bitte zuerst eine Gruppe auswählen", variant: "destructive" });
        }
    };

    if (buyablesLoading || buyablesMapLoading || !buyablesMap || !buyables) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse">Gruppen werden geladen...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <MainNav currentPath={window.location.pathname} />
            </header>
            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Eigene Gruppen */}
                {/* Gruppeneinladungen */}
                {invitations && invitations!.length > 0 && (<Card>
                        <CardHeader>
                            <CardTitle>Gruppeneinladungen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {invitationsLoading ? (
                                <p>Lade Einladungen...</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Gruppenname</TableHead>
                                            <TableHead className="text-right">Aktionen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invitations.map((group) => (
                                            <TableRow key={group.id}>
                                                <TableCell className="font-medium">{group.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                respondInvitationMutation.mutate({ groupId: group.id, response: "accepted" })
                                                            }
                                                            disabled={respondInvitationMutation.isPending}
                                                        >
                                                            Annehmen
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                respondInvitationMutation.mutate({ groupId: group.id, response: "rejected" })
                                                            }
                                                            disabled={respondInvitationMutation.isPending}
                                                        >
                                                            Ablehnen
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myGroups && myGroups.length > 0 && (<Card>
                        <CardHeader>
                            <CardTitle>Gruppeneinkauf</CardTitle>
                            <div className="flex gap-4 items-center">
                                für
                                <select
                                    className="p-2 border rounded w-full"
                                    value={selectedGroupForPurchase ?? ""}
                                    onChange={(e) =>
                                        setSelectedGroupForPurchase(e.target.value ? parseInt(e.target.value) : null)
                                    }
                                >
                                    {myGroups &&
                                        myGroups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <BuyButton
                                buyable={buyablesMap![1]}
                                onBuy={handleGroupPurchase}
                                icon={Beer}
                            />
                            <BuyButton
                                buyable={buyablesMap![2]}
                                onBuy={handleGroupPurchase}
                                icon={GlassWater}
                            />
                            <BuyButton
                                buyable={buyablesMap![3]}
                                onBuy={handleGroupPurchase}
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
                                                    handleGroupPurchase({ buyableId: selectedOtherBuyableId });
                                                }
                                            }}
                                            disabled={groupPurchaseMutation.isPending || !selectedOtherBuyableId}
                                    >
                                        Kaufen
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>)}
                    <Card className={myGroups && myGroups.length > 0 ? "lg:col-span-2": "lg:col-span-3"}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Meine Gruppen</CardTitle>
                                <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="default" size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Gruppe erstellen</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <Input
                                                placeholder="Gruppenname"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                            />
                                            <Button
                                                className="w-full"
                                                onClick={() => createGroupMutation.mutate({ name: newGroupName })}
                                                disabled={createGroupMutation.isPending}
                                            >
                                                Gruppe erstellen
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {groupsLoading ? (
                                <p>Lade Gruppen...</p>
                            ) : myGroups && myGroups.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Gruppenname</TableHead>
                                            <TableHead className="text-right">Aktionen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myGroups.map((group) => (
                                            <TableRow key={group.id}>
                                                <TableCell className="font-medium">{group.name}
                                                    <span className="text-muted-foreground"> ({
                                                        group.members.slice(0,5).map((m) => m.username).sort().join(", ")
                                                    }{
                                                        group.members.length > 5 && ", ..."
                                                })</span></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {/* Mitglieder anzeigen */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setViewMembersGroupId(group.id)}
                                                        >
                                                            <Users/>
                                                        </Button>
                                                        {/* Benutzer einladen */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setInviteGroupId(group.id);
                                                                setIsInviteDialogOpen(true);
                                                            }}
                                                        >
                                                            <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                        {/* Gruppe verlassen */}
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {setSelectedGroupForDeletion(group); setIsDeleteDialogOpen(true);}}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>Du bist in keiner Gruppe.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>



                {/* Dialog: Benutzer einladen */}
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <span />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Benutzer zur Gruppe einladen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input
                                placeholder="Nutzername"
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                            />
                            <Button
                                className="w-full"
                                onClick={() => {
                                    if (inviteGroupId) {
                                        inviteUserMutation.mutate({
                                            groupId: inviteGroupId,
                                            username: inviteUsername,
                                        });
                                    }
                                }}
                                disabled={inviteUserMutation.isPending}
                            >
                                Einladung senden
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Gruppenmitglieder anzeigen */}
                <Dialog
                    open={viewMembersGroupId !== null}
                    onOpenChange={(open) => {
                        if (!open) setViewMembersGroupId(null);
                    }}
                >
                    <DialogTrigger asChild>
                        <span />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mitglieder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {groupMembers && groupMembers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Benutzername</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>{member.username}</TableCell>
                                                <TableCell className={member.status == "accepted" ? "text-primary" : "text-muted-foreground"}>{groupStatusMap[member.status]}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>Keine Mitglieder gefunden.</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                {selectedGroupForDeletion && (
                    <Dialog
                        open={isDeleteDialogOpen}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedGroupForDeletion(null);
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
                                    Bist du sicher, dass du die Gruppe <strong>{selectedGroupForDeletion.name}</strong> löschen möchtest?
                                </p>
                                <div className="flex justify-end gap-2">
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Abbrechen</Button>
                                    </DialogTrigger>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            leaveGroupMutation.mutate(selectedGroupForDeletion.id);
                                        }}
                                        disabled={leaveGroupMutation.isPending}
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
