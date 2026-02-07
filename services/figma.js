import fetch from "node-fetch";

const FIGMA_API = "https://api.figma.com/v1";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("Running Figma Agent:", { prompt_id, brand, prompt, plan_type });

  // 1) Yeni bir Figma dosyası oluştur
  const createFileRes = await fetch(`${FIGMA_API}/files`, {
    method: "POST",
    headers: {
      "X-Figma-Token": process.env.FIGMA_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `Origine - ${brand} - ${prompt_id}`
    })
  });

  const fileData = await createFileRes.json();

  // ✅ DÜZELTİLMİŞ SATIRLAR (ÖNEMLİ)
  console.log("Figma raw response:", fileData);

  const fileKey = fileData.meta?.key || fileData.key;

  if (!fileKey) {
    throw new Error(
      "Figma file key bulunamadı: " + JSON.stringify(fileData)
    );
  }

  // 2) Boş frame ekle (isteğe bağlı)
  await fetch(`${FIGMA_API}/files/${fileKey}`, {
    method: "PATCH",
    headers: {
      "X-Figma-Token": process.env.FIGMA_TOKEN,
      "Content-Type": "application/json"
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

  return {
    message: "Figma file created",
    figma_file_url: `https://www.figma.com/file/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type
  };
}

