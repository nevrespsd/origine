import express from "express";
import { createSupabaseClient } from "./services/supabase.js";
import { runBoxyAgent } from "./services/boxy.js";

const app = express();
app.use(express.json());

const supabase = createSupabaseClient();

app.get("/", (req, res) => {
  res.json({ status: "origine-agent running (Boxy full mode)" });
});

app.post("/run-agent", async (req, res) => {
  const { prompt_id, brand, prompt } = req.body;

  console.log("\n=== /run-agent TETİKLENDİ ===", req.body);

  res.json({ accepted: true, prompt_id });

  try {
    console.log("→ Boxy Agent başlıyor...");

    const result = await runBoxyAgent({ prompt_id, brand, prompt });

    await supabase
      .from("prompts")
      .update({
        status: "completed",
        assets: result.assets,
        response: result,
        completed_at: new Date().toISOString(),
      })
      .eq("id", prompt_id);

    console.log("✅ Job TAMAMLANDI:", prompt_id);

  } catch (err) {
    console.error("❌ Boxy job FAILED:", err);

    await supabase
      .from("prompts")
      .update({
        status: "failed",
        response: { error: err.message || "Unknown error" },
      })
      .eq("id", prompt_id);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
