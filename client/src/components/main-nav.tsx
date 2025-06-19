import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  Beer,
  LogOut,
  BarChart,
  Users,
  Warehouse,
  LucideProps,
  Gem,
  ReceiptText, ScrollText
} from 'lucide-react'
import React, { useState } from "react";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import {UsernameChangeDialog} from "@/components/username-change-dialog.tsx";

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
  const [isPasswordDialogOpen, setisPasswordDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setisUsernameDialogOpen] = useState(false);


  const navigation: MainNavItem[] = [
    { name: "Dashboard", href: "/", icon: Beer, show: true },
    { name: "Gruppen", href: "/groups", icon: Users, show: true },
    { name: "Jackpot", href: "/jackpot", icon: Gem, show: user?.allowedJackpot},
    { name: "Statistiken", href: "/stats", icon: BarChart, show: true },
    { name: "Transaktionen", href: "/transactions", icon: ReceiptText, show: true },
  ];

  const adminNavigation: MainNavItem[] = [
    { name: "Inventar", href: "/inventory", icon: Warehouse, show: user?.isAdmin },
    { name: "Benutzer", href: "/admin", icon: Users, show: user?.isAdmin },
    { name: "Log", href: "/log", icon: ScrollText, show: user?.isAdmin },
  ]

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
                {navigation.map(item =>
                        item.show && (
                            <Link key={item.href} href={item.href}>
                              <Button variant={item.href == currentPath? "secondary" : "ghost"} className="w-full justify-start hover:text-muted-foreground">
                                <item.icon className="h-4 w-4 mr-2"/>
                                {item.name}
                              </Button>
                            </Link>
                        )
                )}
                {user?.isAdmin && (<SheetDescription className="text-muted-foreground">Admin</SheetDescription>)}
                {adminNavigation.map(item =>
                        item.show && (
                            <Link key={item.href} href={item.href}>
                              <Button variant={item.href == currentPath? "secondary" : "ghost"} className="w-full justify-start hover:text-muted-foreground">
                                <item.icon className="h-4 w-4 mr-2"/>
                                {item.name}
                              </Button>
                            </Link>
                        )
                )}
                {<SheetDescription className="text-muted-foreground">Account (<strong>{user?.username}</strong>)</SheetDescription>}
                <PasswordChangeDialog
                    isDialogOpen={isPasswordDialogOpen}
                    setIsDialogOpen={setisPasswordDialogOpen}
                />
                <UsernameChangeDialog
                    isDialogOpen={isUsernameDialogOpen}
                    setIsDialogOpen={setisUsernameDialogOpen}
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