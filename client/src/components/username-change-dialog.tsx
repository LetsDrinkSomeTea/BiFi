import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPen} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import {useMutation} from "@tanstack/react-query";
import {apiRequest} from "@/lib/queryClient.ts";

interface UsernameChangeDialogProps {
    isDialogOpen: boolean;
    setIsDialogOpen: (isOpen: boolean) => void;
}

function UsernameChangeDialog({ isDialogOpen, setIsDialogOpen}: UsernameChangeDialogProps) {
    const { toast } = useToast();
    const [newUsername, setNewUsername] = React.useState("");

    const changeUsernameMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/change-username", {
                newUsername,
            });
        },
        onSuccess: () => {
            toast({ title: "Nutzername erfolgreich geändert" });
            setNewUsername("");
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Nutzername konnte nicht geändert werden",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start hover:text-muted-foreground">
                    <UserPen className="h-4 w-4 mr-2" />
                    Nutzername ändern
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Nutzername ändern</DialogTitle>
                <div className="space-y-4 pt-4">
                    <Input
                        type="username"
                        placeholder="Neues Nutzername"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <Button
                        className="w-full"
                        onClick={() => {
                            changeUsernameMutation.mutate()
                        }}
                    >
                        Nutzername ändern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { UsernameChangeDialog };