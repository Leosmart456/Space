/**
 * Shared broker directory + logo resolver used by the landing page's
 * self-solving broker puzzle showcase and the Transfer flow's "external
 * brokerage" destination picker.
 */
import { useState } from "react";

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export const BROKERS = [
  // ── United States ─────────────────────────────────────────────────────────
  { name: "Fidelity",             domain: "fidelity.com",            logoUrl: "/brokers/fidelity.svg",    region: "US" },
  { name: "Charles Schwab",       domain: "schwab.com",              logoUrl: "/brokers/schwab.png",      region: "US" },
  { name: "Interactive Brokers",  domain: "interactivebrokers.com",  logoUrl: "/brokers/ibkr.png",        region: "US" },
  { name: "TD Ameritrade",        domain: "tdameritrade.com",        logoUrl: "/brokers/tdameritrade.svg",region: "US" },
  { name: "Robinhood",            domain: "robinhood.com",           logoUrl: "/brokers/robinhood.png",   region: "US" },
  { name: "Webull",               domain: "webull.com",              logoUrl: "/brokers/webull.svg",      region: "US" },
  { name: "Vanguard",             domain: "vanguard.com",            logoUrl: "/brokers/vanguard.svg",    region: "US" },
  { name: "Merrill Edge",         domain: "merrilledge.com",         logoUrl: "/brokers/merrill.svg",     region: "US" },
  { name: "Moomoo",               domain: "moomoo.com",              logoUrl: "/brokers/moomoo.png",      region: "US" },
  { name: "E*TRADE",              domain: "etrade.com",              logoUrl: "",                         region: "US" },
  { name: "Morgan Stanley",       domain: "morganstanley.com",       logoUrl: "",                         region: "US" },
  { name: "SoFi Invest",          domain: "sofi.com",                logoUrl: "",                         region: "US" },
  { name: "Public.com",           domain: "public.com",              logoUrl: "",                         region: "US" },
  { name: "TradeStation",         domain: "tradestation.com",        logoUrl: "",                         region: "US" },
  { name: "Tastytrade",           domain: "tastytrade.com",          logoUrl: "",                         region: "US" },
  { name: "Ally Invest",          domain: "ally.com",                logoUrl: "",                         region: "US" },
  { name: "Alpaca",               domain: "alpaca.markets",          logoUrl: "",                         region: "US" },
  { name: "Pershing (BNY Mellon)",domain: "pershing.com",            logoUrl: "",                         region: "US" },
  { name: "Raymond James",        domain: "raymondjames.com",        logoUrl: "",                         region: "US" },
  { name: "Edward Jones",         domain: "edwardjones.com",         logoUrl: "",                         region: "US" },
  { name: "Stifel",               domain: "stifel.com",              logoUrl: "",                         region: "US" },
  { name: "LPL Financial",        domain: "lpl.com",                 logoUrl: "",                         region: "US" },
  { name: "Wealthfront",          domain: "wealthfront.com",         logoUrl: "",                         region: "US" },
  { name: "Betterment",           domain: "betterment.com",          logoUrl: "",                         region: "US" },
  { name: "M1 Finance",           domain: "m1.com",                  logoUrl: "",                         region: "US" },
  { name: "Acorns",               domain: "acorns.com",              logoUrl: "",                         region: "US" },
  { name: "Stash",                domain: "stash.com",               logoUrl: "",                         region: "US" },
  // ── United Kingdom ────────────────────────────────────────────────────────
  { name: "Hargreaves Lansdown",  domain: "hl.co.uk",                logoUrl: "/brokers/hl.svg",          region: "UK" },
  { name: "Freetrade",            domain: "freetrade.io",            logoUrl: "/brokers/freetrade.svg",   region: "UK" },
  { name: "AJ Bell",              domain: "ajbell.co.uk",            logoUrl: "",                         region: "UK" },
  { name: "Interactive Investor", domain: "ii.co.uk",                logoUrl: "",                         region: "UK" },
  { name: "Nutmeg",               domain: "nutmeg.com",              logoUrl: "",                         region: "UK" },
  { name: "Moneybox",             domain: "moneyboxapp.com",         logoUrl: "",                         region: "UK" },
  { name: "CMC Markets",          domain: "cmcmarkets.com",          logoUrl: "/brokers/cmc.png",         region: "UK" },
  { name: "IG Group",             domain: "ig.com",                  logoUrl: "/brokers/ig.svg",          region: "UK" },
  // ── Europe ────────────────────────────────────────────────────────────────
  { name: "DEGIRO",               domain: "degiro.com",              logoUrl: "/brokers/degiro.svg",      region: "EU" },
  { name: "eToro",                domain: "etoro.com",               logoUrl: "/brokers/etoro.svg",       region: "EU" },
  { name: "Saxo Bank",            domain: "home.saxo",               logoUrl: "/brokers/saxo.svg",        region: "EU" },
  { name: "XTB",                  domain: "xtb.com",                 logoUrl: "/brokers/xtb.svg",         region: "EU" },
  { name: "Plus500",              domain: "plus500.com",             logoUrl: "/brokers/plus500.svg",     region: "EU" },
  { name: "Firstrade",            domain: "firstrade.com",           logoUrl: "/brokers/firstrade.svg",   region: "EU" },
  { name: "Trading 212",          domain: "trading212.com",          logoUrl: "/brokers/trading212.svg",  region: "EU" },
  { name: "Trade Republic",       domain: "traderepublic.com",       logoUrl: "",                         region: "EU" },
  { name: "Scalable Capital",     domain: "scalable.capital",        logoUrl: "",                         region: "EU" },
  { name: "Flatex",               domain: "flatex.de",               logoUrl: "",                         region: "EU" },
  { name: "BUX",                  domain: "bux.com",                 logoUrl: "",                         region: "EU" },
  { name: "Revolut Invest",       domain: "revolut.com",             logoUrl: "",                         region: "EU" },
  { name: "Swissquote",           domain: "swissquote.com",          logoUrl: "",                         region: "EU" },
  { name: "Libertex",             domain: "libertex.com",            logoUrl: "",                         region: "EU" },
  { name: "Exness",               domain: "exness.com",              logoUrl: "",                         region: "EU" },
  { name: "Admiral Markets",      domain: "admiralmarkets.com",      logoUrl: "",                         region: "EU" },
  { name: "Dukascopy",            domain: "dukascopy.com",           logoUrl: "",                         region: "EU" },
  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  { name: "Tiger Brokers",        domain: "tigersecurities.com",     logoUrl: "",                         region: "APAC" },
  { name: "Futu (moomoo HK)",     domain: "futu.com",                logoUrl: "",                         region: "APAC" },
  { name: "Rakuten Securities",   domain: "rakuten-sec.co.jp",       logoUrl: "",                         region: "APAC" },
  { name: "SBI Securities",       domain: "sbisec.co.jp",            logoUrl: "",                         region: "APAC" },
  { name: "Mirae Asset",          domain: "miraeasset.com",          logoUrl: "",                         region: "APAC" },
  { name: "CommSec",              domain: "commsec.com.au",          logoUrl: "",                         region: "APAC" },
  { name: "Stake",                domain: "stake.com",               logoUrl: "",                         region: "APAC" },
  { name: "Superhero",            domain: "superhero.com.au",        logoUrl: "",                         region: "APAC" },
  { name: "Zerodha",              domain: "zerodha.com",             logoUrl: "",                         region: "APAC" },
  { name: "Groww",                domain: "groww.in",                logoUrl: "",                         region: "APAC" },
  { name: "Upstox",               domain: "upstox.com",              logoUrl: "",                         region: "APAC" },
  { name: "Angel Broking",        domain: "angelbroking.com",        logoUrl: "",                         region: "APAC" },
  { name: "Kotak Securities",     domain: "kotaksecurities.com",     logoUrl: "",                         region: "APAC" },
  { name: "ICICI Direct",         domain: "icicidirect.com",         logoUrl: "",                         region: "APAC" },
  { name: "Phillip Securities",   domain: "poems.com.sg",            logoUrl: "",                         region: "APAC" },
  { name: "Maybank Securities",   domain: "maybank.com",             logoUrl: "",                         region: "APAC" },
  { name: "CIMB Securities",      domain: "cimb.com",                logoUrl: "",                         region: "APAC" },
  // ── Middle East & Africa ──────────────────────────────────────────────────
  { name: "Sarwa",                domain: "sarwa.co",                logoUrl: "",                         region: "MEA" },
  { name: "Baraka",               domain: "getbaraka.com",           logoUrl: "",                         region: "MEA" },
  { name: "StashAway",            domain: "stashaway.com",           logoUrl: "",                         region: "MEA" },
  { name: "Mubasher",             domain: "mubasher.net",            logoUrl: "",                         region: "MEA" },
  // ── Canada ────────────────────────────────────────────────────────────────
  { name: "Questrade",            domain: "questrade.com",           logoUrl: "",                         region: "CA" },
  { name: "TD Direct Investing",  domain: "td.com",                  logoUrl: "",                         region: "CA" },
  { name: "Qtrade",               domain: "qtrade.ca",               logoUrl: "",                         region: "CA" },
  { name: "Wealthsimple",         domain: "wealthsimple.com",        logoUrl: "",                         region: "CA" },
  { name: "National Bank Direct", domain: "nbc.ca",                  logoUrl: "",                         region: "CA" },
  // ── Latin America ─────────────────────────────────────────────────────────
  { name: "XP Investimentos",     domain: "xp.com.br",               logoUrl: "",                         region: "LATAM" },
  { name: "BTG Pactual",          domain: "btgpactual.com",          logoUrl: "",                         region: "LATAM" },
  { name: "nuInvest",             domain: "nuinvest.com.br",         logoUrl: "",                         region: "LATAM" },
  // ── Other / Global ────────────────────────────────────────────────────────
  { name: "Other",                domain: "other.com",               logoUrl: "",                         region: "Global" },
] as const;

