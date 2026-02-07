import fetch from "node-fetch";

const FIGMA_API = "https://api.figma.com/v1";

export async function runFigmaAgent({ prompt_id, brand, prompt, plan_type }) {
  console.log("Running Figma Agent:", { prompt_id, brand, prompt, plan_type });

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
  const fileKey = fileData.key;

  return {
    message: "Figma file created",
    figma_file_url: `https://www.figma.com/file/${fileKey}`,
    file_key: fileKey,
    created_for: brand,
    plan: plan_type
  };
}
