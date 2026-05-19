import { SYSTEM_PROMPT } from "@/lib/prompts";
import {
  buildUserMessage,
  extractCoordinators,
  getPrimaryDrugName,
  getPrimaryCondition,
} from "@/lib/trial";

export const runtime = "nodejs";

async function fetchPubmedSummary(drug: string | null, condition: string | null): Promise<string> {
  try {
    const term = [drug, condition].filter(Boolean).join(" AND ");
    if (!term) return "";
    const esearch = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        term
      )}&retmax=3&retmode=json&sort=date`
    );
    if (!esearch.ok) return "";
    const ids: string[] = (await esearch.json())?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return "";
    const esum = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(
        ","
      )}&retmode=json`
    );
    if (!esum.ok) return "";
    const data = await esum.json();
    const lines: string[] = [];
    for (const id of ids) {
      const p = data?.result?.[id];
      if (!p) continue;
      lines.push(`- ${p.title} (${p.fulljournalname ?? p.source ?? ""}, ${p.pubdate ?? ""}) [PMID:${id}]`);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

async function fetchOpenFda(drug: string | null): Promise<string> {
  try {
    if (!drug) return "";
    const r = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(
        drug
      )}%22+OR+openfda.brand_name:%22${encodeURIComponent(drug)}%22&limit=1`
    );
    if (!r.ok) return "";
    const data = await r.json();
    const result = data?.results?.[0];
    if (!result) return "";
    const fda = result.openfda ?? {};
    const lines: string[] = [];
    if (fda.brand_name) lines.push(`Brand name(s): ${fda.brand_name.join(", ")}`);
    if (fda.generic_name) lines.push(`Generic name(s): ${fda.generic_name.join(", ")}`);
    if (fda.product_type) lines.push(`Product type: ${fda.product_type.join(", ")}`);
    if (fda.route) lines.push(`Route: ${fda.route.join(", ")}`);
    if (result.indications_and_usage) {
      const t = result.indications_and_usage[0];
      lines.push(`Approved use (excerpt): ${t.slice(0, 400)}`);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { nctId } = await req.json();

    if (!nctId || !/^NCT\d{8}$/i.test(nctId)) {
      return Response.json(
        { error: "Invalid NCT ID format (expected NCT followed by 8 digits)" },
        { status: 400 }
      );
    }

    const id = nctId.toUpperCase();
    const ctResp = await fetch(`https://clinicaltrials.gov/api/v2/studies/${id}`);
    if (!ctResp.ok) {
      return Response.json({ error: "Trial not found on ClinicalTrials.gov" }, { status: 404 });
    }
    const study = (await ctResp.json()).protocolSection;

    const drug = getPrimaryDrugName(study);
    const condition = getPrimaryCondition(study);

    const [pubmedSummary, openFdaSummary] = await Promise.all([
      fetchPubmedSummary(drug, condition),
      fetchOpenFda(drug),
    ]);

    const coordinators = extractCoordinators(study);
    const userMessage = buildUserMessage(study, id, { pubmedSummary, openFdaSummary });

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

    return Response.json({
      ...output,
      coordinators,
      sources: {
        usedPubmed: !!pubmedSummary,
        usedOpenFda: !!openFdaSummary,
      },
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
