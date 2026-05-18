"use client";

import { useState } from "react";

type Result = {
  nctId: string;
  oneLineSummary: string;
  whatIsBeingTested: string;
  whoItsFor: string;
  studyBasics: {
    phase: string;
    typeOfStudy: string;
    estimatedLength: string;
    estimatedEnrollment: string;
    locations: string;
    sponsor: string;
  };
  youMayBeAGoodFitIf: string[];
  youMayNotBeAGoodFitIf: string[];
  thingsToAskYourDoctor: string[];
  faq: { question: string; answer: string }[];
  confidence: "high" | "medium" | "low";
  confidenceNotes: string;
  disclaimer: string;
};

export default function Home() {
  const [nctId, setNctId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function translate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nctId: nctId.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to translate");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const confColor =
    result?.confidence === "high"
      ? "bg-green-100 text-green-800 border-green-300"
      : result?.confidence === "medium"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : "bg-red-100 text-red-800 border-red-300";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This is an AI-generated summary and is NOT medical advice. Always confirm with your doctor or the trial coordinator before acting.
        </div>

        <h1 className="text-4xl font-bold tracking-tight">TrialTranslate</h1>
        <p className="mt-2 text-lg text-slate-600">
          Understand any clinical trial in plain English. Paste an NCT ID from{" "}
          <a className="underline" href="https://clinicaltrials.gov" target="_blank">
            ClinicalTrials.gov
          </a>
          .
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={nctId}
            onChange={(e) => setNctId(e.target.value)}
            placeholder="NCT05474690"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-lg focus:border-slate-900 focus:outline-none"
          />
          <button
            onClick={translate}
            disabled={loading || !nctId}
            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Translating…" : "Translate"}
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">Try: NCT05474690</p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Reading the trial and translating… (5–15 seconds)
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <div className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase ${confColor}`}>
              {result.confidence} confidence
            </div>

            <section>
              <h2 className="text-2xl font-bold">{result.oneLineSummary}</h2>
              <p className="mt-2 text-sm text-slate-500">Trial: {result.nctId}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">What&apos;s being tested</h3>
              <p className="mt-2 text-slate-700">{result.whatIsBeingTested}</p>
              <h3 className="mt-6 text-lg font-semibold">Who it&apos;s for</h3>
              <p className="mt-2 text-slate-700">{result.whoItsFor}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">Study basics</h3>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(result.studyBasics).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {k.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-green-200 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-green-900">You may be a good fit if…</h3>
              <ul className="mt-3 space-y-2">
                {result.youMayBeAGoodFitIf.map((x, i) => (
                  <li key={i} className="flex gap-2 text-green-900">
                    <span>✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-900">You may NOT be a good fit if…</h3>
              <ul className="mt-3 space-y-2">
                {result.youMayNotBeAGoodFitIf.map((x, i) => (
                  <li key={i} className="flex gap-2 text-red-900">
                    <span>✗</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-lg font-semibold text-blue-900">Things to ask your doctor</h3>
              <ul className="mt-3 space-y-2">
                {result.thingsToAskYourDoctor.map((x, i) => (
                  <li key={i} className="flex gap-2 text-blue-900">
                    <span>?</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">FAQ</h3>
              <div className="mt-3 space-y-4">
                {result.faq.map((q, i) => (
                  <details key={i} className="rounded-lg border border-slate-200 p-3">
                    <summary className="cursor-pointer font-medium">{q.question}</summary>
                    <p className="mt-2 text-slate-700">{q.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {result.disclaimer}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
