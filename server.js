import express from "express";
import bodyParser from "body-parser";
import { runBoxyAgent } from "./services/boxy.js";
import { createSupabaseClient } from "./services/supabase.js";

const app = express();
app.use(bodyParser.json());

app.post("/run-agent", async (req, res) => {
  console.log("=== /run-agent TETİKLENDİ ===", req.body);

  const { prompt_id, user_id, brand, prompt, plan_type } = req.body;

  try {
    const supabase = createSupabaseClient();

    const result = await runBoxyAgent({
      prompt_id,
      user_id,
      brand,
      prompt,
      plan_type,
    });

    // Supabase row update → completed
    await supabase
      .from("prompts")
      .update({
        status: "completed",
        svg_url: result.svg_url,
        png_url: result.png_url,
        pdf_url: result.pdf_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Agent hata:", err);

    await createSupabaseClient()
      .from("prompts")
      .update({
        status: "failed",
        error_message: err.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
