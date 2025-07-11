import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { Beer } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" }
  });

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="flex flex-col-reverse md:flex-row max-w-4xl w-full gap-8">
        <Card className="flex-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
          </CardHeader>
          <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(data => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benutzername</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      Anmelden
                    </Button>
                  </form>
                </Form>
          </CardContent>
        </Card>

        <div className="flex-1 text-center md:text-left">
          <div className="space-y-4">
            <Beer className="h-12 w-12 mx-auto md:mx-0 text-primary" />
            <h1 className="text-4xl font-bold">BiFi Strichliste</h1>
            <p className="text-muted-foreground">
              Behalte deine Getränke im Blick, verwalte dein Guthaben und schalte Erfolge frei.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
