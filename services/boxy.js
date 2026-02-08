import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Yardımcı Fonksiyonlar ---

function generateLogoSVG({ brand, prompt }) {
  // Basit ama GERÇEK bir logo üretimi (vektörel + tipografik)

  const primaryColor = "#0EA5E9"; // mavi
  const secondaryColor = "#020617"; // koyu lacivert

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="500" viewBox="0 0 500 500"
     xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
  </defs>

  <!-- Daire temelli modern logo -->
  <circle cx="250" cy="250" r="120" fill="url(#grad1)"/>

  <!-- İç negatif alan şekli (minimal sembol) -->
  <path d="M 200 200 L 300 250 L 200 300 Z"
        fill="white" opacity="0.9"/>

  <!-- Marka adı -->
  <text x="250" y="400"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-size="42"
        fill="${secondaryColor}"
        font-weight="700">
    ${brand}
  </text>

</svg>`;
}

export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  console.log("🚀 Boxy Logo Generator Başladı:", { prompt_id, brand, prompt });

  // 1) Logo SVG üret
  const svgContent = generateLogoSVG({ brand, prompt });

  const fileName = `brand-kit-${prompt_id}.svg`;
  const filePath = path.join("/tmp", fileName);

  fs.writeFileSync(filePath, svgContent);

  // 2) Supabase Storage’a yükle
  const { data, error } = await supabase.storage
    .from("brand-kits")
    .upload(`${prompt_id}/${fileName}`, svgContent, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) {
    throw new Error("SVG upload failed: " + JSON.stringify(error));
  }

  const publicUrl = supabase.storage
    .from("brand-kits")
    .getPublicUrl(`${prompt_id}/${fileName}`).data.publicUrl;

  console.log("✅ Logo oluşturuldu:", publicUrl);

  // 3) prompts tablosunu güncelle
  await supabase
    .from("prompts")
    .update({
      status: "completed",
      response: JSON.stringify({
        logo_svg_url: publicUrl
      })
    })
    .eq("id", prompt_id);

  return { logo_svg_url: publicUrl };
}
