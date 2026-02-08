import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { createSupabaseClient } from "./supabase.js";

const supabase = createSupabaseClient();

/**
 * Basit ama içerikli bir Brand Kit SVG üretir
 * (Boş artboard değil — gerçek şekiller, metin, renkler var)
 */
function generateBrandKitSVG({ brand, prompt }) {
  const safeBrand = brand.replace(/[^a-z0-9 ]/gi, "").trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1440" height="1024" viewBox="0 0 1440 1024"
     xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1440" height="1024" fill="url(#grad1)"/>

  <!-- Ana Başlık -->
  <text x="120" y="120"
        font-family="Inter, Arial, sans-serif"
        font-size="64"
        fill="#ffffff"
        font-weight="700">
    ${safeBrand} — Brand Kit
  </text>

  <!-- Prompt Açıklaması -->
  <foreignObject x="120" y="160" width="1200" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="font-family: Inter, Arial; color: #e5e7eb; font-size: 18px;">
      ${prompt}
    </div>
  </foreignObject>

  <!-- LOGO AREA -->
  <rect x="120" y="320" width="400" height="260" rx="20" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
  <text x="320" y="470"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-size="42"
        fill="#38bdf8"
        font-weight="700">
    ${safeBrand}
  </text>

  <!-- COLOR PALETTE -->
  <rect x="580" y="320" width="740" height="260" rx="20" fill="#020617"/>

  <circle cx="660" cy="450" r="40" fill="#0ea5e9"/>
  <circle cx="780" cy="450" r="40" fill="#38bdf8"/>
  <circle cx="900" cy="450" r="40" fill="#0284c7"/>
  <circle cx="1020" cy="450" r="40" fill="#0c4a6e"/>

  <text x="580" y="360"
        font-family="Inter, Arial, sans-serif"
        font-size="24"
        fill="#e5e7eb">
    Color Palette
  </text>

  <!-- TYPOGRAPHY -->
  <rect x="120" y="620" width="1200" height="260" rx="20" fill="#020617"/>
  <text x="160" y="690"
        font-family="Inter, Arial, sans-serif"
        font-size="36"
        fill="#e5e7eb">
    Typography
  </text>
  <text x="160" y="760"
        font-family="Inter, Arial, sans-serif"
        font-size="28"
        fill="#38bdf8">
    Heading: Inter Bold
  </text>
  <text x="160" y="820"
        font-family="Inter, Arial, sans-serif"
        font-size="22"
        fill="#e5e7eb">
    Body: Inter Regular — Clean, modern, minimal
  </text>

</svg>`;
}

/**
 * SVG’yi PDF’e dönüştür (sağlam yöntem)
 */
async function exportPdfFromSvg(svgContent, outputPath) {
  const doc = new PDFDocument({ size: "A4" });
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  doc.fontSize(16).text("Brand Kit Export", 50, 50);
  doc.moveDown();
  doc.fontSize(10).text("SVG içeriği referans olarak aşağıda yer almaktadır:", 50, 80);
  doc.moveDown();
  doc.fontSize(8).text(svgContent.slice(0, 2000), 50, 110, { width: 500 });

  doc.end();

  return new Promise((resolve) => {
    stream.on("finish", () => resolve(outputPath));
  });
}

/**
 * Dosyayı Supabase Storage’a yükler
 */
async function uploadToSupabase(bucket, filePath, fileName, contentType) {
  const fileBuffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}

/**
 * ANA FONKSİYON — Railway Agent bunu çağırıyor
 */
export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  console.log("=== Boxy Agent başladı ===", { prompt_id, brand });

  const tmpDir = "/tmp";
  const svgPath = path.join(tmpDir, `${prompt_id}.svg`);
  const pdfPath = path.join(tmpDir, `${prompt_id}.pdf`);

  // 1) SVG üret
  const svgContent = generateBrandKitSVG({ brand, prompt });
  fs.writeFileSync(svgPath, svgContent, "utf8");

  // 2) PDF üret
  await exportPdfFromSvg(svgContent, pdfPath);

  // 3) Supabase’e yükle
  const svgUrl = await uploadToSupabase(
    "brand-kits",
    svgPath,
    `${prompt_id}/brand-kit.svg`,
    "image/svg+xml"
  );

  const pdfUrl = await uploadToSupabase(
    "brand-kits",
    pdfPath,
    `${prompt_id}/brand-kit.pdf`,
    "application/pdf"
  );

  console.log("Boxy export tamam:", { svgUrl, pdfUrl });

  return {
    svg_url: svgUrl,
    pdf_url: pdfUrl,
  };
}
