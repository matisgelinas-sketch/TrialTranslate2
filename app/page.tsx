"use client";

import { useMemo, useState } from "react";

type Coordinator = { name: string; email: string; phone: string; facility: string };

type Result = {
  nctId: string;
  oneLineSummary: string;
  whatIsBeingTested: string;
  whoItsFor: string;
  phaseExplained: {
    phaseName: string;
    whatPhaseMeans: string;
    whatThisMeansForYou: string;
  };
  studyBasics: {
    phase: string;
    typeOfStudy: string;
    estimatedLength: string;
    estimatedEnrollment: string;
    locations: string;
    sponsor: string;
  };
  participationCriteria: {
    mustMeetAll: string[];
    mustNotHaveAny: string[];
    needsDoctorVerification: string[];
  };
  relatedResearchSummary: string;
  drugApprovalNotes: string;
  confidence: "high" | "medium" | "low";
  confidenceNotes: string;
  disclaimer: string;
  coordinators: Coordinator[];
  sources: { usedPubmed: boolean; usedOpenFda: boolean };
};

export default function Home() {
  const [nctId, setNctId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
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

  const doctorEmailDraft = useMemo(() => {
    if (!result) return null;
    const subject = `Question about clinical trial ${result.nctId}`;
    const greet = doctorName ? `Dr. ${doctorName}` : "Doctor";
    const me = patientName || "your patient";
    const body =
      `Hello ${greet},\n\n` +
      `I came across a clinical trial that may be relevant to my care: ${result.nctId} — "${result.oneLineSummary}".\n\n` +
      `Before contacting the study team, I'd like to ask whether I might be a good fit. Specifically:\n\n` +
      `Things the trial says I MUST meet:\n` +
      result.participationCriteria.mustMeetAll.map((x) => `  - ${x}`).join("\n") +
      `\n\nThings that would DISQUALIFY me:\n` +
      result.participationCriteria.mustNotHaveAny.map((x) => `  - ${x}`).join("\n") +
      `\n\nThings I need YOUR help to verify (lab values, tests, history):\n` +
      result.participationCriteria.needsDoctorVerification.map((x) => `  - ${x}`).join("\n") +
      `\n\nWould you be able to review these with me and let me know if it's worth contacting the trial coordinator?\n\n` +
      `Trial page: https://clinicaltrials.gov/study/${result.nctId}\n\n` +
      `Thank you,\n${me}`;
    return { subject, body };
  }, [result, doctorName, patientName]);

  const coordinatorEmailDraft = useMemo(() => {
    if (!result) return null;
    const subject = `Interest in clinical trial ${result.nctId}`;
    const me = patientName || "[Your Name]";
    const body =
      `Hello,\n\n` +
      `My name is ${me}. I am writing to express interest in participating in your clinical trial ${result.nctId} ("${result.oneLineSummary}").\n\n` +
      `Based on the trial listing, I believe I may meet several of the inclusion criteria. I have reviewed the eligibility requirements with the help of my doctor and would like to learn more about next steps, including any pre-screening process.\n\n` +
      `Could you let me know:\n` +
      `  1. Whether the trial is still actively enrolling at a site near me\n` +
      `  2. How to start the pre-screening process\n` +
      `  3. What documents or tests I should bring or have ready\n\n` +
      `Thank you for your time, and for the work you're doing on this study.\n\n` +
      `Best regards,\n${me}`;
    return { subject, body };
  }, [result, patientName]);

  function mailto(to: string, subject: string, body: string) {
    const params = new URLSearchParams({ subject, body });
    return `mailto:${to}?${params.toString()}`;
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
          Find out whether you might qualify for a clinical trial — and contact the right people about it.
        </p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">Your details (optional, used to pre-fill emails)</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Doctor's last name"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              placeholder="Doctor's email"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </section>

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
        <p className="mt-2 text-sm text-slate-500">
          Paste an NCT ID from{" "}
          <a className="underline" href="https://clinicaltrials.gov" target="_blank">
            ClinicalTrials.gov
          </a>
          . Try: NCT05474690
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Reading the trial, checking PubMed and OpenFDA, translating… (10–20 seconds)
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase ${confColor}`}
              >
                {result.confidence} confidence
              </div>
              {result.sources?.usedPubmed && (
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                  + PubMed
                </span>
              )}
              {result.sources?.usedOpenFda && (
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                  + OpenFDA
                </span>
              )}
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

            {/* PARTICIPATION CRITERIA — the hero of the page */}
            <section className="rounded-xl border-2 border-slate-900 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Participation criteria</h3>
              <p className="mt-1 text-sm text-slate-600">
                The most important part. Read all three lists carefully before reaching out to anyone.
              </p>

              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="font-semibold text-green-900">You must meet ALL of these</h4>
                <ul className="mt-2 space-y-2 text-green-900">
                  {result.participationCriteria.mustMeetAll.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span>✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="font-semibold text-red-900">You must NOT have any of these</h4>
                <ul className="mt-2 space-y-2 text-red-900">
                  {result.participationCriteria.mustNotHaveAny.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span>✗</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="font-semibold text-blue-900">Your doctor needs to verify these</h4>
                <ul className="mt-2 space-y-2 text-blue-900">
                  {result.participationCriteria.needsDoctorVerification.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span>?</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* PHASE EXPLAINED */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">
                What &ldquo;{result.phaseExplained.phaseName}&rdquo; means
              </h3>
              <p className="mt-2 text-slate-700">{result.phaseExplained.whatPhaseMeans}</p>
              <p className="mt-3 rounded-lg bg-slate-100 p-3 text-slate-800">
                <span className="font-semibold">For you specifically: </span>
                {result.phaseExplained.whatThisMeansForYou}
              </p>
              <details className="mt-4 text-sm text-slate-600">
                <summary className="cursor-pointer">Quick reference: all four phases</summary>
                <ul className="mt-3 space-y-2">
                  <li><span className="font-semibold">Phase 1</span> — Small group (~20–100), often healthy volunteers. Tests basic safety and dosing.</li>
                  <li><span className="font-semibold">Phase 2</span> — Hundreds of patients with the condition. Tests whether the drug seems to work.</li>
                  <li><span className="font-semibold">Phase 3</span> — Thousands of patients. Compares the drug to existing treatment or placebo. Required for FDA approval.</li>
                  <li><span className="font-semibold">Phase 4</span> — After approval. Watches for rare side effects in the general population.</li>
                </ul>
              </details>
            </section>

            {/* STUDY BASICS */}
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

            {/* RELATED RESEARCH */}
            {(result.relatedResearchSummary || result.drugApprovalNotes) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold">More context from other libraries</h3>
                {result.relatedResearchSummary && (
                  <>
                    <h4 className="mt-3 text-sm font-semibold text-slate-600">From PubMed</h4>
                    <p className="mt-1 text-slate-700">{result.relatedResearchSummary}</p>
                  </>
                )}
                {result.drugApprovalNotes && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold text-slate-600">From OpenFDA</h4>
                    <p className="mt-1 text-slate-700">{result.drugApprovalNotes}</p>
                  </>
                )}
              </section>
            )}

            {/* CONTACT YOUR DOCTOR */}
            <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
              <h3 className="text-lg font-semibold text-indigo-900">Contact your healthcare provider</h3>
              <p className="mt-1 text-sm text-indigo-900">
                Talk to your doctor first. They can verify the items in the blue list above and tell you whether it&apos;s worth contacting the trial team.
              </p>
              {doctorEmailDraft && (
                <>
                  <details className="mt-4 rounded-lg bg-white p-3 text-sm">
                    <summary className="cursor-pointer font-medium">Preview the email</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-slate-700">{doctorEmailDraft.body}</pre>
                  </details>
                  <a
                    href={mailto(doctorEmail, doctorEmailDraft.subject, doctorEmailDraft.body)}
                    className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                  >
                    Open email to my doctor
                  </a>
                  {!doctorEmail && (
                    <p className="mt-2 text-xs text-indigo-900">
                      Tip: add your doctor&apos;s email at the top of the page to pre-fill the To: field.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* CONTACT THE TRIAL */}
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-lg font-semibold text-emerald-900">Contact the trial coordinator</h3>
              {result.coordinators && result.coordinators.length > 0 ? (
                <>
                  <p className="mt-1 text-sm text-emerald-900">
                    {result.coordinators.length} contact{result.coordinators.length === 1 ? "" : "s"} found in the trial listing.
                  </p>
                  <ul className="mt-3 space-y-3">
                    {result.coordinators.slice(0, 6).map((c, i) => (
                      <li key={i} className="rounded-lg bg-white p-3">
                        <div className="font-medium">{c.name || "(Coordinator name not listed)"}</div>
                        <div className="text-sm text-slate-600">{c.facility}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm">
                          {c.email && (
                            <a
                              className="text-emerald-700 underline"
                              href={
                                coordinatorEmailDraft
                                  ? mailto(c.email, coordinatorEmailDraft.subject, coordinatorEmailDraft.body)
                                  : `mailto:${c.email}`
                              }
                            >
                              {c.email}
                            </a>
                          )}
                          {c.phone && <a className="text-emerald-700 underline" href={`tel:${c.phone}`}>{c.phone}</a>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {coordinatorEmailDraft && (
                    <details className="mt-4 rounded-lg bg-white p-3 text-sm">
                      <summary className="cursor-pointer font-medium">Preview the email</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-slate-700">
                        {coordinatorEmailDraft.body}
                      </pre>
                    </details>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-emerald-900">
                  No coordinator contact was listed on ClinicalTrials.gov for this trial. You can still view the trial page directly:{" "}
                  <a
                    className="underline"
                    target="_blank"
                    href={`https://clinicaltrials.gov/study/${result.nctId}`}
                  >
                    clinicaltrials.gov/study/{result.nctId}
                  </a>
                </p>
              )}
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
