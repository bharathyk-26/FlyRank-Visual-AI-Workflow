# FlyRank Visual AI Workflow

A visual AI workflow system where every node represents an AI decision step returning **YES** or **NO**.

## Stack

- Next.js + React
- React Flow (`@xyflow/react`)
- Inngest
- OpenAI SDK
- Custom Shadcn-style UI components

## Features

- Visual workflow canvas
- Add AI decision nodes
- Connect nodes with React Flow
- Edit decision prompt and node name
- Send test input to an Inngest event
- Inngest executes the AI decision
- OpenAI returns structured YES/NO output
- Demo fallback works without an OpenAI key
- Responsive layout

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

In another terminal:

```bash
npm run inngest
```

Open:

```text
http://localhost:3000
```

The Inngest development UI is normally available at:

```text
http://localhost:8288
```

## Environment

```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

Never commit `.env.local`.

## Data flow

1. User enters a test message.
2. React Flow sends the workflow configuration to `/api/run-workflow`.
3. The Next.js API route sends an event to Inngest.
4. Inngest executes the decision function.
5. The OpenAI SDK evaluates the selected decision prompt.
6. The workflow normalizes the response to YES or NO.
7. The result is returned/logged by the workflow.

## Deployment

Deploy the Next.js app to Vercel or another Node-compatible platform. Add `OPENAI_API_KEY` and `OPENAI_MODEL` as environment variables. Configure the Inngest production app endpoint to:

```text
https://YOUR-DOMAIN/api/inngest
```

## FlyRank deliverables

- Running frontend application
- Working Inngest endpoint
- Public GitHub repository
- README explaining architecture and data flow
