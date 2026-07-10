import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import logoBase64 from "./app_logo.png";
import { logger } from "./logger";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "leesmart995@gmail.com";

export type SmtpStatus = {
  status: "unchecked" | "ok" | "error" | "misconfigured";
  message: string;
  checkedAt: string | null;
};

let smtpStatus: SmtpStatus = {
  status: "unchecked",
  message: "Email connection has not been verified yet.",
  checkedAt: null,
};

export function getSmtpStatus(): SmtpStatus {
  return smtpStatus;
}

// ─── Transport detection ──────────────────────────────────────────────────────
// Priority: Resend API key (HTTPS, works on all cloud hosts) → SMTP fallback

function useResend(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getFromAddress(): string {
  if (useResend()) {
    // If EMAIL_FROM is explicitly set, use it as-is.
    // Otherwise default to the bare verified address (no display name wrapper)
    // so Resend accepts single-address verification.
    return process.env.EMAIL_FROM || `reply@${process.env.EMAIL_DOMAIN || "spacexrocket.space"}`;
  }
  return `SpaceX Investor Platform <${process.env.SMTP_USER}>`;
}

// ─── Resend transport (HTTPS) ─────────────────────────────────────────────────

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY!;
  const attachments = (options.attachments ?? []).map((a) => ({
    filename: a.filename,
    content: a.content.toString("base64"),
    content_id: a.cid,
  }));

  const body: Record<string, unknown> = {
    from: getFromAddress(),
    to: [options.to],
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
    ...(attachments.length ? { attachments } : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API error ${res.status}: ${detail}`);
  }
}

// ─── SMTP transport ───────────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ─── Startup verification ─────────────────────────────────────────────────────

export async function verifySmtpConnection(): Promise<void> {
  if (useResend()) {
    const msg = "Resend API key detected — using HTTPS email transport.";
    logger.info({}, msg);
    smtpStatus = { status: "ok", message: msg, checkedAt: new Date().toISOString() };
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    const msg = "No email transport configured — set RESEND_API_KEY (recommended) or SMTP_USER + SMTP_PASS.";
    logger.error({ SMTP_USER: !!smtpUser, SMTP_PASS: !!smtpPass }, msg);
    smtpStatus = { status: "misconfigured", message: msg, checkedAt: new Date().toISOString() };
    return;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
  try {
    const transporter = createTransporter();
    await transporter.verify();
    const msg = `SMTP connection verified (${smtpHost}:${process.env.SMTP_PORT || "465"}, user: ${smtpUser})`;
    logger.info({ smtpHost, smtpUser }, msg);
    smtpStatus = { status: "ok", message: msg, checkedAt: new Date().toISOString() };
  } catch (err) {
    const msg = `SMTP connection failed — consider switching to RESEND_API_KEY (${smtpHost}, user: ${smtpUser})`;
    logger.error({ err, smtpHost, smtpUser }, msg);
    smtpStatus = { status: "error", message: msg, checkedAt: new Date().toISOString() };
  }
}

// ─── Shared attachment ────────────────────────────────────────────────────────

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  cid?: string;
};

const LOGO_URL = `${process.env.PLATFORM_URL || "https://www.spacexrocket.space"}/logo.png`;

// ─── Main send function ───────────────────────────────────────────────────────

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}) {
  if (!useResend() && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    const msg = "No email transport configured — set RESEND_API_KEY or SMTP_USER + SMTP_PASS";
    logger.error({ to: options.to, subject: options.subject }, msg);
    throw new Error(msg);
  }
  try {
    // For Resend use hosted logo URL (no CID). For SMTP include CID inline attachment.
    const extraAttachments = options.attachments ?? [];
    if (useResend()) {
      await sendViaResend({ ...options, attachments: extraAttachments });
    } else {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        // Logo is rendered inline in the HTML via LOGO_URL (a hosted image),
        // not attached as a file — recipients no longer see a logo.png attachment.
        attachments: extraAttachments,
      });
    }
    logger.info({ to: options.to, subject: options.subject, transport: useResend() ? "resend" : "smtp" }, "Email sent");
  } catch (err) {
    // Re-throw so calling routes can return a proper error response to the client
    // instead of silently accepting the request while email was never sent.
    logger.error({ err, to: options.to, subject: options.subject }, "Failed to send email");
    throw err;
  }
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function layout(content: string, footerNote = "") {
  const support = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.SMTP_USER || "reply@spacexrocket.space";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SpaceX Investor Platform</title>
<style>
  body { margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif; }
  @media only screen and (max-width:620px) {
    .outer-td { padding:12px 4px !important; }
    .card { border-radius:0 !important; }
    .content-td { padding:20px 16px 16px !important; }
    .footer-td { padding:12px 16px !important; }
    .header-td { padding:12px 16px !important; }
  }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
  <tr>
    <td align="center" class="outer-td" style="padding:24px 12px;">
      <table cellpadding="0" cellspacing="0" border="0" class="card" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #dde1e7;">
        <tr>
          <td class="header-td" style="background-color:#0a0a0a;padding:14px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" width="120" height="31" alt="SpaceX" style="display:block;border:0;width:120px;max-width:120px;height:auto;" />
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;white-space:nowrap;">Investor Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="content-td" style="padding:24px 28px 20px;word-break:break-word;overflow-wrap:break-word;">
            ${content}
          </td>
        </tr>
        <tr>
          <td class="footer-td" style="background-color:#f8f9fa;border-top:1px solid #e8eaed;padding:12px 28px;">
            <p style="margin:0;font-size:10px;color:#9aa0a6;line-height:1.6;word-break:break-word;">
              This email was sent by SpaceX Investor Platform &bull; <a href="mailto:${support}" style="color:#5f6368;text-decoration:none;">${support}</a><br />
              ${footerNote ? footerNote + "<br />" : ""}
              If you did not request this, please ignore or contact us at the address above.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── PDF Generation ───────────────────────────────────────────────────────────
async function generatePaymentPDF(data: {
  fullName: string;
  requestedShares: number;
  amountUsd: number;
  btcAddress: string;
  btcAmount: string;
  supportEmail: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.04, 0.04, 0.04);
  const white = rgb(1, 1, 1);
  const muted = rgb(0.45, 0.45, 0.45);
  const light = rgb(0.95, 0.95, 0.95);
  const border = rgb(0.83, 0.83, 0.83);
  const amberBg = rgb(1, 0.98, 0.88);
  const amberBorder = rgb(0.93, 0.78, 0.2);
  const amberText = rgb(0.5, 0.34, 0.0);

  const M = 48;
  const W = 612 - M * 2;
  const now = new Date();
  const orderDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const ref = `SPX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ── Embed logo and QR code
  const logoBytes = Buffer.from(logoBase64, "base64");
  const logoImage = await pdfDoc.embedPng(logoBytes);
  // Logo is 625×159 px — scale to 120pt wide
  const logoW = 120;
  const logoH = Math.round(logoW * (159 / 625));

  const qrBuffer = await QRCode.toBuffer(data.btcAddress, {
    type: "png",
    width: 180,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 90;

  // ── Header bar (height 56pt)
  page.drawRectangle({ x: 0, y: 736, width: 612, height: 56, color: black });
  // Logo centred vertically in header: y=736+(56-logoH)/2
  const logoY = 736 + Math.round((56 - logoH) / 2);
  page.drawImage(logoImage, { x: M, y: logoY, width: logoW, height: logoH });
  const rightLabel = "PAYMENT INSTRUCTIONS";
  page.drawText(rightLabel, {
    x: 612 - M - regular.widthOfTextAtSize(rightLabel, 8),
    y: 759, size: 8, font: regular, color: rgb(0.55, 0.55, 0.55),
  });

  // ── Title
  page.drawText("Share Purchase Order", { x: M, y: 712, size: 20, font: bold, color: black });
  page.drawText(`Reference: ${ref}`, { x: M, y: 690, size: 8.5, font: regular, color: muted });
  page.drawText(`Date: ${orderDate}`, { x: M + 200, y: 690, size: 8.5, font: regular, color: muted });
  page.drawText(`Prepared for: ${data.fullName}`, { x: M, y: 678, size: 8.5, font: regular, color: muted });

  // ── Divider
  page.drawRectangle({ x: M, y: 665, width: W, height: 0.75, color: border });

  // ── ORDER SUMMARY
  page.drawText("ORDER SUMMARY", { x: M, y: 651, size: 7.5, font: bold, color: muted });

  page.drawText("Shares Ordered", { x: M, y: 634, size: 10, font: regular, color: black });
  const sharesVal = `${data.requestedShares.toLocaleString()} shares`;
  page.drawText(sharesVal, { x: M + W - bold.widthOfTextAtSize(sharesVal, 10), y: 634, size: 10, font: bold, color: black });

  page.drawText("Investment Amount", { x: M, y: 617, size: 10, font: regular, color: black });
  const usdVal = `$${data.amountUsd.toLocaleString()} USD`;
  page.drawText(usdVal, { x: M + W - bold.widthOfTextAtSize(usdVal, 11), y: 616, size: 11, font: bold, color: black });

  // ── Divider
  page.drawRectangle({ x: M, y: 603, width: W, height: 0.75, color: border });

  // ── BITCOIN PAYMENT DETAILS
  // Layout: left column (address + BTC amount) | right column (QR code)
  const qrX = M + W - qrSize;            // QR left edge
  const leftW = W - qrSize - 14;         // left column width

  page.drawText("BITCOIN PAYMENT DETAILS", { x: M, y: 589, size: 7.5, font: bold, color: muted });
  page.drawText("Send your payment to the following Bitcoin address:", { x: M, y: 573, size: 9.5, font: regular, color: black });

  // Address box (left column only)
  page.drawRectangle({ x: M, y: 549, width: leftW, height: 18, color: light, borderColor: border, borderWidth: 0.75 });
  page.drawText(data.btcAddress, { x: M + 6, y: 555, size: 8, font: bold, color: black });

  page.drawText("Amount to Send (BTC)", { x: M, y: 533, size: 8.5, font: regular, color: muted });
  const btcVal = `${data.btcAmount} BTC`;
  page.drawText(btcVal, { x: M, y: 513, size: 19, font: bold, color: black });
  page.drawText(`≈ $${data.amountUsd.toLocaleString()} USD at current exchange rate`, {
    x: M, y: 498, size: 8.5, font: regular, color: muted,
  });

  // QR code (right column) — aligned with top of address box (y=567 top → bottom=567-qrSize)
  const qrY = 567 - qrSize;   // bottom of QR image
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  const scanLabel = "Scan to pay";
  page.drawText(scanLabel, {
    x: qrX + Math.round((qrSize - regular.widthOfTextAtSize(scanLabel, 7.5)) / 2),
    y: qrY - 11, size: 7.5, font: regular, color: muted,
  });

  // ── Divider (below both columns)
  page.drawRectangle({ x: M, y: 482, width: W, height: 0.75, color: border });

  // ── HOW TO PAY
  page.drawText("HOW TO COMPLETE YOUR PAYMENT", { x: M, y: 468, size: 7.5, font: bold, color: muted });

  const steps: string[] = [
    "Open your Bitcoin wallet (e.g. Coinbase, Binance, Trust Wallet, or any BTC-compatible wallet).",
    `Send exactly ${data.btcAmount} BTC to the Bitcoin address shown above.`,
    "Take a screenshot or photo of your payment confirmation / transaction receipt.",
    `Email the receipt image to: ${data.supportEmail}  —  include your full name in the subject line.`,
  ];

  let sy = 450;
  for (let i = 0; i < steps.length; i++) {
    page.drawEllipse({ x: M + 8, y: sy + 3, xScale: 8, yScale: 8, color: black });
    page.drawText(`${i + 1}`, { x: M + 5.5, y: sy - 0.5, size: 8, font: bold, color: white });
    page.drawText(steps[i], {
      x: M + 24, y: sy + 1, size: 9, font: regular, color: black,
      maxWidth: W - 28, lineHeight: 13,
    });
    sy -= (i === 2 ? 32 : 26);
  }

  // ── Divider
  const divY = sy - 6;
  page.drawRectangle({ x: M, y: divY, width: W, height: 0.75, color: border });

  // ── Important notice box
  const boxTop = divY - 12;
  const boxH = 52;
  page.drawRectangle({ x: M, y: boxTop - boxH, width: W, height: boxH, color: amberBg, borderColor: amberBorder, borderWidth: 0.75 });
  page.drawText("IMPORTANT", { x: M + 10, y: boxTop - 16, size: 7.5, font: bold, color: amberText });
  page.drawText("• Payment window is valid for 24 hours from the time of order.", { x: M + 10, y: boxTop - 29, size: 8.5, font: regular, color: amberText });
  page.drawText("• Shares are allocated after 3 Bitcoin network confirmations (typically within 1 hour).", { x: M + 10, y: boxTop - 42, size: 8.5, font: regular, color: amberText });

  // ── Receipt reminder
  const remY = boxTop - boxH - 16;
  page.drawRectangle({ x: M, y: remY - 28, width: W, height: 26, color: rgb(0.94, 0.97, 1), borderColor: rgb(0.75, 0.85, 0.95), borderWidth: 0.75 });
  page.drawText("After sending payment, email your receipt screenshot to:", { x: M + 10, y: remY - 14, size: 8.5, font: regular, color: rgb(0.1, 0.2, 0.5) });
  page.drawText(data.supportEmail, { x: M + 10, y: remY - 25, size: 8.5, font: bold, color: rgb(0.1, 0.2, 0.5) });

  // ── Footer
  page.drawRectangle({ x: M, y: 44, width: W, height: 0.5, color: border });
  page.drawText("SpaceX Investor Platform  \u2022  This document is confidential and intended for the named recipient only.", {
    x: M, y: 30, size: 7.5, font: regular, color: muted,
  });
  page.drawText(`${data.supportEmail}  \u2022  spacexrocket.space`, {
    x: M, y: 19, size: 7.5, font: regular, color: muted,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// ─── Email Functions ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, fullName: string) {
  const firstName = fullName.split(" ")[0];
  await sendEmail({
    to,
    subject: "Your SpaceX Investor Account is Ready",
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Welcome</p>
      <h1 style="margin:0 0 14px;font-size:19px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 14px;font-size:13px;color:#374151;line-height:1.7;">
        Your SpaceX investor account has been created. You now have access to SpaceX (SPCX) equity — now publicly traded on Nasdaq since June 12, 2026, available to verified accredited investors through our platform.
      </p>
      <p style="margin:0 0 22px;font-size:13px;color:#374151;line-height:1.7;">
        To get started, complete your accredited investor verification and select your investment amount from your dashboard.
      </p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${process.env.PLATFORM_URL || "https://spacexrocket.space"}/dashboard" style="display:inline-block;padding:10px 22px;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;">Access Your Dashboard</a>
          </td>
        </tr>
      </table>
    `, "You received this email because an account was created with your email address."),
    text: `Hi ${firstName}, your SpaceX investor account has been created. Visit ${process.env.PLATFORM_URL || "https://spacexrocket.space"}/dashboard to get started.`,
  });
}

export async function sendPurchaseNotificationToAdmin(data: {
  userFullName: string;
  userEmail: string;
  userPhone?: string | null;
  amountUsd: number;
  requestedShares: number;
  pricePerShare: number;
  extra?: {
    dateOfBirth?: string;
    nationality?: string;
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
    sourceOfFunds?: string;
    investmentPurpose?: string;
    annualIncomeRange?: string;
    netWorthRange?: string;
    paymentMethod?: string;
    discountApplied?: string;
  };
}) {
  const e = data.extra ?? {};
  function row(label: string, value: string | null | undefined) {
    if (!value) return "";
    return `<tr>
      <td style="padding:5px 0;font-size:11px;color:#6b7280;width:150px;vertical-align:top;">${label}</td>
      <td style="padding:5px 0;font-size:11px;color:#1a1a1a;font-weight:600;">${value}</td>
    </tr>`;
  }
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Purchase Request — ${data.userFullName} — $${data.amountUsd.toLocaleString()} (${data.requestedShares} shares)`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Admin Alert</p>
      <h1 style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1a1a1a;">New Purchase Request</h1>
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#9aa0a6;text-transform:uppercase;">Investment</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        ${row("Amount", `${data.amountUsd.toLocaleString()}`)}
        ${row("Shares", data.requestedShares.toLocaleString())}
        ${row("Price/Share", `${data.pricePerShare.toLocaleString()}`)}
        ${row("Bulk Discount", e.discountApplied)}
        ${row("Payment Method", e.paymentMethod)}
        ${row("Source of Funds", e.sourceOfFunds)}
      </table>
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#9aa0a6;text-transform:uppercase;">Investor</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row("Full Name", data.userFullName)}
        ${row("Email", data.userEmail)}
        ${row("Phone", data.userPhone)}
        ${row("Date of Birth", e.dateOfBirth)}
        ${row("Nationality", e.nationality)}
        ${row("Annual Income", e.annualIncomeRange)}
        ${row("Net Worth", e.netWorthRange)}
        ${row("Street", e.streetAddress)}
        ${row("City", e.city)}
        ${row("State/Province", e.stateProvince)}
        ${row("Postal Code", e.postalCode)}
        ${row("Country", e.country)}
      </table>
    `),
    text: `New Purchase\n\n${data.userFullName} (${data.userEmail})\n$${data.amountUsd.toLocaleString()} — ${data.requestedShares} shares`,
  });
}

export async function sendOnboardingNotificationToAdmin(data: {
  userFullName: string;
  userEmail: string;
  userPhone?: string | null;
  isAccredited: boolean;
  dateOfBirth?: string;
  nationality?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  sourceOfFunds?: string;
  investmentPurpose?: string;
  annualIncomeRange?: string;
  netWorthRange?: string;
}) {
  function row(label: string, value: string | null | undefined) {
    if (!value) return "";
    return `<tr>
      <td style="padding:5px 0;font-size:11px;color:#6b7280;width:150px;">${label}</td>
      <td style="padding:5px 0;font-size:11px;color:#1a1a1a;font-weight:600;">${value}</td>
    </tr>`;
  }
  const statusColor = data.isAccredited ? "#16a34a" : "#dc2626";
  const statusText = data.isAccredited ? "Accredited Investor" : "Not Accredited";
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `KYC Application — ${data.userFullName} — ${statusText}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Admin Alert</p>
      <h1 style="margin:0 0 14px;font-size:18px;font-weight:700;color:#1a1a1a;">New KYC Application</h1>
      <p style="margin:0 0 18px;display:inline-block;padding:5px 12px;font-size:11px;font-weight:700;color:${statusColor};background:${data.isAccredited ? "#f0fdf4" : "#fef2f2"};border:1px solid ${data.isAccredited ? "#bbf7d0" : "#fecaca"};border-radius:4px;">${statusText}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row("Full Name", data.userFullName)}
        ${row("Email", data.userEmail)}
        ${row("Phone", data.userPhone)}
        ${row("Date of Birth", data.dateOfBirth)}
        ${row("Nationality", data.nationality)}
        ${row("Annual Income", data.annualIncomeRange)}
        ${row("Net Worth", data.netWorthRange)}
        ${row("Source of Funds", data.sourceOfFunds)}
        ${row("Investment Purpose", data.investmentPurpose)}
        ${row("Street", data.streetAddress)}
        ${row("City", data.city)}
        ${row("State/Province", data.stateProvince)}
        ${row("Postal Code", data.postalCode)}
        ${row("Country", data.country)}
      </table>
    `),
    text: `KYC: ${data.userFullName} (${data.userEmail}) — ${statusText}`,
  });
}

export async function sendPriceAlertEmail(to: string, fullName: string, targetPrice: number, actualPrice: number, direction: boolean) {
  const dirText = direction ? "reached your target" : "dropped below your target";
  const firstName = fullName.split(" ")[0];
  await sendEmail({
    to,
    subject: `SpaceX Share Price Alert — $${actualPrice.toLocaleString()} ${dirText}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Price Alert</p>
      <h1 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a1a;">Price Alert Triggered</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;">Hi ${firstName}, the SpaceX share price has ${dirText}.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td width="48%" style="padding:14px;background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;text-align:center;">
            <p style="margin:0 0 3px;font-size:9px;color:#9aa0a6;text-transform:uppercase;letter-spacing:2px;">Current Price</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">$${actualPrice.toLocaleString()}</p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="padding:14px;background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;text-align:center;">
            <p style="margin:0 0 3px;font-size:9px;color:#9aa0a6;text-transform:uppercase;letter-spacing:2px;">Your Target</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:${direction ? "#16a34a" : "#dc2626"};">$${targetPrice.toLocaleString()}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:11px;color:#6b7280;">This alert has been removed. Log in to your dashboard to set a new alert.</p>
    `, "You received this because you set a price alert on SpaceX Investor Platform."),
    text: `Price Alert: SpaceX $${actualPrice.toLocaleString()} has ${dirText} of $${targetPrice.toLocaleString()}.`,
  });
}

export async function sendTransferRequestNotificationToAdmin(data: {
  userFullName: string;
  userEmail: string;
  requestId: string;
  mode: "brokerage" | "internal";
  brokerageName?: string;
  brokerageAccountNumber?: string;
  accountHolderName?: string;
  emailAddress?: string | null;
  amountToTransfer?: number | null;
  asset?: string | null;
  transferSubType?: "full" | "partial" | null;
  notes?: string | null;
  recipientEmail?: string | null;
}) {
  function row(label: string, value: string | null | undefined) {
    if (!value) return "";
    return `<tr><td style="padding:5px 0;font-size:11px;color:#6b7280;width:160px;vertical-align:top;">${label}</td><td style="font-size:11px;font-weight:600;color:#1a1a1a;">${value}</td></tr>`;
  }
  const isBrokerage = data.mode === "brokerage";
  const subject = isBrokerage
    ? `Transfer Request — ${data.userFullName} → ${data.brokerageName} [${data.requestId}]`
    : `Internal Transfer Request — ${data.userFullName} → ${data.recipientEmail} [${data.requestId}]`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Admin Alert</p>
      <h1 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#1a1a1a;">${isBrokerage ? "Brokerage Transfer Request" : "Internal Transfer Request"}</h1>
      <p style="margin:0 0 16px;font-size:11px;color:#6b7280;">Request ID: <strong style="color:#1a1a1a;">${data.requestId}</strong> &bull; Status: <strong style="color:#1a1a1a;">Pending Review</strong></p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row("Investor", data.userFullName)}
        ${row("Email", data.userEmail)}
        ${isBrokerage ? row("Brokerage", data.brokerageName) : ""}
        ${isBrokerage ? row("Account Number", data.brokerageAccountNumber) : ""}
        ${isBrokerage ? row("Account Holder", data.accountHolderName) : ""}
        ${isBrokerage ? row("Contact Email", data.emailAddress) : ""}
        ${!isBrokerage ? row("Recipient Email", data.recipientEmail) : ""}
        ${row("Asset", data.asset ?? "SPCX")}
        ${data.amountToTransfer ? row("Amount", data.amountToTransfer.toLocaleString()) : ""}
        ${row("Transfer Type", data.transferSubType === "full" ? "Full Transfer" : data.transferSubType === "partial" ? "Partial Transfer" : "")}
        ${row("Notes", data.notes)}
      </table>
    `),
    text: `Transfer Request [${data.requestId}]\n${data.userFullName} (${data.userEmail})\n${isBrokerage ? `Brokerage: ${data.brokerageName}\nAccount: ${data.brokerageAccountNumber}` : `Recipient: ${data.recipientEmail}`}`,
  });
}

export async function sendTransferVerificationCode(to: string, fullName: string, code: string) {
  const firstName = fullName.split(" ")[0];
  await sendEmail({
    to,
    subject: `SpaceX Transfer Verification Code: ${code}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Identity Verification</p>
      <h1 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 22px;font-size:13px;color:#374151;line-height:1.6;">
        You are about to submit a transfer request. Enter the code below to verify your identity. This code expires in <strong>10 minutes</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
        <tr>
          <td style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;padding:18px 36px;text-align:center;">
            <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'Courier New',monospace;">${code}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:10px;color:#9aa0a6;text-align:center;">Do not share this code. If you did not request a transfer, please ignore this email or contact support.</p>
    `, "You received this because a transfer was initiated on SpaceX Investor Platform."),
    text: `Your SpaceX transfer verification code: ${code}\n\nExpires in 10 minutes. Do not share.`,
  });
}

export async function sendTransferConfirmationToUser(data: {
  to: string;
  fullName: string;
  requestId: string;
  mode: "brokerage" | "internal";
  brokerageName?: string;
  asset?: string | null;
  amountToTransfer?: number | null;
  transferSubType?: "full" | "partial" | null;
  recipientEmail?: string | null;
}) {
  const firstName = data.fullName.split(" ")[0];
  const isBrokerage = data.mode === "brokerage";
  const transferTypeLabel = data.transferSubType === "full" ? "Full Transfer" : data.transferSubType === "partial" ? "Partial Transfer" : "Transfer";
  await sendEmail({
    to: data.to,
    subject: `Transfer Request Received — ${data.requestId}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Transfer Request</p>
      <h1 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1a1a1a;">Hi ${firstName}, your transfer request has been received.</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        Your transfer request has been received and is <strong>pending review</strong>. Once verified, our transfer team will begin processing your request.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #e8eaed;border-radius:4px;">
        <tr>
          <td style="padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e8eaed;">
            <span style="font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Request Summary</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Request ID</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.requestId}</td></tr>
              <tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Type</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${isBrokerage ? "Brokerage Transfer" : "Internal Transfer"}</td></tr>
              ${isBrokerage ? `<tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Destination</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.brokerageName ?? ""}</td></tr>` : ""}
              ${!isBrokerage ? `<tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Recipient</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.recipientEmail ?? ""}</td></tr>` : ""}
              <tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Asset</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.asset ?? "SPCX"}</td></tr>
              <tr><td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Transfer Type</td><td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${transferTypeLabel}</td></tr>
              <tr><td style="font-size:12px;color:#6b7280;">Status</td><td align="right" style="font-size:12px;font-weight:700;color:#d97706;">Pending Review</td></tr>
            </table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #fed7aa;border-radius:4px;background:#fff7ed;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9a3412;">What happens next?</p>
            <p style="margin:0;font-size:11px;color:#c2410c;line-height:1.6;">
              Our transfer team will review your request and may contact you if additional documentation is required. This is a manual process and typically takes 2–5 business days.
            </p>
          </td>
        </tr>
      </table>
    `, "This email confirms your transfer request on SpaceX Investor Platform."),
    text: `Hi ${firstName},\n\nYour transfer request has been received and is pending review.\n\nRequest ID: ${data.requestId}\nType: ${isBrokerage ? "Brokerage Transfer" : "Internal Transfer"}\n${isBrokerage ? `Destination: ${data.brokerageName}` : `Recipient: ${data.recipientEmail}`}\n\nOnce verified, our transfer team will begin processing your request.`,
  });
}

export async function sendInvestApplicationCode(to: string, fullName: string, code: string) {
  const firstName = fullName.split(" ")[0];
  await sendEmail({
    to,
    subject: `Your SpaceX Investor Verification Code: ${code}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Verification</p>
      <h1 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 22px;font-size:13px;color:#374151;line-height:1.6;">Enter the code below to complete your SpaceX investor registration. This code expires in 15 minutes.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
        <tr>
          <td style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;padding:18px 36px;text-align:center;">
            <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'Courier New',monospace;">${code}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:10px;color:#9aa0a6;text-align:center;">Do not share this code. If you did not request this, ignore this email.</p>
    `, "You received this because someone used your email to register on SpaceX Investor Platform."),
    text: `Your SpaceX verification code: ${code}\n\nExpires in 15 minutes. Do not share.`,
  });
}

