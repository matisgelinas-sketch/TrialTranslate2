import { SYSTEM_PROMPT } from "@/lib/prompts";
import { buildUserMessage } from "@/lib/trial";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { nctId } = await req.json();

    if (!nctId || !/^NCT\d{8}$/i.test(nctId)) {
      return Response.json({ error: "Invalid NCT ID format (expected NCT followed by 8 digits)" }, { status: 400 });
    }

    const id = nctId.toUpperCase();

    const ctResp = await fetch(`https://clinicaltrials.gov/api/v2/studies/${id}`);
    if (!ctResp.ok) {
      return Response.json({ error: "Trial not found on ClinicalTrials.gov" }, { status: 404 });
    }
    const study = (await ctResp.json()).protocolSection;
    const userMessage = buildUserMessage(study, id);

    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      return Response.json({ error: `Groq error: ${errText}` }, { status: 500 });
    }

    const groqData = await groqResp.json();
    const raw = groqData.choices[0].message.content as string;
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const output = JSON.parse(cleaned);

    return Response.json(output);
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
