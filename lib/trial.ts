import { USER_TEMPLATE } from "./prompts";

export function buildUserMessage(study: any, nctId: string): string {
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
      .map((l: any) => `- ${l?.facility ?? ""}, ${l?.city ?? ""}, ${l?.state ?? ""}, ${l?.country ?? ""}`)
      .join("\n"),
  };

  return USER_TEMPLATE.replace(/{(\w+)}/g, (_, k) => String(fields[k] ?? ""));
}