export async function sendSignInCode(to: string, code: string) {
  await sendEmail({
    to,
    subject: `Your SpaceX Sign-In Code: ${code}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Sign In</p>
      <h1 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a1a;">Welcome back.</h1>
      <p style="margin:0 0 22px;font-size:13px;color:#374151;line-height:1.6;">Use the code below to access your SpaceX investor account. This code expires in 5 minutes.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
        <tr>
          <td style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;padding:18px 36px;text-align:center;">
            <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'Courier New',monospace;">${code}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:10px;color:#9aa0a6;text-align:center;">Do not share this code. If you did not request this, ignore this email.</p>
    `, "You received this because a sign-in was attempted on SpaceX Investor Platform."),
    text: `Your SpaceX sign-in code: ${code}\n\nExpires in 5 minutes.`,
  });
}

export async function sendPasswordResetCode(to: string, code: string) {
  await sendEmail({
    to,
    subject: `Your SpaceX Password Reset Code: ${code}`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Password Reset</p>
      <h1 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a1a;">Reset your password</h1>
      <p style="margin:0 0 22px;font-size:13px;color:#374151;line-height:1.6;">Enter the code below to reset your account password. This code expires in 10 minutes.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
        <tr>
          <td style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:4px;padding:18px 36px;text-align:center;">
            <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'Courier New',monospace;">${code}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:10px;color:#9aa0a6;text-align:center;">If you did not request a password reset, you can safely ignore this email.</p>
    `, "You received this because a password reset was requested on SpaceX Investor Platform."),
    text: `Your SpaceX password reset code: ${code}\n\nExpires in 10 minutes.`,
  });
}

export async function sendPaymentInstructionsEmail(data: {
  to: string;
  fullName: string;
  requestedShares: number;
  amountUsd: number;
  btcAddress: string;
  btcAmount: string;
}) {
  const firstName = data.fullName.split(" ")[0];
  const support = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.SMTP_USER || "reply@spacexrocket.space";

  // Generate QR code as inline base64 data URI — works with Resend and SMTP alike
  let qrDataUri = "";
  try {
    const qrBuffer = await QRCode.toBuffer(data.btcAddress, {
      type: "png",
      width: 220,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    qrDataUri = `data:image/png;base64,${qrBuffer.toString("base64")}`;
  } catch (err) {
    logger.error({ err }, "Failed to generate QR code for payment email");
  }

  await sendEmail({
    to: data.to,
    subject: `SpaceX Investment — Payment Instructions (${data.requestedShares.toLocaleString()} shares)`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Order Confirmation</p>
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#1a1a1a;">Hi ${firstName}, we have received your order.</h1>

      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        Your request for <strong>${data.requestedShares.toLocaleString()} SpaceX shares (SPCX)</strong> ($${data.amountUsd.toLocaleString()} USD) is now pending payment. Please follow the instructions below to complete your purchase.
      </p>

      <!-- Order summary -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #e8eaed;border-radius:4px;">
        <tr>
          <td style="padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e8eaed;">
            <span style="font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Order Summary</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Shares Ordered</td>
                <td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.requestedShares.toLocaleString()} shares</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;">Investment Amount</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#1a1a1a;">$${data.amountUsd.toLocaleString()} USD</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bitcoin payment section -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #d4d4d4;border-radius:4px;background:#fafafa;">
        <tr>
          <td style="padding:14px 16px 10px;border-bottom:1px solid #e5e5e5;background:#f5f5f5;border-radius:4px 4px 0 0;">
            <span style="font-size:10px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px;">Bitcoin Payment Details</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 16px;" align="center">
            <p style="margin:0 0 12px;font-size:12px;color:#6b7280;text-align:center;">Scan the QR code below with your Bitcoin wallet to send payment</p>
            ${qrDataUri ? `<img src="${qrDataUri}" width="180" height="180" alt="Bitcoin QR Code" style="display:block;margin:0 auto 14px;border:4px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.12);border-radius:4px;" />` : ""}
            <p style="margin:0 0 6px;font-size:10px;color:#9aa0a6;text-transform:uppercase;letter-spacing:1px;text-align:center;">Bitcoin Address</p>
            <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#1a1a1a;font-family:'Courier New',Courier,monospace;word-break:break-all;background:#ffffff;border:1px solid #e5e5e5;border-radius:3px;padding:8px 10px;text-align:center;">${data.btcAddress}</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="48%" style="padding:10px 12px;background:#ffffff;border:1px solid #e5e5e5;border-radius:3px;text-align:center;">
                  <p style="margin:0 0 3px;font-size:9px;color:#9aa0a6;text-transform:uppercase;letter-spacing:1px;">Amount to Send</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a1a;">${data.btcAmount} BTC</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="padding:10px 12px;background:#ffffff;border:1px solid #e5e5e5;border-radius:3px;text-align:center;">
                  <p style="margin:0 0 3px;font-size:9px;color:#9aa0a6;text-transform:uppercase;letter-spacing:1px;">USD Equivalent</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a1a;">$${data.amountUsd.toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- How to pay steps -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding-bottom:12px;">
            <span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">How to Complete Payment</span>
          </td>
        </tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#374151;line-height:1.6;"><span style="display:inline-block;width:20px;height:20px;background:#1a1a1a;color:#fff;font-weight:700;font-size:10px;text-align:center;line-height:20px;border-radius:50%;margin-right:8px;vertical-align:middle;">1</span>Open your Bitcoin wallet (Coinbase, Binance, Trust Wallet, etc.)</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#374151;line-height:1.6;"><span style="display:inline-block;width:20px;height:20px;background:#1a1a1a;color:#fff;font-weight:700;font-size:10px;text-align:center;line-height:20px;border-radius:50%;margin-right:8px;vertical-align:middle;">2</span>Scan the QR code above or paste the Bitcoin address manually.</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#374151;line-height:1.6;"><span style="display:inline-block;width:20px;height:20px;background:#1a1a1a;color:#fff;font-weight:700;font-size:10px;text-align:center;line-height:20px;border-radius:50%;margin-right:8px;vertical-align:middle;">3</span>Send exactly <strong>${data.btcAmount} BTC</strong> to the address shown above.</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#374151;line-height:1.6;"><span style="display:inline-block;width:20px;height:20px;background:#1a1a1a;color:#fff;font-weight:700;font-size:10px;text-align:center;line-height:20px;border-radius:50%;margin-right:8px;vertical-align:middle;">4</span>Screenshot your payment confirmation and email it to <strong>${support}</strong> with your full name in the subject line.</td></tr>
      </table>

      <!-- Warning notice -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #fcd34d;border-radius:4px;background:#fffbeb;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;">Important Notice</p>
            <p style="margin:0;font-size:11px;color:#92400e;line-height:1.6;">Payment window is valid for <strong>24 hours</strong> from the time of order. Shares are allocated after 3 Bitcoin network confirmations.</p>
          </td>
        </tr>
      </table>

      <!-- Receipt reminder -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #d1fae5;border-radius:4px;background:#f0fdf4;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#065f46;">After sending payment</p>
            <p style="margin:0;font-size:11px;color:#047857;line-height:1.6;">
              Email your receipt screenshot to <strong>${support}</strong> with your full name in the subject line so we can confirm your payment quickly.
            </p>
          </td>
        </tr>
      </table>
    `, `Questions? Reply to this email or contact us at ${support}`),
    text: `Hi ${firstName},\n\nWe have received your order for ${data.requestedShares.toLocaleString()} SpaceX shares ($${data.amountUsd.toLocaleString()} USD).\n\nBitcoin Address: ${data.btcAddress}\nAmount to send: ${data.btcAmount} BTC\n\nAfter sending, email your receipt to: ${support}\n\n${support}`,
  });
}

