import Anthropic from '@anthropic-ai/sdk';

// POST /api/grid/ai/generate-tasks
// Body: { title: string, description?: string, prompt?: string }
// Returns: { tasks: string[] } — a short list of 3-6 tasks worded like
// concrete next steps.

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: { title?: string; description?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  const description = (body.description ?? '').trim();
  const promptExtra = (body.prompt ?? '').trim();
  if (!title && !description && !promptExtra) {
    return Response.json({ error: 'Provide title, description, or prompt' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: key });
  const userContext = [
    title ? `Project title: ${title}` : '',
    description ? `Description: ${description}` : '',
    promptExtra ? `Extra context: ${promptExtra}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `You are helping a solo operator break a project into concrete next-step tasks. Return between 3 and 6 tasks. Each task is:
- a short imperative sentence (start with a verb)
- specific and immediately actionable
- not "define scope" style filler — real work
- no numbering, no bullets, no punctuation at the end

Respond ONLY with a JSON object of the form {"tasks": ["task 1", "task 2", ...]}. No prose, no code fences.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContext }],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
    // Strip any accidental code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    let parsed: { tasks?: unknown };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: 'Model returned invalid JSON', raw }, { status: 502 });
    }
    if (!Array.isArray(parsed.tasks)) {
      return Response.json({ error: 'Model response missing tasks array' }, { status: 502 });
    }
    const tasks = parsed.tasks
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    return Response.json({ tasks });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
