import { USER_TEMPLATE } from "./prompts";

export type CoordinatorContact = {
  name: string;
  email: string;
  phone: string;
  facility: string;
};

export function extractCoordinators(study: any): CoordinatorContact[] {
  const out: CoordinatorContact[] = [];
  const central = study?.contactsLocationsModule?.centralContacts ?? [];
  for (const c of central) {
    out.push({
      name: c?.name ?? "",
      email: c?.email ?? "",
      phone: c?.phone ?? "",
      facility: "Central study contact",
    });
  }
  const locs = study?.contactsLocationsModule?.locations ?? [];
  for (const l of locs) {
    const contacts = l?.contacts ?? [];
    for (const c of contacts) {
      if (!c?.email && !c?.phone) continue;
      out.push({
        name: c?.name ?? "",
        email: c?.email ?? "",
        phone: c?.phone ?? "",
        facility: `${l?.facility ?? ""}, ${l?.city ?? ""}, ${l?.state ?? ""}, ${l?.country ?? ""}`.trim(),
      });
    }
  }
  // dedupe by email+name
  const seen = new Set<string>();
  return out.filter((c) => {
    const k = `${c.email}|${c.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function buildUserMessage(
  study: any,
  nctId: string,
  extras: { pubmedSummary: string; openFdaSummary: string }
): string {
  const fields: Record<string, string | number | boolean> = {
    nctId,
    briefTitle: study?.identificationModule?.briefTitle ?? "",
    officialTitle: study?.identificationModule?.officialTitle ?? "",
    phase: (study?.designModule?.phases ?? ["Not specified"]).join(", "),
    studyType: study?.designModule?.studyType ?? "",
    overallStatus: study?.statusModule?.overallStatus ?? "",
    enrollmentCount: study?.designModule?.enrollmentInfo?.count ?? "Unknown",
    leadSponsor: study?.sponsorCollaboratorsModule?.leadSponsor?.name ?? "",
    conditionsList: (study?.conditionsModule?.conditions ?? []).join("\n"),
    interventionsList: (study?.armsInterventionsModule?.interventions ?? [])
      .map((i: any) => `- ${i?.type ?? ""}: ${i?.name ?? ""} — ${i?.description ?? ""}`)
      .join("\n"),
    briefSummary: study?.descriptionModule?.briefSummary ?? "",
    detailedDescription: study?.descriptionModule?.detailedDescription ?? "",
    eligibilityCriteria: study?.eligibilityModule?.eligibilityCriteria ?? "",
    minimumAge: study?.eligibilityModule?.minimumAge ?? "Not specified",
    maximumAge: study?.eligibilityModule?.maximumAge ?? "Not specified",
    sex: study?.eligibilityModule?.sex ?? "ALL",
    healthyVolunteers: study?.eligibilityModule?.healthyVolunteers ?? false,
    locationCount: (study?.contactsLocationsModule?.locations ?? []).length,
    locationsList: (study?.contactsLocationsModule?.locations ?? [])
      .slice(0, 10)
      .map(
        (l: any) =>
          `- ${l?.facility ?? ""}, ${l?.city ?? ""}, ${l?.state ?? ""}, ${l?.country ?? ""}`
      )
      .join("\n"),
    pubmedSummary: extras.pubmedSummary || "No related research summary available.",
    openFdaSummary: extras.openFdaSummary || "No OpenFDA drug data available.",
  };

  return USER_TEMPLATE.replace(/{(\w+)}/g, (_, k) => String(fields[k] ?? ""));
}

export function getPrimaryDrugName(study: any): string | null {
  const interventions = study?.armsInterventionsModule?.interventions ?? [];
  const drug = interventions.find((i: any) =>
    String(i?.type ?? "").toUpperCase().includes("DRUG")
  );
  return drug?.name ?? interventions[0]?.name ?? null;
}

export function getPrimaryCondition(study: any): string | null {
  const conds = study?.conditionsModule?.conditions ?? [];
  return conds[0] ?? null;
}