export async function sendSharesCreditedEmail(data: {
  to: string;
  fullName: string;
  requestedShares: number;
  pricePerShare: number;
  amountUsd: number;
  platformUrl: string;
}) {
  const firstName = data.fullName.split(" ")[0];
  const support = process.env.SMTP_USER || "reply@spacexrocket.space";

  await sendEmail({
    to: data.to,
    subject: `SpaceX Share Allocation Confirmed — ${data.requestedShares.toLocaleString()} Shares Credited`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Allocation Confirmed</p>
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#1a1a1a;">Congratulations, ${firstName}.</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        Your payment has been confirmed and your shares have been credited to your account. You are now a confirmed shareholder in SpaceX through the SpaceX Private Allocation SPV.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #bbf7d0;border-radius:4px;">
        <tr>
          <td style="padding:10px 16px;background:#f0fdf4;border-bottom:1px solid #bbf7d0;">
            <span style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Payment Confirmed</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Shares Credited</td>
                <td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.requestedShares.toLocaleString()} shares</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Price per Share</td>
                <td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">$${data.pricePerShare.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;">Total Investment</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#1a1a1a;">$${data.amountUsd.toLocaleString()}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#1a1a1a;border-radius:4px;">
            <a href="${data.platformUrl}/dashboard" style="display:inline-block;padding:10px 22px;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;">View Your Dashboard</a>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #e8eaed;border-radius:4px;">
        <tr>
          <td style="padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e8eaed;">
            <span style="font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">What Happens Next</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:4px 0;font-size:11px;color:#374151;border-bottom:1px solid #f0f0f0;"><strong>Late May 2026</strong> — SEC S-1 Filing</td></tr>
              <tr><td style="padding:4px 0;font-size:11px;color:#374151;border-bottom:1px solid #f0f0f0;"><strong>Early June 2026</strong> — IPO Roadshow Begins</td></tr>
              <tr><td style="padding:4px 0;font-size:11px;color:#374151;border-bottom:1px solid #f0f0f0;"><strong>June 2026</strong> — IPO Date. Shares convert to public stock.</td></tr>
              <tr><td style="padding:4px 0;font-size:11px;color:#374151;"><strong>Post-IPO</strong> — Transfer instructions will be available in your dashboard.</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, `Questions? Contact us at ${support}`),
    text: `Hi ${firstName},\n\nYour SpaceX share allocation has been confirmed.\n\nShares: ${data.requestedShares.toLocaleString()}\nPrice per Share: $${data.pricePerShare.toLocaleString()}\nTotal: $${data.amountUsd.toLocaleString()}\n\nDashboard: ${data.platformUrl}/dashboard\n\n${support}`,
  });
}