export type Broker = (typeof BROKERS)[number];

/**
 * BrokerLogo — tries our server-side logo proxy first, then the local static
 * file (fallbackUrl), then a coloured initials badge as the final fallback.
 * Works with both Tailwind className and raw inline style.
 */
export function BrokerLogo({
  name, domain, fallbackUrl, size = 40, className, style,
}: {
  name: string; domain: string; size?: number;
  className?: string; style?: React.CSSProperties;
  /** Local static image path (e.g. "/brokers/fidelity.svg") used after the proxy fails */
  fallbackUrl?: string;
}) {
  // Stage: proxy → fallback static file → initials
  const initialStage: "proxy" | "fallback" | "initials" =
    domain ? "proxy" : fallbackUrl ? "fallback" : "initials";
  const [stage, setStage] = useState<"proxy" | "fallback" | "initials">(initialStage);

  const proxyUrl = `${API_BASE}/logos/${domain}`;

  // Consistent colour + initials from the name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const containerStyle: React.CSSProperties = {
    width: size, height: size, borderRadius: size / 2,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
    ...style,
  };

  function handleError() {
    if (stage === "proxy" && fallbackUrl) {
      setStage("fallback");
    } else {
      setStage("initials");
    }
  }

  if (stage === "initials") {
    return (
      <div
        className={className}
        style={{ ...containerStyle, background: `hsla(${hue},70%,50%,0.15)`, border: `1px solid hsla(${hue},70%,60%,0.30)` }}
        aria-label={name}
      >
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color: `hsl(${hue},70%,65%)`, letterSpacing: "-0.5px", lineHeight: 1 }}>
          {initials}
        </span>
      </div>
    );
  }

  const src = stage === "proxy" ? proxyUrl : (fallbackUrl ?? "");

  return (
    <div className={className} style={{ ...containerStyle, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <img
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
        style={{ width: "78%", height: "78%", objectFit: "contain" }}
        onError={handleError}
      />
    </div>
  );
}
