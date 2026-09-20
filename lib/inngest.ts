import { Inngest } from "inngest";
import OpenAI from "openai";
import { workflowEvents } from "./workflow";

export const inngest = new Inngest({ id: "flyrank-visual-ai-workflow" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalizeDecision(value: unknown): "YES" | "NO" {
  return String(value).toUpperCase().includes("YES") ? "YES" : "NO";
}

export const runDecisionWorkflow = inngest.createFunction(
  { id: "run-ai-decision-workflow", retries: 1 },
  { event: workflowEvents.run },
  async ({ event, step }) => {
    const input = String(event.data.input ?? "");
    const nodes = Array.isArray(event.data.nodes) ? event.data.nodes : [];
    const firstNode = nodes[0] ?? {
      label: "AI Decision",
      prompt: "Should the input be accepted?"
    };

    const decision = await step.run("evaluate-ai-decision", async () => {
      if (!process.env.OPENAI_API_KEY) {
        const billing = /charge|charged|bill|payment|invoice|subscription/i.test(input);
        return {
          result: billing ? "YES" : "NO",
          reason: "Demo mode: deterministic decision because OPENAI_API_KEY is not configured."
        };
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return JSON only with exactly two keys: result ("YES" or "NO") and reason (short string).'
          },
          {
            role: "user",
            content: `Decision step: ${firstNode.label}\nInstruction: ${firstNode.prompt}\nInput: ${input}`
          }
        ]
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return {
        result: normalizeDecision(parsed.result),
        reason: String(parsed.reason || "AI decision completed.")
      };
    });

    return decision;
  }
);

export const functions = [runDecisionWorkflow];