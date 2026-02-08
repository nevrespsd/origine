import express from "express";
import { runBoxyAgent } from "./services/boxy.js";
import { createSupabaseClient } from "./services/supabase.js";

const app = express();
app.use(express.json());

app.post("/run-agent", async (req, res) => {
  console.log("=== /run-agent TETİKLENDİ ===", req.body);

  const { prompt_id, user_id, brand, prompt, plan_type } = req.body;

  if (!prompt_id) {
    return res.status(400).json({ error: "prompt_id missing" });
  }

  const supabase = createSupabaseClient();

  try {
    // 1️⃣ Boxy agent’ı çalıştır
    const result = await runBoxyAgent({
      prompt_id,
      user_id,
      brand,
      prompt,
      plan_type,
    });

    console.log("Boxy sonucu:", result);

    // 2️⃣ Supabase’ı MUTLAKA güncelle (pending → completed)
    const { error } = await supabase
      .from("prompts")
      .update({
        status: "completed",
        svg_url: result.svg_url,
        png_url: result.png_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    if (error) {
      console.error("Supabase update hatası:", error);
      return res.status(500).json({ error: "Supabase update failed" });
    }

    console.log("Supabase updated to completed:", prompt_id);

    return res.json({
      success: true,
      prompt_id,
      svg_url: result.svg_url,
      png_url: result.png_url,
    });

  } catch (err) {
    console.error("Agent hata:", err);
    await supabase
      .from("prompts")
      .update({ status: "failed" })
      .eq("id", prompt_id);

    return res.status(500).json({
      error: err.message || "Agent failed",
    });
  }
});

app.listen(3000, () => console.log("Agent running on port 3000"));

