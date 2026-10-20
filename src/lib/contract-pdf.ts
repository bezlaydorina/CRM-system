import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";
import { formatHUF } from "@/lib/enums";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const MAROON = rgb(0.29, 0.06, 0.16); // #4a102a
const TEXT = rgb(0.19, 0.15, 0.16); // #30252a
const MUTED = rgb(0.45, 0.45, 0.45);

function wrapText(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type ContractPdfParams = {
  accountName: string;
  templateName: string;
  amount: number;
  contractId: string;
};

/**
 * Egyszerű, de valós szolgáltatási szerződés PDF generálása. A DejaVu Sans
 * fontot ágyazzuk be (Latin + Latin Extended-A alkészletre szűkítve), mert a
 * beépített PDF-alapfontok (Helvetica stb.) nem tartalmazzák a magyar ő/ű
 * karaktereket. A dokumentum végén
 * Dropbox Sign "text tag"-eket helyezünk el ([sig|req|signer1] stb.), amik
 * alapján a Dropbox Sign API automatikusan odahelyezi az aláírás mezőt.
 */
export async function generateContractPdf({ accountName, templateName, amount, contractId }: ContractPdfParams): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontsDir = path.join(process.cwd(), "src", "lib", "fonts");
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(fontsDir, "DejaVuSans-Regular.ttf")),
    readFile(path.join(fontsDir, "DejaVuSans-Bold.ttf")),
  ]);
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(boldBytes);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("The Code", { x: MARGIN, y, size: 11, font: bold, color: MAROON });
  y -= 28;
  page.drawText(templateName, { x: MARGIN, y, size: 20, font: bold, color: MAROON });
  y -= 36;

  const today = new Date().toLocaleDateString("hu-HU");
  const intro = `Jelen szolgáltatási szerződés létrejött a The Code Zrt. (a továbbiakban: Szolgáltató) és ${accountName} (a továbbiakban: Megrendelő) között ${today} napján, az alábbi feltételekkel.`;
  for (const line of wrapText(intro, font, 11, contentWidth)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: TEXT });
    y -= 16;
  }
  y -= 12;

  page.drawText("1. A szerződés tárgya", { x: MARGIN, y, size: 12, font: bold, color: MAROON });
  y -= 18;
  const subject = `A Szolgáltató vállalja a Megrendelő számára "${templateName}" keretében meghatározott digitális szolgáltatások nyújtását, a felek között egyeztetett ütemezés és terjedelem szerint.`;
  for (const line of wrapText(subject, font, 11, contentWidth)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: TEXT });
    y -= 16;
  }
  y -= 12;

  page.drawText("2. Díjazás", { x: MARGIN, y, size: 12, font: bold, color: MAROON });
  y -= 18;
  const payment = `A szolgáltatás ellenértéke ${formatHUF(amount)}, a Szolgáltató által kiállított számla alapján, a számlán feltüntetett fizetési határidőig.`;
  for (const line of wrapText(payment, font, 11, contentWidth)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: TEXT });
    y -= 16;
  }
  y -= 12;

  page.drawText("3. Hatályba lépés", { x: MARGIN, y, size: 12, font: bold, color: MAROON });
  y -= 18;
  const effect = "Jelen szerződés mindkét fél általi aláírásával lép hatályba, és a felek szóbeli megállapodásait teljeskörűen felváltja.";
  for (const line of wrapText(effect, font, 11, contentWidth)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: TEXT });
    y -= 16;
  }

  y -= 50;
  page.drawText("Megrendelő aláírása:", { x: MARGIN, y, size: 10, font, color: MUTED });
  y -= 22;
  page.drawText("[sig|req|signer1]", { x: MARGIN, y, size: 8, font, color: rgb(1, 1, 1) });
  y -= 26;
  page.drawText("Dátum:", { x: MARGIN, y, size: 10, font, color: MUTED });
  y -= 22;
  page.drawText("[date|req|signer1]", { x: MARGIN, y, size: 8, font, color: rgb(1, 1, 1) });

  page.drawText(`Szerződés-azonosító: ${contractId}`, { x: MARGIN, y: MARGIN / 2, size: 8, font, color: MUTED });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
