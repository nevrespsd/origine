import express from "express";
import bodyParser from "body-parser";
import { runBoxyAgent } from "./services/boxy.js";

const app = express();
app.use(bodyParser.json());

app.post("/run-agent", async (req, res) => {
  const { prompt_id, brand, prompt } = req.body;

  console.log("=== /run-agent TETİKLENDİ ===", req.body);

  try {
    const result = await runBoxyAgent({ prompt_id, brand, prompt });

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error("Boxy job failed:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));
