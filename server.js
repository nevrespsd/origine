import express from "express";
import { createSupabaseClient } from "./services/supabase.js";
import { runFigmaAgent } from "./services/figma.js";

const app = express();
app.use(express.json());

const supabase = createSupabaseClient();

app.get("/", (req, res) => {
  res.json({ status: "origine-agent running" });
});

app.post("/run-agent", async (req, res) => {
  const { prompt_id, brand, prompt, plan_type } = req.body;

  console.log("=== /run-agent TETİKLENDİ ===");
  console.log("Payload:", req.body);

  // ⛔ Railway timeout yemesin diye hemen cevap dönüyoruz
  res.json({ accepted: true, prompt_id });

  try {
    console.log("→ Figma Agent başlıyor...");

    const result = await runFigmaAgent({
      prompt_id,
      brand,
      prompt,
      plan_type,
    });

    console.log("→ Figma Agent sonucu:", result);

    console.log("→ Supabase güncelleniyor...");

    const { error } = await supabase
      .from("prompts")
      .update({
        status: "completed",
        figma_file_url: result.figma_file_url,
        response: result,
        completed_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    if (error) {
      console.error("❌ DB update HATASI:", error);

      await supabase
        .from("prompts")
        .update({ status: "failed" })
        .eq("id", prompt_id);

      return;
    }

    console.log("✅ Job TAMAMLANDI:", prompt_id);
  } catch (err) {
    console.error("❌ Figma job FAILED:", err);

    await supabase
      .from("prompts")
      .update({ status: "failed" })
      .eq("id", prompt_id);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
