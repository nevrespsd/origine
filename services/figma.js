const FIGMA_API = "https://api.figma.com/v1";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

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

  const status = createFileRes.status;
  const fileData = await createFileRes.json();

  console.log("Figma HTTP Status:", status);
  console.log("Figma Raw Response:", JSON.stringify(fileData, null, 2));

  const fileKey =
    fileData?.meta?.key ||
    fileData?.key ||
    null;

  if (!fileKey) {
    throw new Error(
      "Figma fileKey bulunamadı! Yanıt:\n" +
        JSON.stringify(fileData, null, 2)
    );
  }

  console.log("Bulunan fileKey:", fileKey);

  // 2) Frame eklemeyi dene
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
