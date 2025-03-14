import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import {useMutation} from "@tanstack/react-query";
import {apiRequest} from "@/lib/queryClient.ts";

interface PasswordChangeDialogProps {
    isDialogOpen: boolean;
    setIsDialogOpen: (isOpen: boolean) => void;
}

function PasswordChangeDialog({ isDialogOpen, setIsDialogOpen}: PasswordChangeDialogProps) {
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [newPasswordRepeat, setNewPasswordRepeat] = React.useState("");


    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/change-password", {
                currentPassword,
                newPassword,
            });
        },
        onSuccess: () => {
            toast({ title: "Passwort erfolgreich geändert" });
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordRepeat("");
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Passwort konnte nicht geändert werden",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start hover:text-muted-foreground">
                    <Key className="h-4 w-4 mr-2" />
                    Passwort ändern
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Passwort ändern</DialogTitle>
                <div className="space-y-4 pt-4">
                    <Input
                        type="password"
                        placeholder="Aktuelles Passwort"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Neues Passwort"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Neues Passwort wiederholen"
                        value={newPasswordRepeat}
                        onChange={(e) => setNewPasswordRepeat(e.target.value)}
                    />
                    <Button
                        className="w-full"
                        onClick={() => {
                            if (newPassword !== newPasswordRepeat) {
                                toast({
                                    title: "Passwort konnte nicht geändert werden",
                                    description: "Neues Passwort und die Wiederholung stimmen nicht überein",
                                    variant: "destructive",
                                });
                                return;
                            }
                            changePasswordMutation.mutate()
                        }}
                    >
                        Passwort ändern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { PasswordChangeDialog };