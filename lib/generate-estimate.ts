import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

const COMPANY_NAME = 'Rolling Suds of Schaumburg – Rosemont';
const COMPANY_ADDRESS = '4629 Linscott Ave';
const COMPANY_EMAIL = 'gailan.robertson@rollingsuds.com';
const COMPANY_PHONE = '(630) 912-9662';

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'House Power Wash': `Our house cleaning service covers everything from the gutters down, excluding the roof, chimney (if it's stucco or brick), walkways, patios, and decks (which are available at additional prices). For a complete exterior refresh, we recommend having your windows cleaned after our service. Our expert cleaning service will carefully remove any mold, mildew, algae, and dirt from your surfaces using our powerful but safe cleaning solution. Once we're done, we'll rinse your surfaces with water, leaving them looking and feeling refreshed.`,
  'Exterior Window Cleaning': `We wash all exterior windows using our deionized water purification system. This process uses reverse osmosis and resin filtration to produce spot-free water, leaving glass crystal clear without the need for soaps or chemical cleaners. The system gently rinses away dirt, dust, and mineral buildup, delivering a streak-free finish while protecting window frames and landscaping.`,
  'Front Walkway': `For hardscaping with paver/flagstone/slate or mortar/sand between joints, we include the following disclaimer in our estimate: Some sand may come out from paver joints and almost all moss will be removed, but not 100%. If mortar between flagstone/slate joints is breaking up, it may continue to break up during cleaning. Flaking may occur on flagstone/slate that is already damaged.`,
  'Roof Wash': `We use cleaning solution to eliminate mold, mildew, and moss on the roof. We recommend having the windows cleaned after the roof cleaning. The cleaning process is gradual and may take up to 10 days to reach full effectiveness. We offer a free-of-charge second roof cleaning within 2 weeks of the first visit if needed. Please note that we do not clean roofs in the heat from June 1 to September 15 in this geographic area (may vary by location).`,
};

const TERMS_SECTIONS = [
  { heading: 'TERMS, CONDITIONS, DISCLAIMERS, AND EXPECTATIONS', body: 'This estimate is for services provided by GNWL Ventures, Inc. d/b/a Rolling Suds of Schaumburg - Rosemont (hereafter referred to as "The Company"), subject to the conditions noted below.\nBy accepting this estimate, the Client acknowledges and agrees to all terms, expectations, and disclaimers outlined below. The Company is not responsible for leaks caused by faulty seals on doors, windows, electrical outlets, or fixtures, nor for any pre-existing damage. Please disclose any known issues before work begins. We assume no liability for such conditions. The Company is fully insured.' },
  { heading: '1. BINDING AGREEMENT', body: 'Acceptance of this estimate constitutes a legally binding contract for services to be performed at the agreed-upon price. If the Client cancels or breaches this agreement, any deposits paid may be retained by The Company as damages.' },
  { heading: '2. CONSENT TO PHOTOGRAPHY', body: 'The Client agrees that The Company may take before-and-after photos of the project. These photos may be used for marketing purposes.' },
  { heading: '3. SATISFACTION GUARANTEE & WARRANTY', body: 'We guarantee the quality of our work. If you are not satisfied, you must notify us within 48 hours of service completion. We will arrange a touch-up or other resolution. Product warranties are limited to those offered by the product manufacturers; GNWL Ventures, Inc. offers no additional warranties.' },
  { heading: '4. WATER USAGE', body: 'By accepting this estimate, the Client agrees to provide access to an on-site water supply at no additional cost. If unavailable, a $100 water fee will apply. The Company is not responsible for water-related issues that arise during service.' },
  { heading: '5. CLIENT RESPONSIBILITY', body: 'The Client is responsible for keeping people, pets, vehicles, and personal items clear of the work area. Environmental factors (like wind) can cause overspray beyond the immediate work zone. The Company is not liable for overspray-related damage to surfaces, vehicles, RVs, boats, equipment, plants, or vegetation.' },
  { heading: '6. COMMERCIAL PROJECT RESPONSIBILITY', body: 'Property owners/managers must notify all tenants or occupants about work dates and arrange for safe pedestrian traffic flow during services.' },
  { heading: '7. PERSONAL ITEMS', body: 'The Client must remove all patio furniture, yard art, grills, and similar items prior to service. If The Company must move items, we are not responsible for loss, damage, or storage. A fee of up to $100 may apply if significant labor is required.' },
  { heading: '8. HOLD HARMLESS AND DISCLAIMERS', body: 'Power, pressure, and soft washing can expose existing damages (e.g., rot, improperly installed materials). Some stains or discolorations may remain or worsen. The Company is not liable for such pre-existing conditions, even if not identified before service. Clients must notify The Company of any specific concerns prior to service.' },
  { heading: '9. SOAPS AND CHEMICALS', body: 'We commonly use a Sodium Hypochlorite blend. Some paints (especially organic or dyed finishes) may react unpredictably. A small test area will be washed prior to full service, but it may not predict full project outcomes. The Company is not liable for adverse reactions.' },
  { heading: '10. PROPERTY CONDITIONS', body: 'The Client affirms that all structures (including doors, windows, light fixtures, and electrical systems) are properly maintained and watertight. The Company is not responsible for damages resulting from water infiltration due to pre-existing maintenance issues.' },
  { heading: '11. MULTIPLE TREATMENTS & LIMITATIONS', body: 'Some stains (e.g., rust, oil, oxidation) may require multiple treatments and may not fully disappear. If additional treatments are necessary, they will be billed separately unless otherwise stated. Some surfaces may take up to 10 days to show final results after treatment.' },
  { heading: '12. WEATHER POLICY', body: 'Service may be postponed due to weather conditions to protect safety and quality. Affected Clients will be prioritized for rescheduling.' },
  { heading: '13. PROTECTIVE MEASURES', body: "Painter's tape and coverings may be used to minimize water infiltration into sensitive areas (outlets, lights). The Company is not responsible for paint peeling or damage caused by tape removal." },
  { heading: '14. CANCELLATIONS AND RESCHEDULING', body: 'Residential Clients: Must provide at least 24 hours notice to avoid a $75 cancellation fee.\nCommercial Clients: Must provide at least 48 hours notice or be billed one day\'s work (if a rate is pre-agreed) or $1,795, whichever is greater. The Company may waive fees at its discretion.' },
  { heading: '15. PAYMENT TERMS', body: 'Residential Clients: Payment is due upon service completion unless otherwise specified. A 10% late fee will apply after 7 days, plus an additional 10% every 30 days until paid. Credit card payments incur a 3% processing fee.\nCommercial Clients: Payment is due within 60 days of invoice delivery. Late payments will incur a 10% late fee after 75 days, plus 10% every 30 days thereafter. Credit card payments incur a 3.5% processing fee. If collection efforts are necessary, the Client is responsible for all attorney\'s fees and collection costs.' },
  { heading: '16. DEPOSIT REQUIREMENTS', body: 'Residential Projects: Projects over $1,000 require a 30% deposit. Projects over $3,000 require a 50% deposit. Remaining balances are due upon completion unless otherwise stated.\nCommercial Projects: Projects over $10,000 require a 50% deposit. Projects over $50,000 or lasting more than two weeks require 50% deposit upfront, 25% at the halfway point, and 25% upon completion unless otherwise stated.' },
  { heading: '17. DAMAGE CLAIMS', body: 'Damage claims must be submitted within 48 hours of service completion. The Company reserves the right to inspect alleged damages, review documentation (including photos), and communicate with any repair professionals involved. The Company is not responsible for damages deemed pre-existing, unrelated to the service, or not properly documented before repairs.' },
];

