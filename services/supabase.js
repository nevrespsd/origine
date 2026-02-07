import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function updatePromptStatus(prompt_id, status, response = null) {
  const { error } = await supabase
    .from("prompts")
    .update({
      status,
      response,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prompt_id);

  if (error) {
    console.error("Supabase update failed:", error);
  }
}
