import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

interface PasswordChangeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentPassword: string;
    setCurrentPassword: (password: string) => void;
    newPassword: string;
    setNewPassword: (password: string) => void;
    onChangePassword: () => void;
}

function PasswordChangeDialog({ isOpen, onOpenChange, currentPassword, setCurrentPassword, newPassword, setNewPassword, onChangePassword }: PasswordChangeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                    <Button
                        className="w-full"
                        onClick={onChangePassword}
                    >
                        Passwort ändern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { PasswordChangeDialog };