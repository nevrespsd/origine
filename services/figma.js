const FIGMA_API = "https://api.figma.com/v1";

// Senin erişebildiğimiz template dosyan
const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent (B PLAN) Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  // 1) TEMPLATE DOSYASINI OKU (senin az önce yaptığın şeyin aynısı)
  const templateRes = await fetch(
    `${FIGMA_API}/files/${TEMPLATE_FILE_KEY}`,
    {
      headers: { "X-Figma-Token": process.env.FIGMA_TOKEN },
    }
  );

  if (templateRes.status !== 200) {
    throw new Error(`Template okunamadı: ${templateRes.status}`);
  }

  const templateData = await templateRes.json();
  console.log("Template okundu");

  // 2) YENİ BOŞ DOSYA OLUŞTUR
  const createRes = await fetch(
    `${FIGMA_API}/files`,
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

  const createData = await createRes.json();
  const newFileKey = createData.key;

  console.log("Yeni dosya oluşturuldu:", newFileKey);

  // 3) TEMPLATE'IN İLK SAYFASINI YENİ DOSYAYA KOPYALA
  await fetch(`${FIGMA_API}/files/${newFileKey}`, {
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
          value: templateData.document.children[0],
        },
      ],
    }),
  });

  console.log("Template içeriği kopyalandı");

  return {
    message: "Figma file created from template",
    figma_file_url: `https://www.figma.com/file/${newFileKey}`,
    file_key: newFileKey,
    created_for: brand,
    plan: plan_type,
  };
}
