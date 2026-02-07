import fs from "fs";
import path from "path";

export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  console.log("=== Boxy Agent Başladı ===");

  // Çıktı klasörü
  const outDir = path.join("/tmp", prompt_id);
  fs.mkdirSync(outDir, { recursive: true });

  // --- 1) ANA BRAND KIT SVG (basit ama düzenli) ---
  const brandKitSVG = `
<svg width="1440" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1440" height="1024" fill="#0f0f0f"/>

  <!-- LOGO FRAME -->
  <rect x="80" y="80" width="400" height="300" fill="#111" stroke="#444"/>
  <text x="100" y="140" fill="#fff" font-size="24">LOGO</text>
  <text x="100" y="180" fill="#aaa" font-size="14">${brand}</text>

  <!-- BRAND ELEMENTS -->
  <rect x="80" y="420" width="600" height="500" fill="#111" stroke="#444"/>
  <text x="100" y="460" fill="#fff" font-size="20">Brand Elements</text>

  <!-- BUSINESS CARD -->
  <rect x="700" y="80" width="600" height="350" fill="#111" stroke="#444"/>
  <text x="720" y="140" fill="#fff" font-size="20">Business Card</text>

  <!-- SOCIAL TEMPLATES -->
  <rect x="700" y="450" width="600" height="450" fill="#111" stroke="#444"/>
  <text x="720" y="490" fill="#fff" font-size="20">Social Templates</text>

  <text x="80" y="1000" fill="#666" font-size="12">
    Generated for: ${brand} | Prompt: ${prompt}
  </text>
</svg>
`;

  const svgPath = path.join(outDir, "brand-kit.svg");
  fs.writeFileSync(svgPath, brandKitSVG);

  // --- 2) PNG Export (simülasyon) ---
  const pngPath = path.join(outDir, "brand-kit.png");
  fs.writeFileSync(pngPath, "PNG_PLACEHOLDER");

  return {
    message: "Boxy brand kit generated",
    files: {
      svg: `file://${svgPath}`,
      png: `file://${pngPath}`
    }
  };
}
