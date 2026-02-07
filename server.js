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

  console.log("Received job:", req.body);

  // 🚀 ÇOK ÖNEMLİ: Railway timeout yemesin diye
  // İSTEĞİ HEMEN KABUL EDİYORUZ
  res.json({ accepted: true, prompt_id });

  // ======== ARKA PLANDA (ASYNC) İŞİ İŞLİYORUZ ========
  try {
    const result = await runFigmaAgent({
      prompt_id,
      brand,
      prompt,
      plan_type,
    });

    console.log("Figma result:", result);

    // ✅ PROMPTS TABLOSUNU GÜNCELLE
    const { error } = await supabase
      .from("prompts")
      .update({
        status: "completed",
        figma_file_url: result.figma_file_url,
        response: result, // JSON olarak saklıyoruz
        completed_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    if (error) {
      console.error("DB update error:", error);
      // Hata olursa failed işaretle
      await supabase
        .from("prompts")
        .update({ status: "failed" })
        .eq("id", prompt_id);
      return;
    }

    console.log("Job completed:", prompt_id);
  } catch (err) {
    console.error("Figma job failed:", err);

    // ❌ Hata olursa DB’de failed işaretle
    await supabase
      .from("prompts")
      .update({ status: "failed" })
      .eq("id", prompt_id);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
