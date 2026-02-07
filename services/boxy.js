import fs from "fs";
import path from "path";
import { createSupabaseClient, STORAGE_BUCKET } from "./supabase.js";

const supabase = createSupabaseClient();

function buildBrandKitSVG({ brand, prompt, theme }) {
  const bg = theme === "dark" ? "#0f0f0f" :
             theme === "light" ? "#ffffff" : "#ffffff";

  const textColor = theme === "dark" ? "#ffffff" :
                    theme === "light" ? "#0f0f0f" : "#000000";

  return `
<svg width="1440" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1440" height="1024" fill="${bg}"/>

  <!-- LOGO FRAME -->
  <rect x="80" y="80" width="400" height="300" fill="none" stroke="${textColor}"/>
  <text x="100" y="140" fill="${textColor}" font-size="24">LOGO</text>
  <text x="100" y="180" fill="${textColor}" font-size="14">${brand}</text>

  <!-- BRAND ELEMENTS -->
  <rect x="80" y="420" width="600" height="500" fill="none" stroke="${textColor}"/>
  <text x="100" y="460" fill="${textColor}" font-size="20">Brand Elements</text>

  <!-- BUSINESS CARD -->
  <rect x="700" y="80" width="600" height="350" fill="none" stroke="${textColor}"/>
  <text x="720" y="140" fill="${textColor}" font-size="20">Business Card</text>

  <!-- SOCIAL TEMPLATES -->
  <rect x="700" y="450" width="600" height="450" fill="none" stroke="${textColor}"/>
  <text x="720" y="490" fill="${textColor}" font-size="20">Social Templates</text>

  <text x="80" y="1000" fill="${textColor}" font-size="12">
    Generated for: ${brand} | ${theme.toUpperCase()} | ${prompt}
  </text>
</svg>
`;
}

async function uploadToSupabase(localPath, remotePath) {
  const file = fs.readFileSync(localPath);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(remotePath, file, {
      upsert: true,
      contentType: "image/svg+xml",
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${remotePath}`;
}

export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  console.log("=== Boxy Agent Başladı ===");

  const outDir = path.join("/tmp", prompt_id);
  fs.mkdirSync(outDir, { recursive: true });

  const variants = ["dark", "light", "mono"];
  const uploaded = {};

  for (const theme of variants) {
    const svg = buildBrandKitSVG({ brand, prompt, theme });
    const svgPath = path.join(outDir, `brand-kit-${theme}.svg`);
    fs.writeFileSync(svgPath, svg);

    const remotePath = `${prompt_id}/brand-kit-${theme}.svg`;
    const publicUrl = await uploadToSupabase(svgPath, remotePath);

    uploaded[theme] = publicUrl;
  }

  // Ana default SVG (dark)
  const mainSvgPath = path.join(outDir, "brand-kit.svg");
  fs.writeFileSync(mainSvgPath, buildBrandKitSVG({ brand, prompt, theme: "dark" }));
  const mainSvgUrl = await uploadToSupabase(mainSvgPath, `${prompt_id}/brand-kit.svg`);

  // PNG & PDF placeholder upload (simülasyon)
  const pngPath = path.join(outDir, "brand-kit.png");
  fs.writeFileSync(pngPath, "PNG_PLACEHOLDER");
  const pngUrl = await uploadToSupabase(pngPath, `${prompt_id}/brand-kit.png`);

  const pdfPath = path.join(outDir, "brand-kit.pdf");
  fs.writeFileSync(pdfPath, "PDF_PLACEHOLDER");
  const pdfUrl = await uploadToSupabase(pdfPath, `${prompt_id}/brand-kit.pdf`);

  return {
    message: "Boxy brand kit generated",
    assets: {
      svg: mainSvgUrl,
      png: pngUrl,
      pdf: pdfUrl,
      variants: uploaded
    }
  };
}
