# Builder-Stage: Installiere alle Abhängigkeiten und erstelle den Build
FROM node:23-alpine AS builder

# Arbeitsverzeichnis festlegen
WORKDIR /app

# Zuerst nur die package.json (und ggf. package-lock.json) kopieren, um die Layer-Caching zu nutzen
COPY package*.json ./

# Alle Abhängigkeiten installieren (hier werden auch DevDependencies installiert)
RUN npm install

# Restlichen Code kopieren
COPY . .

# Erstelle den Build (z.B. generiert /dist)
RUN npm run build

# Runner-Stage: Nur die Produktionsabhängigkeiten und den erstellten Code übernehmen
FROM node:23-alpine AS runner

WORKDIR /app

# Nur die package.json kopieren für die Installation der Produktionsabhängigkeiten
COPY package*.json ./

# Installiere nur die Produktionsabhängigkeiten
RUN npm install

# Kopiere den Build aus der Builder-Stage
COPY --from=builder /app/dist ./dist

# Starte die Anwendung (STARt-Skript sollte den richtigen Befehl ausführen)
CMD ["npm", "start"]