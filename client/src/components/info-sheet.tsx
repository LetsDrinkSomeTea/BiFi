import {Info} from "lucide-react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import { Button } from "./ui/button";

import {User} from "@shared/schema";

interface InfoSheetProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: User | null;
}

export function InfoSheet({ isOpen, setIsOpen, user }: InfoSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                    <Info className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full max-w-sm bg-white p-4 shadow-lg"
            >
                <SheetHeader className="flex items-center justify-between pb-2 border-b">
                    <SheetTitle className="text-xl font-semibold">Info</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-6 overflow-y-auto">
                    {/* Hauptfunktionen */}
                    <section>
                        <h3 className="text-lg font-medium mb-2">Hauptfunktionen</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <p>
                                <strong>Dashboard:</strong> Kontostand anzeigen und direkt einkaufen.
                            </p>
                            <p>
                                <strong>Gruppen:</strong> Gruppen erstellen, Freunde einladen und verwalten.
                            </p>
                            {user?.allowedJackpot && (
                                <p>
                                    <strong>Jackpot:</strong> Warum für Getränke zahlen wenn man auch am Glücksrad drehen kann?.
                                </p>
                            )}
                        </ul>
                    </section>

                    {/* Statistiken & Transaktionen */}
                    <section>
                        <h3 className="text-lg font-medium mb-2">Analyse</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <p>
                                <strong>Statistiken:</strong> Einkaufs- und Erfolgsauswertung.
                            </p>
                            <p>
                                <strong>Transaktionen:</strong> Alle Ein- und Auszahlungen im Überblick.
                            </p>
                        </ul>
                    </section>

                    {/* Einzahlung */}
                    <section>
                        <h3 className="text-lg font-medium mb-2">Einzahlung</h3>
                        <p className="text-gray-600">
                            Bargeld gibst du einem/einer BiFi-Beauftragten, er/sie bucht es direkt auf dein Konto.
                        </p>
                    </section>

                    {/* Admin-Bereich */}
                    {user?.isAdmin && (
                        <section className="pt-4 border-t">
                            <h3 className="text-lg font-medium mb-2 text-red-600">
                                Admin-Bereich
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <p>
                                    <strong>Inventar:</strong> Getränke verwalten.
                                </p>
                                <p>
                                    <strong>Benutzer:</strong> Accounts anlegen & Passwörter ändern.
                                </p>
                                <p>
                                    <strong>Log:</strong> Alle Interaktionen im Überblick.
                                </p>
                            </ul>
                        </section>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
