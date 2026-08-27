import type { Metadata } from "next";
import { CompetitorApplyShell } from "@/components/CompetitorApplyShell";
import { MichiganCompetitorApply } from "@/components/MichiganCompetitorApply";
import { config } from "@/data/states/michigan";

export const metadata: Metadata = {
  title: "Apply for a Michigan fishing license",
  description:
    "Apply for a Michigan fishing license with ReelPermit — we purchase it for you from the official MDNR eLicense portal.",
};

export default function ApplyPage() {
  return (
    <CompetitorApplyShell
      slug="michigan"
      Wizard={MichiganCompetitorApply}
      advisorsSubtitle
      config={config}
    />
  );
}
