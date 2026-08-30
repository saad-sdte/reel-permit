import type { Metadata } from "next";
import { CompetitorApplyShell } from "@/components/CompetitorApplyShell";
import { PennsylvaniaCompetitorApply } from "@/components/PennsylvaniaCompetitorApply";
import { config } from "@/data/states/pennsylvania";
import { publicConfig } from "@/lib/state-config";

export const metadata: Metadata = {
  title: "Apply for a Pennsylvania fishing license",
  description:
    "Apply for a Pennsylvania fishing license with ReelPermit — we purchase it for you from the official HuntFishPA portal.",
};

export default function PennsylvaniaPage() {
  return (
    <CompetitorApplyShell
      slug="pennsylvania"
      Wizard={PennsylvaniaCompetitorApply}
      advisorsSubtitle
      config={publicConfig(config)}
    />
  );
}
