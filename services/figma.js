const FIGMA_API = "https://api.figma.com/v1";

const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8"; // <-- SENİN TEAM DOSYAN

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  console.log("FIGMA_TOKEN mevcut mu?:", !!process.env.FIGMA_TOKEN);
  console.log("FIGMA_TOKEN uzunluğu:", process.env.FIGMA_TOKEN?.length);

  // 1) TEMPLATE DOSYASINI DUPLICATE ET
  const duplicateRes = await fetch(
    `${FIGMA_API}/files/${TEMPLATE_FILE_KEY}/duplicate`,
    {
      method: "POST",
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Origine - ${brand} - ${prompt_id}`,
      }),
    }
  );

  const status = duplicateRes.status;
  const data = await duplicateRes.json();

  console.log("Duplicate HTTP Status:", status);
  console.log("Duplicate Response:", JSON.stringify(data, null, 2));

  const fileKey = data?.key;

  if (!fileKey) {
    throw new Error(
      "Figma fileKey bulunamadı! Yanıt:\n" +
        JSON.stringify(data, null, 2)
    );
  }

  console.log("Yeni dosya oluşturuldu. fileKey:", fileKey);

  // 2) (Opsiyonel) Frame ekleme örneği
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

  return {
    message: "Figma file duplicated",
    figma_file_url: `https://www.figma.com/file/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type,
  };
}
