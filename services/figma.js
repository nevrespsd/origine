const FIGMA_API = "https://api.figma.com/v1";

// SENİN TEMPLATE KEY (team’deki dosya)
const TEMPLATE_FILE_KEY = "m52UZKuumey6VMJHktCUQ8";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("=== Figma Agent (SAFE MODE) Başladı ===");
  console.log({ prompt_id, brand, prompt, plan_type });

  const TOKEN = process.env.FIGMA_TOKEN;
  if (!TOKEN) throw new Error("FIGMA_TOKEN yok!");

  // 1) TEMPLATE DOSYASINI OKU (BU SENDE ZATEN ÇALIŞIYOR)
  console.log("→ Template okunuyor...");

  const templateRes = await fetch(`${FIGMA_API}/files/${TEMPLATE_FILE_KEY}`, {
    headers: {
      "X-Figma-Token": TOKEN,
      "Accept": "application/json"
    }
  });

  if (templateRes.status !== 200) {
    const txt = await templateRes.text();
    throw new Error(`Template okunamadı: ${templateRes.status} - ${txt}`);
  }

  const templateData = await templateRes.json();
  console.log("Template okundu ✅");

  // 2) YENİ BOŞ FİGMA DOSYASI OLUŞTUR
  console.log("→ Yeni Figma dosyası oluşturuluyor...");

  const createRes = await fetch(`${FIGMA_API}/files`, {
    method: "POST",
    headers: {
      "X-Figma-Token": TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `Origine - ${brand} - ${prompt_id}`
    })
  });

  if (createRes.status !== 200) {
    const txt = await createRes.text();
    throw new Error(`Yeni dosya oluşturulamadı: ${createRes.status} - ${txt}`);
  }

  const newFile = await createRes.json();
  const newFileKey = newFile.key;

  console.log("Yeni dosya key:", newFileKey);

  // 3) TEMPLATE’İN DOKÜMANINI YENİ DOSYAYA KOPYALA (CRUCIAL PART)
  console.log("→ Template içeriği yeni dosyaya kopyalanıyor...");

  const patchRes = await fetch(`${FIGMA_API}/files/${newFileKey}`, {
    method: "PATCH",
    headers: {
      "X-Figma-Token": TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ops: [
        {
          op: "replace",
          path: "document",
          value: templateData.document
        }
      ]
    })
  });

  console.log("Patch status:", patchRes.status);

  return {
    message: "Figma file created from template",
    figma_file_url: `https://www.figma.com/design/${newFileKey}`,
    file_key: newFileKey,
    created_for: brand,
    plan: plan_type
  };
}
