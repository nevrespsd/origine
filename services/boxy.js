import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createRequire } from "module";
import { createSupabaseClient, STORAGE_BUCKET } from "./supabase.js";

const supabase = createSupabaseClient();
const require = createRequire(import.meta.url);
const { svg2pdf } = require("svg2pdf.js");

function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Basit ama "gerçekçi" brand kit generator
 */
function buildBrandKitSVG({ brand, prompt, theme }) {
  const safeBrand = escapeXML(brand);
  const safePrompt = escapeXML(prompt);

  const palette = {
    dark: {
      bg: "#0B0F14",
      primary: "#6C7CFF",
      secondary: "#FF6CB5",
      text: "#FFFFFF",
      muted: "#9CA3AF",
      surface: "#111827"
    },
    light: {
      bg: "#FFFFFF",
      primary: "#4F46E5",
      secondary: "#EC4899",
      text: "#0F172A",
      muted: "#64748B",
      surface: "#F1F5F9"
    },
    mono: {
      bg: "#FFFFFF",
      primary: "#000000",
      secondary: "#444444",
      text: "#000000",
      muted: "#666666",
      surface: "#F2F2F2"
    }
  };

  const c = palette[theme];

  // -------- LOGO SİSTEMİ --------
  const logoSystem = `
  <g id="logo-system">
    <!-- Logo icon -->
    <circle cx="260" cy="210" r="55" fill="${c.primary}"/>
    <rect x="235" y="160" width="50" height="100" rx="6" fill="${c.secondary}" opacity="0.85"/>

    <!-- Wordmark -->
    <text x="200" y="340" fill="${c.text}" font-size="28" font-weight="700" font-family="Arial, sans-serif">
      ${safeBrand}
    </text>

    <!-- Tagline -->
    <text x="200" y="365" fill="${c.muted}" font-size="12" font-family="Arial, sans-serif">
      ${safePrompt.slice(0, 60)}
    </text>
  </g>
  `;

  // -------- RENK PALETİ --------
  const paletteCards = `
  <g id="palette">
    <rect x="120" y="480" width="140" height="120" rx="12" fill="${c.primary}"/>
    <text x="140" y="620" fill="${c.text}" font-size="12">Primary</text>

    <rect x="300" y="480" width="140" height="120" rx="12" fill="${c.secondary}"/>
    <text x="320" y="620" fill="${c.text}" font-size="12">Secondary</text>

    <rect x="480" y="480" width="140" height="120" rx="12" fill="${c.muted}"/>
    <text x="500" y="620" fill="${c.text}" font-size="12">Muted</text>
  </g>
  `;

  // -------- KARTVİZİT (GERÇEK LAYOUT) --------
  const businessCard = `
  <g id="business-card">
    <rect x="740" y="100" width="560" height="320" rx="20" fill="${c.surface}" stroke="${c.primary}" stroke-width="2"/>
    <circle cx="800" cy="180" r="40" fill="${c.primary}"/>
    <text x="860" y="180" fill="${c.text}" font-size="22" font-weight="600">${safeBrand}</text>
    <text x="860" y="210" fill="${c.muted}" font-size="12">Creative Studio</text>
    <line x1="800" y1="250" x2="1260" y2="250" stroke="${c.muted}" opacity="0.3"/>
    <text x="800" y="290" fill="${c.text}" font-size="12">connect@origine.art</text>
  </g>
  `;

  // -------- SOSYAL MEDYA ŞABLONU --------
  const socialTemplate = `
  <g id="social">
    <rect x="740" y="480" width="560" height="400" rx="24" fill="${c.surface}" stroke="${c.secondary}" stroke-width="2"/>
    <circle cx="1020" cy="640" r="60" fill="${c.primary}" opacity="0.9"/>
    <text x="820" y="720" fill="${c.text}" font-size="24" font-weight="600">Brand Story</text>
  </g>
  `;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1440" height="1024" viewBox="0 0 1440 1024"
     xmlns="http://www.w3.org/2000/svg">

  <rect x="0" y="0" width="1440" height="1024" fill="${c.bg}"/>

  <rect x="80" y="80" width="400" height="300" fill="none" stroke="${c.text}" stroke-width="1.5"/>
  ${logoSystem}

  <rect x="80" y="420" width="600" height="500" fill="none" stroke="${c.text}" stroke-width="1.5"/>
  ${paletteCards}

  ${businessCard}
  ${socialTemplate}

  <text x="80" y="1000" fill="${c.muted}" font-size="12">
    Generated for: ${safeBrand} | ${theme.toUpperCase()}
  </text>
</svg>`;
}

// ---------- EXPORT + UPLOAD ----------
async function uploadToSupabase(localPath, remotePath, contentType) {
  const file = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(remotePath, file, {
      upsert: true,
      contentType,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${remotePath}`;
}

async function svgToPng(svgPath, pngPath) {
  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer).png({ quality: 90 }).toFile(pngPath);
}

async function svgToPdf(svgPath, pdfPath) {
  const svg = fs.readFileSync(svgPath, "utf8");
  const pdfBuffer = svg2pdf(svg);
  fs.writeFileSync(pdfPath, pdfBuffer);
}

export async function runBoxyAgent({ prompt_id, brand, prompt }) {
  const outDir = path.join("/tmp", prompt_id);
  fs.mkdirSync(outDir, { recursive: true });

  const themes = ["dark", "light", "mono"];
  const variantLinks = {};

  for (const theme of themes) {
    const svg = buildBrandKitSVG({ brand, prompt, theme });
    const svgPath = path.join(outDir, `brand-kit-${theme}.svg`);
    fs.writeFileSync(svgPath, svg, "utf8");

    variantLinks[theme] = await uploadToSupabase(
      svgPath,
      `${prompt_id}/brand-kit-${theme}.svg`,
      "image/svg+xml"
    );
  }

  const mainSvgPath = path.join(outDir, "brand-kit.svg");
  const mainSvg = buildBrandKitSVG({ brand, prompt, theme: "dark" });
  fs.writeFileSync(mainSvgPath, mainSvg, "utf8");

  const mainSvgUrl = await uploadToSupabase(
    mainSvgPath,
    `${prompt_id}/brand-kit.svg`,
    "image/svg+xml"
  );

  const pngPath = path.join(outDir, "brand-kit.png");
  await svgToPng(mainSvgPath, pngPath);
  const pngUrl = await uploadToSupabase(
    pngPath,
    `${prompt_id}/brand-kit.png`,
    "image/png"
  );

  const pdfPath = path.join(outDir, "brand-kit.pdf");
  await svgToPdf(mainSvgPath, pdfPath);
  const pdfUrl = await uploadToSupabase(
    pdfPath,
    `${prompt_id}/brand-kit.pdf`,
    "application/pdf"
  );

  return {
    message: "Boxy brand kit generated (content-rich)",
    assets: {
      svg: mainSvgUrl,
      png: pngUrl,
      pdf: pdfUrl,
      variants: variantLinks,
    },
  };
}
