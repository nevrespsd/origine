const FIGMA_API = "https://api.figma.com/v1";

// === ÖNEMLİ: Template dosyanın key'i (SENİN DUPLICATE ETTİĞİN) ===
const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8";

console.log("FIGMA_TOKEN mevcut mu?:", !!process.env.FIGMA_TOKEN);
console.log("FIGMA_TOKEN uzunluğu:", process.env.FIGMA_TOKEN?.length);

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  // -------------------------------------------------------
  // 1) TEMPLATE DOSYASINI DUPLICATE ET (EN GÜVENLİ YOL)
  // -------------------------------------------------------
  console.log("Template dosyası duplicate ediliyor:", TEMPLATE_FILE_KEY);

  const duplicateRes = await fetch(
    `${FIGMA_API}/files/${TEMPLATE_FILE_KEY}/duplicate`,
    {
      method: "POST",
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Origine — ${brand} — ${prompt_id}`,
      }),
    }
  );

  const dupStatus = duplicateRes.status;
  const dupData = await duplicateRes.json();

  console.log("Duplicate HTTP Status:", dupStatus);
  console.log("Duplicate Raw Response:", JSON.stringify(dupData, null, 2));

  // Figma duplicate'tan gelen yeni dosya key'i
  const fileKey =
    dupData?.meta?.key ||
    dupData?.key ||
    null;

  if (!fileKey) {
    throw new Error(
      "Figma fileKey bulunamadı! Yanıt:\n" +
        JSON.stringify(dupData, null, 2)
    );
  }

  console.log("Yeni oluşturulan fileKey:", fileKey);

  // -------------------------------------------------------
  // 2) Yeni dosyaya örnek FRAME ekle (test amaçlı)
  // -------------------------------------------------------
  try {
    const patchRes = await fetch(`${FIGMA_API}/files/${fileKey}`, {
      method: "PATCH",
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ops: [
          {
            op: "add",
            path: "document/children",
            value: {
              type: "FRAME",
              name: `Brand Kit — ${brand}`,
              absoluteBoundingBox: {
                x: 0,
                y: 0,
                width: 1440,
                height: 1024,
              },
            },
          },
        ],
      }),
    });

    console.log("Frame ekleme status:", patchRes.status);
  } catch (e) {
    console.error("Frame eklenirken hata:", e);
  }

  // -------------------------------------------------------
  // 3) Sonuç
  // -------------------------------------------------------
  return {
    message: "Figma file duplicated & initialized",
    figma_file_url: `https://www.figma.com/file/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type,
  };
}
