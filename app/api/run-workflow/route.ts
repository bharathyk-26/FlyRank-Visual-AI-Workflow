import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { workflowEvents } from "@/lib/workflow";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = String(body.input ?? "").trim();
    const nodes = Array.isArray(body.nodes) ? body.nodes : [];

    if (!input) {
      return NextResponse.json({ error: "Test input is required." }, { status: 400 });
    }

    const sent = await inngest.send({
      name: workflowEvents.run,
      data: { input, nodes }
    });

    return NextResponse.json({
      queued: true,
      eventId: sent.ids?.[0] ?? null,
      result: "YES",
      reason: "Workflow event accepted. Inngest will execute the AI decision."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start workflow." },
      { status: 500 }
    );
  }
}