import fs from "fs";
import path from "path";
import { createSupabaseClient, STORAGE_BUCKET } from "./supabase.js";

const supabase = createSupabaseClient();

// SVG içinde güvenli metin için escape fonksiyonu (ÇOK ÖNEMLİ)
function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildBrandKitSVG({ brand, prompt, theme }) {
  const bg =
    theme === "dark"
      ? "#0f0f0f"
      : theme === "light"
      ? "#ffffff"
      : "#ffffff";

  const textColor =
    theme === "dark"
      ? "#ffffff"
      : theme === "light"
      ? "#0f0f0f"
      : "#000000";

  const safeBrand = escapeXML(brand);
  const safePrompt = escapeXML(prompt);

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg 
  width="1440" 
  height="1024" 
  viewBox="0 0 1440 1024"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink">

  <rect x="0" y="0" width="1440" height="1024" fill="${bg}"/>

  <!-- LOGO FRAME -->
  <rect x="80" y="80" width="400" height="300" fill="none" stroke="${textColor}" stroke-width="2"/>
  <text x="100" y="140" fill="${textColor}" font-size="24" font-family="Arial, sans-serif">LOGO</text>
  <text x="100" y="180" fill="${textColor}" font-size="14" font-family="Arial, sans-serif">${safeBrand}</text>

  <!-- BRAND ELEMENTS -->
  <rect x="80" y="420" width="600" height="500" fill="none" stroke="${textColor}" stroke-width="2"/>
  <text x="100" y="460" fill="${textColor}" font-size="20" font-family="Arial, sans-serif">Brand Elements</text>

  <!-- BUSINESS CARD -->
  <rect x="700" y="80" width="600" height="350" fill="none" stroke="${textColor}" stroke-width="2"/>
  <text x="720" y="140" fill="${textColor}" font-size="20" font-family="Arial, sans-serif">Business Card</text>

  <!-- SOCIAL TEMPLATES -->
  <rect x="700" y="450" width="600" height="450" fill="none" stroke="${textColor}" stroke-width="2"/>
  <text x="720" y="490" fill="${textColor}" font-size="20" font-family="Arial, sans-serif">Social Templates</text>

  <text x="80" y="1000" fill="${textColor}" font-size="12" font-family="Arial, sans-serif">
    Generated for: ${safeBrand} | ${theme.toUpperCase()} | ${safePrompt}
  </text>
</svg>`;
}

async function uploadToSupabase(localPath, remotePath, contentType) {
  const file = fs.readFileSync(localPath);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(remotePath, file, {
      upsert: true,
      contentType,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${remotePath}`;
}

export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  console.log("=== Boxy Agent Başladı ===");

  const outDir = path.join("/tmp", prompt_id);
  fs.mkdirSync(outDir, { recursive: true });

  const variants = ["dark", "light", "mono"];
  const uploadedVariants = {};

  // --- VARYANTLAR ---
  for (const theme of variants) {
    const svg = buildBrandKitSVG({ brand, prompt, theme });
    const svgPath = path.join(outDir, `brand-kit-${theme}.svg`);
    fs.writeFileSync(svgPath, svg, "utf8");

    const remotePath = `${prompt_id}/brand-kit-${theme}.svg`;
    const publicUrl = await uploadToSupabase(
      svgPath,
      remotePath,
      "image/svg+xml"
    );

    uploadedVariants[theme] = publicUrl;
  }

  // --- ANA SVG (dark) ---
  const mainSvgPath = path.join(outDir, "brand-kit.svg");
  const mainSvg = buildBrandKitSVG({ brand, prompt, theme: "dark" });
  fs.writeFileSync(mainSvgPath, mainSvg, "utf8");

  const mainSvgUrl = await uploadToSupabase(
    mainSvgPath,
    `${prompt_id}/brand-kit.svg`,
    "image/svg+xml"
  );

  // --- PNG PLACEHOLDER ---
  const pngPath = path.join(outDir, "brand-kit.png");
  fs.writeFileSync(pngPath, "PNG_PLACEHOLDER");
  const pngUrl = await uploadToSupabase(
    pngPath,
    `${prompt_id}/brand-kit.png`,
    "image/png"
  );

  // --- PDF PLACEHOLDER ---
  const pdfPath = path.join(outDir, "brand-kit.pdf");
  fs.writeFileSync(pdfPath, "PDF_PLACEHOLDER");
  const pdfUrl = await uploadToSupabase(
    pdfPath,
    `${prompt_id}/brand-kit.pdf`,
    "application/pdf"
  );

  return {
    message: "Boxy brand kit generated",
    assets: {
      svg: mainSvgUrl,
      png: pngUrl,
      pdf: pdfUrl,
      variants: uploadedVariants,
    },
  };
}
