import { Router, type IRouter, type Request, type Response } from "express";
import { User, Purchase } from "../lib/models";
import { requireEnabledUser } from "../middlewares/requireAuth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const router: IRouter = Router();

router.get("/certificate", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const confirmedPurchases = await Purchase.find({ userId: user._id, status: "confirmed" });

  const totalShares = confirmedPurchases.reduce((sum, p) => sum + p.requestedShares, 0);

  if (totalShares === 0) {
    res.status(403).json({ error: "No confirmed shares — certificate not available" });
    return;
  }

  const avgPrice =
    confirmedPurchases.reduce((sum, p) => sum + p.pricePerShare * p.requestedShares, 0) / totalShares;

  const certNumber = `SX-${user._id.toString().slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const issueDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0, 0, 0) });
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: rgb(1, 1, 1), borderWidth: 0.5, color: rgb(0, 0, 0) });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: rgb(1, 1, 1), borderWidth: 0.15, color: rgb(0, 0, 0) });

  const cm = 14;
  const cx = [28, width - 28];
  const cy = [28, height - 28];
  for (const x of cx) {
    for (const y of cy) {
      const dx = x === 28 ? 1 : -1;
      const dy = y === 28 ? 1 : -1;
      page.drawLine({ start: { x, y: y + cm * dy }, end: { x, y }, color: rgb(1, 1, 1), thickness: 1.5 });
      page.drawLine({ start: { x, y }, end: { x: x + cm * dx, y }, color: rgb(1, 1, 1), thickness: 1.5 });
    }
  }

  page.drawText("SPACEX", {
    x: width / 2 - helveticaBold.widthOfTextAtSize("SPACEX", 32) / 2,
    y: height - 88,
    size: 32,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawLine({ start: { x: 48, y: height - 100 }, end: { x: width - 48, y: height - 100 }, color: rgb(1, 1, 1), thickness: 0.4 });

  const titleLabel = "SHARE CERTIFICATE";
  page.drawText(titleLabel, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(titleLabel, 13) / 2,
    y: height - 124,
    size: 13,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  const subLabel = "PRE-IPO PRIVATE PLACEMENT";
  page.drawText(subLabel, {
    x: width / 2 - helvetica.widthOfTextAtSize(subLabel, 8) / 2,
    y: height - 142,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawLine({ start: { x: 48, y: height - 158 }, end: { x: width - 48, y: height - 158 }, color: rgb(0.18, 0.18, 0.18), thickness: 0.5 });

  const certLabel = `CERTIFICATE NO.  ${certNumber}`;
  page.drawText(certLabel, {
    x: width / 2 - courier.widthOfTextAtSize(certLabel, 9) / 2,
    y: height - 175,
    size: 9,
    font: courier,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawLine({ start: { x: 48, y: height - 188 }, end: { x: width - 48, y: height - 188 }, color: rgb(0.18, 0.18, 0.18), thickness: 0.5 });

  const bodyY = height - 240;
  page.drawText("THIS IS TO CERTIFY THAT", {
    x: width / 2 - helvetica.widthOfTextAtSize("THIS IS TO CERTIFY THAT", 9) / 2,
    y: bodyY,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const nameText = user.fullName.toUpperCase();
  page.drawText(nameText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(nameText, 22) / 2,
    y: bodyY - 32,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  const nameWidth = helveticaBold.widthOfTextAtSize(nameText, 22);
  const nameX = width / 2 - nameWidth / 2;
  page.drawLine({ start: { x: nameX, y: bodyY - 38 }, end: { x: nameX + nameWidth, y: bodyY - 38 }, color: rgb(0.4, 0.4, 0.4), thickness: 0.5 });

  page.drawText("IS THE REGISTERED HOLDER OF", {
    x: width / 2 - helvetica.widthOfTextAtSize("IS THE REGISTERED HOLDER OF", 9) / 2,
    y: bodyY - 58,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const sharesText = totalShares.toLocaleString("en-US");
  page.drawText(sharesText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(sharesText, 48) / 2,
    y: bodyY - 112,
    size: 48,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("SHARES OF COMMON STOCK", {
    x: width / 2 - helveticaBold.widthOfTextAtSize("SHARES OF COMMON STOCK", 9) / 2,
    y: bodyY - 128,
    size: 9,
    font: helveticaBold,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText("SPACE EXPLORATION TECHNOLOGIES CORP.", {
    x: width / 2 - helveticaBold.widthOfTextAtSize("SPACE EXPLORATION TECHNOLOGIES CORP.", 10) / 2,
    y: bodyY - 148,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  const statsY = bodyY - 208;
  page.drawLine({ start: { x: 48, y: statsY + 24 }, end: { x: width - 48, y: statsY + 24 }, color: rgb(0.18, 0.18, 0.18), thickness: 0.5 });
  page.drawLine({ start: { x: 48, y: statsY - 36 }, end: { x: width - 48, y: statsY - 36 }, color: rgb(0.18, 0.18, 0.18), thickness: 0.5 });

  const stats = [
    { label: "SHARES", value: totalShares.toLocaleString("en-US") },
    { label: "AVG PRICE / SHARE", value: `$${avgPrice.toFixed(2)}` },
    { label: "TOTAL VALUE", value: `$${(totalShares * avgPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];
  const colW = (width - 96) / 3;
  for (let i = 0; i < stats.length; i++) {
    const cx2 = 48 + colW * i + colW / 2;
    page.drawText(stats[i].label, {
      x: cx2 - helvetica.widthOfTextAtSize(stats[i].label, 7) / 2,
      y: statsY + 8,
      size: 7,
      font: helvetica,
      color: rgb(0.45, 0.45, 0.45),
    });
    page.drawText(stats[i].value, {
      x: cx2 - helveticaBold.widthOfTextAtSize(stats[i].value, 14) / 2,
      y: statsY - 16,
      size: 14,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
  }

  for (let i = 1; i < 3; i++) {
    const x = 48 + colW * i;
    page.drawLine({ start: { x, y: statsY + 24 }, end: { x, y: statsY - 36 }, color: rgb(0.18, 0.18, 0.18), thickness: 0.5 });
  }

  const noteY = statsY - 72;
  const note = "These shares are held in trust pending the SpaceX Initial Public Offering. Transfer and resale are subject to applicable securities laws and the terms of the private placement agreement.";
  const noteWords = note.split(" ");
  const noteSize = 7.5;
  const maxLineW = width - 120;
  let lineStr = "";
  const noteLines: string[] = [];
  for (const w of noteWords) {
    const test = lineStr ? `${lineStr} ${w}` : w;
    if (helvetica.widthOfTextAtSize(test, noteSize) > maxLineW) {
      noteLines.push(lineStr);
      lineStr = w;
    } else {
      lineStr = test;
    }
  }
  if (lineStr) noteLines.push(lineStr);

  for (let i = 0; i < noteLines.length; i++) {
    page.drawText(noteLines[i], {
      x: width / 2 - helvetica.widthOfTextAtSize(noteLines[i], noteSize) / 2,
      y: noteY - i * 12,
      size: noteSize,
      font: helvetica,
      color: rgb(0.38, 0.38, 0.38),
    });
  }

  const sigY = 110;
  page.drawLine({ start: { x: 72, y: sigY }, end: { x: 220, y: sigY }, color: rgb(0.35, 0.35, 0.35), thickness: 0.5 });
  page.drawText("AUTHORISED SIGNATORY", { x: 72, y: sigY - 14, size: 6.5, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("SPACE EXPLORATION TECHNOLOGIES CORP.", { x: 72, y: sigY - 26, size: 6, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

  const rightSigX = width - 220;
  page.drawLine({ start: { x: rightSigX, y: sigY }, end: { x: width - 72, y: sigY }, color: rgb(0.35, 0.35, 0.35), thickness: 0.5 });
  page.drawText("DATE OF ISSUE", { x: rightSigX, y: sigY - 14, size: 6.5, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(issueDate.toUpperCase(), { x: rightSigX, y: sigY - 26, size: 7, font: courier, color: rgb(0.6, 0.6, 0.6) });

  page.drawText("[ SEAL ]", {
    x: width / 2 - helvetica.widthOfTextAtSize("[ SEAL ]", 8) / 2,
    y: sigY - 4,
    size: 8,
    font: helvetica,
    color: rgb(0.22, 0.22, 0.22),
  });

  page.drawLine({ start: { x: 48, y: 68 }, end: { x: width - 48, y: 68 }, color: rgb(0.15, 0.15, 0.15), thickness: 0.5 });
  const footerText = `${certNumber}  ·  PRIVATE & CONFIDENTIAL  ·  THIS CERTIFICATE IS NOT TRANSFERABLE`;
  page.drawText(footerText, {
    x: width / 2 - courier.widthOfTextAtSize(footerText, 6.5) / 2,
    y: 54,
    size: 6.5,
    font: courier,
    color: rgb(0.3, 0.3, 0.3),
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="SpaceX-Certificate-${certNumber}.pdf"`);
  res.setHeader("Content-Length", pdfBytes.length);
  res.end(Buffer.from(pdfBytes));
});

export default router;
