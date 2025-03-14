import {Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {Menu, Beer, LogOut, BarChart, Users, Warehouse, LucideProps} from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { PasswordChangeDialog } from "@/components/password-change-dialog";

interface MainNavProps {
  currentPath: string;
}

export type MainNavItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  show?: boolean
};

export function MainNav({currentPath}: MainNavProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const navigation: MainNavItem[] = [
    { name: "Dashboard", href: "/", icon: Beer, show: true },
    { name: "Statistiken", href: "/stats", icon: BarChart, show: true },
    { name: "Inventar", href: "/inventory", icon: Warehouse, show: user?.isAdmin },
    { name: "Admin", href: "/admin", icon: Users, show: user?.isAdmin }
  ];

  return (
      <>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
          <div className="flex items-center gap-2">
            <Beer className="h-6 w-6" />
            <h1 className="font-bold text-lg">BiFi Strichliste</h1>
          </div>
          </Link>
        <div className="text-muted-foreground">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10">
                <Menu className="h-full w-full"/>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="text-lg">Navigation</SheetTitle>
              <SheetDescription className="text-sm"></SheetDescription>
              <div className="flex flex-col gap-4 py-4">
                {navigation.filter(item => item.href != currentPath).map(item =>
                        item.show && (
                            <Link key={item.href} href={item.href}>
                              <Button variant="ghost" className="w-full justify-start">
                                <item.icon className="h-4 w-4 mr-2"/>
                                {item.name}
                              </Button>
                            </Link>
                        )
                )}
                <PasswordChangeDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    onChangePassword={() => changePasswordMutation.mutate()}
                />
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4 mr-2"/>
                  Abmelden
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        </div>

      </>
  );
}