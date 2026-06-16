const fs = require('fs');

// Language-specific translations (only for existing keys, new keys will be in English)
const translations = {
  de: {
    settings: {
      title: "Einstellungen",
      security: "Sicherheit",
      clearCache: "Cache leeren",
      cacheCleared: "Cache geleert",
      cacheDescription: "App-Cache wurde erfolgreich geleert.",
      appearance: "Aussehen",
      darkMode: "Dunkler Modus",
      lightMode: "Heller Modus",
      transactionCost: "Transaktionskosten",
      transactionCostUpdated: "Transaktionskosten aktualisiert",
      transactionCostDescription: "Gebührenpräferenz auf {{cost}} festgelegt",
      transactionCostInfo: "Eine höhere Gebühr kann den Prozess beschleunigen.",
      low: "Niedrig",
      middle: "Mittel",
      high: "Hoch",
      fiatCurrency: "Fiat-Währung",
      currencyUpdated: "Währung aktualisiert",
      currencyDescription: "Fiat-Währung auf {{currency}} geändert",
      language: "Sprache",
      languageUpdated: "Sprache aktualisiert",
      languageDescription: "Sprache auf {{language}} geändert",
      helpCenter: "Hilfezentrum",
      support: "Unterstützung",
      about: "Über",
      logOut: "Ausloggen",
      loggedOut: "Ausgeloggt",
      loggedOutDescription: "Sie wurden aus Ihrer Wallet ausgeloggt."
    },
    dashboard: {
      title: "Dashboard",
      portfolio: "Portfolio",
      totalBalance: "Gesamtguthaben",
      balance: "Guthaben",
      tokens: "Token",
      send: "Senden",
      receive: "Empfangen",
      swap: "Tauschen",
      buy: "Kaufen",
      search: "Suchen",
      all: "Alle",
      allNetworks: "Alle Netzwerke",
      updating: "Aktualisierung...",
      pullToRefresh: "Zum Aktualisieren ziehen",
      releaseToRefresh: "Loslassen zum Aktualisieren",
      transactionHistory: "Transaktionsverlauf",
      sell: "Verkaufen"
    },
    common: {
      back: "Zurück",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      save: "Speichern",
      search: "Suchen",
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      send: "Senden",
      receive: "Empfangen",
      swap: "Tauschen",
      buy: "Kaufen",
      sell: "Verkaufen"
    },
    bottomNav: {
      wallet: "Wallet",
      market: "Markt",
      swap: "Tauschen",
      profile: "Profil"
    }
  }
};

// Read the English file to get the complete structure with new keys
const enFile = JSON.parse(fs.readFileSync('en/common.json', 'utf8'));

// Restore German file with original translations + new English keys
const deFile = {
  ...enFile,
  settings: { ...enFile.settings, ...translations.de.settings },
  dashboard: { ...enFile.dashboard, ...translations.de.dashboard },
  common: { ...enFile.common, ...translations.de.common },
  bottomNav: { ...enFile.bottomNav, ...translations.de.bottomNav }
};

fs.writeFileSync('de/common.json', JSON.stringify(deFile, null, 2) + '\n');
console.log('Restored German translations');
