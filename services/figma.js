import fetch from "node-fetch";

const FIGMA_API = "https://api.figma.com/v1";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

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

  const status = createFileRes.status;
  const fileData = await createFileRes.json();

  console.log("Figma HTTP Status:", status);
  console.log("Figma Raw Response:", JSON.stringify(fileData, null, 2));

  // Key'i mümkün olan HER YERDEN deniyoruz
  const fileKey =
    fileData?.meta?.key ||
    fileData?.key ||
    fileData?.document?.key ||
    null;

  if (!fileKey) {
    throw new Error(
      "Figma fileKey bulunamadı! Yanıt:\n" +
        JSON.stringify(fileData, null, 2)
    );
  }

  console.log("Bulunan fileKey:", fileKey);

  // Boş frame ekleme denemesi (ops formatını da güvenli hale getirdik)
  try {
    const patchRes = await fetch(`${FIGMA_API}/files/${fileKey}`, {
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

    console.log("Patch status:", patchRes.status);
  } catch (e) {
    console.error("Frame eklenirken hata:", e);
  }

  return {
    message: "Figma file created",
    figma_file_url: `https://www.figma.com/file/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type
  };
}
