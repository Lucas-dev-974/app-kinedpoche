import { PageWrapper } from "../PageWrapper";
import { EditContractDialog } from "../../components/ContractDialog/EditContractDialog";
import { HeroSection } from "./HeroSection";
import { StepsSection } from "./StepsSection";
import { FeaturesSection } from "./FeaturesSection";
import { MidCtaSection } from "./MidCtaSection";
import { HomeFooter } from "./HomeFooter";
import { StickyCta } from "./StickyCta";

export function Home() {
  return (
    <PageWrapper wide>
      <HeroSection />
      <StepsSection />
      <FeaturesSection />
      <MidCtaSection />
      <HomeFooter />
      <StickyCta />

      {/* Instance montée en permanence pour que openDialogTool(editContract)
          fonctionne : le bouton déclencheur d'origine est remplacé par les
          CTAs de la page (hero / midcard / sticky). */}
      <EditContractDialog hideTriggerButton />
    </PageWrapper>
  );
}

