const FIGMA_API = "https://api.figma.com/v1";

/**
 * 1) Template Figma dosyasını kopyalar (duplicate eder)
 *    ve yeni dosyanın fileKey'ini döner.
 */
async function duplicateFigmaFile(templateKey, newName) {
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

  if (!res.ok || !data.key) {
    console.error("Figma duplicate failed:", data);
    throw new Error(
      "Figma dosyası duplicate edilemedi: " +
      JSON.stringify(data, null, 2)
    );
  }

  return data.key; // <-- YENİ DOSYANIN KEY'İ
}

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  console.log("FIGMA_TOKEN mevcut mu?:", !!process.env.FIGMA_TOKEN);
  console.log("FIGMA_TOKEN uzunluğu:", process.env.FIGMA_TOKEN?.length);

  if (!process.env.FIGMA_TOKEN) {
    throw new Error("FIGMA_TOKEN environment variable yok!");
  }

  // ===========================================================
  // 👉 SENİN TEMPLATE FİGMA DOSYAN (LINKTEN ÇIKARDIM)
  // https://www.figma.com/design/bNK1WjBEibKg7gZwb9CqpR
  // fileKey = bNK1WjBEibKg7gZwb9CqpR
  // ===========================================================
  const TEMPLATE_FILE_KEY = "bNK1WjBEibKg7gZwb9CqpR";

  // 1) Template'i çoğalt
  const newFileKey = await duplicateFigmaFile(
    TEMPLATE_FILE_KEY,
    `Origine - ${brand} - ${prompt_id}`
  );

  console.log("Yeni Figma fileKey:", newFileKey);

  // 2) Yeni dosyaya ops (Frame ekleme örneği)
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
      }
    );

    console.log("Frame ekleme status:", patchRes.status);
  } catch (e) {
    console.error("Frame eklenirken hata:", e);
  }

  // 3) Sonuç olarak döndüreceğimiz payload
  return {
    message: "Figma file created from template",
    figma_file_url: `https://www.figma.com/file/${newFileKey}`,
    file_key: newFileKey,
    created_for: brand,
    plan: plan_type,
    original_prompt: prompt,
  };
}
