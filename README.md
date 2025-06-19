# BiFi Strichliste

BiFi Strichliste ist eine Webanwendung zur Verwaltung einer digitalen Getränkeliste. Benutzer können Einkäufe tätigen, ihr Guthaben überblicken und Erfolge freischalten. Administratoren verwalten Benutzer, Guthaben und Artikel. Die Anwendung setzt sich aus einem Express-Server mit PostgreSQL-Datenbank und einem React-Frontend zusammen.

## Funktionen

- Benutzerverwaltung mit Login (Passport Local)
- Kauf- und Einzahlungshistorie
- Achievement-System
- Statistikübersichten
- Gruppenfunktionen
- Admin-Bereich zum Anlegen von Benutzern, Einzahlungen, Passwortzurücksetzungen und Artikelpflege

## Projektstruktur

- `client/` – React-Frontend (Vite, Tailwind CSS)
- `server/` – Express-Server mit REST-API
- `shared/` – Gemeinsame TypeScript-Typen, Datenbank-Schema und Hilfsfunktionen
- `init.sql` – Datenbankinitialisierung für PostgreSQL
- `docker-compose.yaml` – Umgebung mit PostgreSQL, Redis und App-Container

## Entwicklung starten

Voraussetzungen: Node.js (>=18), eine PostgreSQL-Datenbank und optional Redis für die Session-Verwaltung.

```bash
docker compose up db -d
npm install
npm run dev
```

Der Server läuft anschließend auf Port `5000` und bindet das React-Frontend ein.

## Mit Docker ausführen

Mit Docker Compose werden Datenbank, Redis und die Anwendung direkt gestartet:

```bash
docker compose up --build
```

Die App ist danach unter <http://localhost:5000> erreichbar.

## Produktion

Für einen Produktionsbuild:

```bash
npm run build
npm start
```

Dabei werden die statischen Dateien nach `dist/public` gebaut und der Server startet im Production-Modus.