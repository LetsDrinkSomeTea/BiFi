import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Beer, History, Trophy, LogOut, Key, BarChart, Users } from "lucide-react";

export function MainNav() {
  const { user, logoutMutation } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Beer,
      show: true
    },
    {
      name: "Statistiken",
      href: "/stats",
      icon: BarChart,
      show: true
    },
    {
      name: "Admin",
      href: "/admin",
      icon: Users,
      show: user?.isAdmin
    }
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="flex flex-col gap-4 py-4">
              {navigation.map((item) => 
                item.show && (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="w-full justify-start">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                )
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex lg:gap-4">
        {navigation.map((item) => 
          item.show && (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost">
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            </Link>
          )
        )}
        <Button variant="ghost" className="text-destructive" onClick={() => logoutMutation.mutate()}>
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
      </div>
    </>
  );
}
