const FIGMA_API = "https://api.figma.com/v1";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  const TOKEN = process.env.FIGMA_TOKEN;
  if (!TOKEN) throw new Error("FIGMA_TOKEN yok!");

  console.log("=== Figma Agent Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  // 1) YENİ FİGMA DOSYASI AÇ
  console.log("→ Yeni Figma dosyası oluşturuluyor...");

  const createRes = await fetch(`${FIGMA_API}/files`, {
    method: "POST",
    headers: {
      "X-Figma-Token": TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Origine — ${brand} — ${prompt_id}`,
    }),
  });

  if (createRes.status !== 200) {
    const txt = await createRes.text();
    throw new Error(`Yeni dosya oluşturulamadı: ${createRes.status} - ${txt}`);
  }

  const newFile = await createRes.json();
  const newFileKey = newFile.key;

  console.log("Yeni dosya key:", newFileKey);

  // 2) ANA FRAME EKLE
  console.log("→ Ana Frame ekleniyor...");

  await fetch(`${FIGMA_API}/files/${newFileKey}`, {
    method: "PATCH",
    headers: {
      "X-Figma-Token": TOKEN,
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

  return {
    message: "Figma file created",
    figma_file_url: `https://www.figma.com/design/${newFileKey}`,
    file_key: newFileKey,
  };
}