export interface EstimateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  services: { name: string; price: number }[];
  baseTotal: number;
  total: number;
  savings: number;
  packageName?: string;
  notes?: string;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function hline(page: PDFPage, x1: number, y: number, x2: number, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: rgb(0.75, 0.75, 0.75) });
}

function needsNewPage(y: number, needed: number, pdfDoc: PDFDocument, pageWidth: number, pageHeight: number): [PDFPage, number] {
  if (y - needed < 60) {
    const p = pdfDoc.addPage([pageWidth, pageHeight]);
    return [p, pageHeight - 50];
  }
  return [null as any, y];
}

export async function generateEstimatePdf(data: EstimateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const W = 612, H = 792, M = 50;
  const contentW = W - M * 2;
  const estNum = `EST-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  let page = pdfDoc.addPage([W, H]);
  let y = H - M;

  // Try embedding logo
  let logoImg: any = null;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'));
    logoImg = await pdfDoc.embedPng(logoBytes);
  } catch { /* no logo */ }

  // --- HEADER ---
  if (logoImg) {
    const dims = logoImg.scale(0.13);
    page.drawImage(logoImg, { x: M, y: y - dims.height, width: dims.width, height: dims.height });
  }
  // "ESTIMATE" title top right
  const titleTxt = 'ESTIMATE';
  const titleSz = 26;
  page.drawText(titleTxt, { x: W - M - bold.widthOfTextAtSize(titleTxt, titleSz), y: y - 4, size: titleSz, font: bold, color: rgb(0.1, 0.1, 0.1) });

  y -= 58;

  // Company info left column
  const companyLines = [COMPANY_NAME, COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_PHONE];
  for (const ln of companyLines) {
    page.drawText(ln, { x: M, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    y -= 12;
  }

  // Estimate meta right column (aligned from top of company block)
  const metaY0 = H - M - 58;
  const labelX = 380, valX = W - M;
  const metaRows = [
    { label: 'Estimate #', val: estNum },
    { label: 'Date', val: dateStr },
    { label: 'Total', val: `$${data.total.toLocaleString()}.00` },
  ];
  let metaY = metaY0;
  for (const row of metaRows) {
    page.drawText(row.label, { x: labelX, y: metaY, size: 8.5, font: bold, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(row.val, { x: valX - font.widthOfTextAtSize(row.val, 8.5), y: metaY, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    metaY -= 12;
  }

  y -= 12;
  hline(page, M, y, W - M, 1);
  y -= 18;

  // --- PREPARED FOR / SERVICE LOCATION ---
  const half = contentW / 2 - 10;
  page.drawText('Prepared For:', { x: M, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Service Location:', { x: M + half + 20, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 13;

  const custLines = [`${data.firstName} ${data.lastName}`, data.address, data.phone, data.email].filter(Boolean);
  for (const ln of custLines) {
    page.drawText(ln, { x: M, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(ln, { x: M + half + 20, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    y -= 12;
  }

  y -= 14;

  // --- TABLE HEADER ---
  hline(page, M, y + 4, W - M, 1.5);
  y -= 2;
  page.drawText('Description', { x: M, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('QTY', { x: 400, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Price', { x: 448, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Amount', { x: 515, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 7;
  hline(page, M, y, W - M, 1.5);
  y -= 14;

  // --- SERVICE ROWS ---
  for (const svc of data.services) {
    const desc = SERVICE_DESCRIPTIONS[svc.name] || '';
    const descLines = desc ? wrapText(desc, font, 8, 330) : [];
    const rowH = 14 + descLines.length * 10.5 + 10;

    if (y - rowH < 80) {
      page = pdfDoc.addPage([W, H]);
      y = H - M;
    }

    page.drawText(svc.name, { x: M, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
    const priceStr = `$${svc.price.toFixed(2)}`;
    page.drawText('1', { x: 406, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(priceStr, { x: W - M - font.widthOfTextAtSize(priceStr, 8.5) - 52, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(priceStr, { x: W - M - font.widthOfTextAtSize(priceStr, 8.5), y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    y -= 12;

    for (const dl of descLines) {
      if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
      page.drawText(dl, { x: M, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) });
      y -= 10.5;
    }

    y -= 6;
    hline(page, M, y, W - M);
    y -= 12;
  }

  // --- DISCOUNT ROW ---
  if (data.savings > 0 && data.packageName) {
    if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
    const discLabel = `${data.packageName} Discount`;
    const discVal = `-$${data.savings.toFixed(2)}`;
    page.drawText(discLabel, { x: M, y, size: 8.5, font: bold, color: rgb(0.7, 0.45, 0.05) });
    page.drawText(discVal, { x: W - M - font.widthOfTextAtSize(discVal, 8.5), y, size: 8.5, font, color: rgb(0.7, 0.45, 0.05) });
    y -= 8;
    hline(page, M, y, W - M);
    y -= 12;
  }

  // --- SUBTOTAL / TOTAL ---
  for (const row of [{ label: 'Sub total', val: `$${data.total.toLocaleString()}.00` }, { label: 'Total', val: `$${data.total.toLocaleString()}.00` }]) {
    if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
    page.drawText(row.label, { x: 430, y, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(row.val, { x: W - M - font.widthOfTextAtSize(row.val, 8.5), y, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
  }

  // --- NOTES ---
  if (data.notes) {
    y -= 8;
    if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
    page.drawText('Notes:', { x: M, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
    y -= 12;
    for (const ln of wrapText(data.notes, font, 8.5, contentW)) {
      if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
      page.drawText(ln, { x: M, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
      y -= 12;
    }
  }

  // --- TERMS ---
  y -= 16;
  if (y < 160) { page = pdfDoc.addPage([W, H]); y = H - M; }
  hline(page, M, y, W - M, 1);
  y -= 16;

  for (const section of TERMS_SECTIONS) {
    if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
    // Heading
    for (const ln of wrapText(section.heading, bold, 8.5, contentW)) {
      if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
      page.drawText(ln, { x: M, y, size: 8.5, font: bold, color: rgb(0.15, 0.15, 0.15) });
      y -= 11;
    }
    // Body (split on \n for sub-bullets)
    for (const para of section.body.split('\n')) {
      for (const ln of wrapText(para, font, 8.5, contentW)) {
        if (y < 80) { page = pdfDoc.addPage([W, H]); y = H - M; }
        page.drawText(ln, { x: M, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
        y -= 11;
      }
    }
    y -= 5;
  }

  // --- FOOTER ---
  y -= 14;
  if (y < 60) { page = pdfDoc.addPage([W, H]); y = H - M; }
  hline(page, M, y, W - M, 1);
  y -= 20;
  const thanks = 'Thank you for your business';
  const thanksSz = 15;
  page.drawText(thanks, { x: (W - bold.widthOfTextAtSize(thanks, thanksSz)) / 2, y, size: thanksSz, font: bold, color: rgb(0.1, 0.1, 0.1) });

  return pdfDoc.save();
}