export async function sendPurchaseRejectedEmail(data: {
  to: string;
  fullName: string;
  requestedShares: number;
  amountUsd: number;
  platformUrl: string;
}) {
  const firstName = data.fullName.split(" ")[0];
  const support = process.env.SMTP_USER || "reply@spacexrocket.space";

  await sendEmail({
    to: data.to,
    subject: `Update on Your SpaceX Share Purchase Request`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Purchase Update</p>
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        We were unable to confirm your request for <strong>${data.requestedShares.toLocaleString()} SPCX shares</strong> ($${data.amountUsd.toLocaleString()} USD). This can happen if payment wasn't received or verification could not be completed. Please contact us if you believe this is a mistake or would like to submit a new request.
      </p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#1a1a1a;border-radius:4px;">
            <a href="${data.platformUrl}/history" style="display:inline-block;padding:10px 22px;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;">View Transaction History</a>
          </td>
        </tr>
      </table>
    `, `Questions? Contact us at ${support}`),
    text: `Hi ${firstName},\n\nWe were unable to confirm your request for ${data.requestedShares.toLocaleString()} SPCX shares ($${data.amountUsd.toLocaleString()} USD). Please contact us if you have questions.\n\n${data.platformUrl}/history\n\n${support}`,
  });
}

export async function sendTransferStatusUpdateEmail(data: {
  to: string;
  fullName: string;
  requestId: string;
  status: string;
  platformUrl: string;
}) {
  const firstName = data.fullName.split(" ")[0];
  const support = process.env.SMTP_USER || "reply@spacexrocket.space";
  const statusLabels: Record<string, string> = {
    under_review: "Under Review",
    awaiting_documents: "Awaiting Documents",
    approved: "Approved",
    processing: "Processing",
    rejected: "Not Approved",
  };
  const label = statusLabels[data.status] ?? data.status;

  await sendEmail({
    to: data.to,
    subject: `Transfer Update — ${label} (${data.requestId})`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Transfer Update</p>
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        Your transfer request <strong>${data.requestId}</strong> status has been updated to <strong>${label}</strong>.
        ${data.status === "rejected" ? " If you believe this is a mistake or need more information, please contact support." : " We'll keep you updated as it progresses."}
      </p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#1a1a1a;border-radius:4px;">
            <a href="${data.platformUrl}/history?tab=transfers" style="display:inline-block;padding:10px 22px;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;">View Transfer Status</a>
          </td>
        </tr>
      </table>
    `, `Questions? Contact us at ${support}`),
    text: `Hi ${firstName},\n\nYour transfer request ${data.requestId} status has been updated to ${label}.\n\n${data.platformUrl}/history?tab=transfers\n\n${support}`,
  });
}

