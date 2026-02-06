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
  try {
    const { prompt_id, brand, prompt, plan_type } = req.body;

    console.log("Received job:", req.body);

    const result = await runFigmaAgent({
      prompt_id,
      brand,
      prompt,
      plan_type
    });

    const { error } = await supabase
      .from("prompts")
      .update({
        response: JSON.stringify(result),
        status: "completed"
      })
      .eq("id", prompt_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, prompt_id, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
