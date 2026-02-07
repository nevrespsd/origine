const FIGMA_API = "https://api.figma.com/v1";

// === SENİN TEMPLATE KEY'İN ===
const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8";

console.log("FIGMA_TOKEN mevcut mu?:", !!process.env.FIGMA_TOKEN);
console.log("FIGMA_TOKEN uzunluğu:", process.env.FIGMA_TOKEN?.length);

async function duplicateFigmaFile(templateKey, newName) {
  console.log("Template duplicate çağrısı atılıyor:", templateKey);

  const res = await fetch(
    `${FIGMA_API}/files/${templateKey}/duplicate`,
    {
      method: "POST",
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    }
  );

  const data = await res.json();

  console.log("Duplicate HTTP Status:", res.status);
  console.log("Duplicate Raw Response:", JSON.stringify(data, null, 2));

  // 🔹 BURASI DÜZELTİLDİ — Figma'nın GERÇEK yapısını okuyoruz
  const fileKey = data?.key;

  if (!fileKey) {
    throw new Error(
      "Figma duplicate yanıtında key yok:\n" +
        JSON.stringify(data, null, 2)
    );
  }

  return fileKey;
}

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  if (!process.env.FIGMA_TOKEN) {
    throw new Error("FIGMA_TOKEN environment variable yok!");
  }

  // 1) TEMPLATE'İ DUPLICATE ET
  const newFileKey = await duplicateFigmaFile(
    TEMPLATE_FILE_KEY,
    `Origine — ${brand} — ${prompt_id}`
  );

  console.log("Yeni oluşturulan fileKey:", newFileKey);

  // 2) (Opsiyonel) Yeni dosyaya Frame ekleme denemesi
  try {
    const patchRes = await fetch(
      `${FIGMA_API}/files/${newFileKey}/nodes`,
      {
        method: "POST",
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
      }
    );

    console.log("Frame ekleme status:", patchRes.status);
  } catch (e) {
    console.error("Frame eklenirken hata:", e);
  }

  return {
    message: "Figma file duplicated & initialized",
    figma_file_url: `https://www.figma.com/file/${newFileKey}`,
    file_key: newFileKey,
    created_for: brand,
    plan: plan_type,
  };
}