export async function sendInternalTransferCompletedEmail(data: {
  to: string;
  fullName: string;
  role: "sender" | "recipient";
  counterpartyEmail: string;
  shares: number;
  requestId: string;
  platformUrl: string;
}) {
  const firstName = data.fullName.split(" ")[0];
  const support = process.env.SMTP_USER || "reply@spacexrocket.space";
  const isSender = data.role === "sender";

  await sendEmail({
    to: data.to,
    subject: isSender
      ? `Transfer Completed — ${data.shares.toLocaleString()} SPCX Sent`
      : `You've Received ${data.shares.toLocaleString()} SPCX Shares`,
    html: layout(`
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9aa0a6;text-transform:uppercase;">Transfer Completed</p>
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#1a1a1a;">Hi ${firstName},</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7;">
        ${isSender
          ? `Your transfer of <strong>${data.shares.toLocaleString()} SPCX shares</strong> to <strong>${data.counterpartyEmail}</strong> has been completed and your holdings have been updated.`
          : `<strong>${data.counterpartyEmail}</strong> has transferred <strong>${data.shares.toLocaleString()} SPCX shares</strong> to your account. Your holdings have been updated.`}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid #e8eaed;border-radius:4px;">
        <tr>
          <td style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Reference</td>
                <td align="right" style="font-size:12px;font-weight:700;color:#1a1a1a;padding-bottom:6px;">${data.requestId}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;">Shares</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#1a1a1a;">${data.shares.toLocaleString()} SPCX</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#1a1a1a;border-radius:4px;">
            <a href="${data.platformUrl}/history?tab=transfers" style="display:inline-block;padding:10px 22px;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;">View Transaction History</a>
          </td>
        </tr>
      </table>
    `, `Questions? Contact us at ${support}`),
    text: `Hi ${firstName},\n\n${isSender ? `Your transfer of ${data.shares.toLocaleString()} SPCX shares to ${data.counterpartyEmail} has been completed.` : `${data.counterpartyEmail} has transferred ${data.shares.toLocaleString()} SPCX shares to your account.`}\n\nReference: ${data.requestId}\n\n${data.platformUrl}/history?tab=transfers\n\n${support}`,
  });
}

export async function sendBroadcastEmail(to: string[], subject: string, body: string) {
  const support = process.env.SMTP_USER || "reply@spacexrocket.space";
  const results = await Promise.allSettled(
    to.map((email) =>
      sendEmail({
        to: email,
        subject,
        html: layout(`
          <h1 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1a1a1a;">${subject}</h1>
          <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</div>
        `, `Questions? Contact us at ${support}`),
        text: `${subject}\n\n${body}`,
      })
    )
  );
  return results.filter((r) => r.status === "fulfilled").length;
}
