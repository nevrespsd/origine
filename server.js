import express from "express";
import bodyParser from "body-parser";
import { runFigmaAgent } from "./services/figma.js";
import { updatePromptStatus } from "./services/supabase.js";

const app = express();
app.use(bodyParser.json());

app.post("/run-agent", async (req, res) => {
  console.log("\n=== /run-agent TETİKLENDİ ===");
  console.log("Payload:", req.body);

  const { prompt_id, brand, prompt, plan_type } = req.body;

  try {
    console.log("→ Figma Agent başlatılıyor...");

    const result = await runFigmaAgent({
      prompt_id,
      brand,
      prompt,
      plan_type,
    });

    console.log("✅ Figma Agent BAŞARILI:", result);

    // 🔹 ÖNEMLİ: Supabase'e SUCCESS yazıyoruz
    await updatePromptStatus(prompt_id, "completed", result);

    return res.json({
      success: true,
      figma_file_url: result.figma_file_url,
    });

  } catch (err) {
    console.error("❌ Figma job FAILED:", err);

    // 🔹 ÖNEMLİ: HATAYI DA SUPABASE'E YAZIYORUZ
    await updatePromptStatus(prompt_id, "failed", {
      error: err.message || "Unknown error",
    });

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
