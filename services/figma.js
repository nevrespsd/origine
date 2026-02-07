const FIGMA_API = "https://api.figma.com/v1";

console.log("FIGMA_TOKEN mevcut mu?:", !!process.env.FIGMA_TOKEN);
console.log("FIGMA_TOKEN uzunluğu:", process.env.FIGMA_TOKEN?.length);

// BU SENİN YENİ TEMPLATE KEY'İN:
const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent (B PLAN) Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  // 1) Figma dosyasını DUPLICATE et (EN GÜVENLİ YOL)
  const duplicateRes = await fetch(
    `${FIGMA_API}/files/${TEMPLATE_FILE_KEY}/duplicate`,
    {
      method: "POST",
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Origine - ${brand} - ${prompt_id}`
      })
    }
  );

  const status = duplicateRes.status;
  const fileData = await duplicateRes.json();

  console.log("Duplicate HTTP Status:", status);
  console.log("Duplicate Raw Response:", JSON.stringify(fileData, null, 2));

  if (status !== 200) {
    throw new Error(
      `Figma duplicate başarısız! Status: ${status}\n` +
      JSON.stringify(fileData, null, 2)
    );
  }

  const fileKey = fileData?.key;
  if (!fileKey) {
    throw new Error(
      "Figma fileKey bulunamadı! Yanıt:\n" +
      JSON.stringify(fileData, null, 2)
    );
  }

  console.log("Bulunan yeni fileKey:", fileKey);

  // 2) Yeni dosyaya küçük bir Frame ekleyelim (opsiyonel ama iyi pratik)
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
              name: `Brand Kit - ${brand}`,
              absoluteBoundingBox: {
                x: 0,
                y: 0,
                width: 1440,
                height: 1024
              }
            }
          }
        ]
      })
    });

    console.log("Frame ekleme status:", patchRes.status);
  } catch (e) {
    console.error("Frame eklenirken hata (önemsiz):", e);
  }

  return {
    message: "Figma file duplicated",
    figma_file_url: `https://www.figma.com/design/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type
  };
}
