import fs from "fs";
import path from "path";
import sharp from "sharp";
import fetch from "node-fetch";
import { createSupabaseClient } from "./supabase.js";

const BUCKET = "brand-kits";

export async function runBoxyAgent({
  prompt_id,
  user_id,
  brand,
  prompt,
  plan_type,
}) {
  console.log("=== BOXY AGENT BAŞLADI ===");

  const supabase = createSupabaseClient();

  // 1) Gerçek bir logo SVG üret
  const svg = generateLogoSVG({ brand, prompt });

  const tmpDir = "/tmp";
  const svgPath = path.join(tmpDir, `${prompt_id}.svg`);
  const pngPath = path.join(tmpDir, `${prompt_id}.png`);
  const pdfPath = path.join(tmpDir, `${prompt_id}.pdf`);

  fs.writeFileSync(svgPath, svg, "utf8");

  // 2) SVG → PNG
  await sharp(Buffer.from(svg))
    .png()
    .toFile(pngPath);

  // 3) SVG → PDF (basit vektör export)
  await sharp(Buffer.from(svg))
    .pdf()
    .toFile(pdfPath);

  // 4) Supabase Storage’a yükle
  const upload = async (filePath, contentType) => {
    const file = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(`${prompt_id}/${path.basename(filePath)}`, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${data.path}`;
  };

  const svg_url = await upload(svgPath, "image/svg+xml");
  const png_url = await upload(pngPath, "image/png");
  const pdf_url = await upload(pdfPath, "application/pdf");

  console.log("✅ Brand kit üretildi!");

  return { svg_url, png_url, pdf_url };
}

/**
 * 🔹 GERÇEK LOGO ÜRETEN SVG
 */
function generateLogoSVG({ brand, prompt }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A3FF"/>
      <stop offset="100%" stop-color="#0056FF"/>
    </linearGradient>
  </defs>

  <!-- Logo Mark -->
  <g transform="translate(200,200)">
    <circle cx="0" cy="0" r="80" fill="url(#grad1)" opacity="0.9"/>
    <circle cx="60" cy="0" r="80" fill="none" stroke="#00A3FF" stroke-width="6"/>
  </g>

  <!-- Wordmark -->
  <text x="400" y="230"
        font-family="Inter, Arial, sans-serif"
        font-size="64"
        font-weight="700"
        fill="#0A0F1A">
    ${brand}
  </text>

  <!-- Tagline -->
  <text x="400" y="280"
        font-family="Inter, Arial, sans-serif"
        font-size="18"
        fill="#555">
    ${prompt}
  </text>

</svg>`;
}
