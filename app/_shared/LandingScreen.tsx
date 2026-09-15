import { CharityImpact } from "@/components/landing/CharityImpact"
import { CharitySpotlight } from "@/components/landing/CharitySpotlight"
import { BenefitsSection } from "@/components/landing/BenefitsSection"
import { DashboardPreview } from "@/components/landing/DashboardPreview"
import { PricingSection } from "@/components/landing/PricingSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { HeroSection } from "@/components/landing/HeroSection"
import { ImpactStrip } from "@/components/landing/ImpactStrip"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { ScoreExperience } from "@/components/landing/ScoreExperience"
import { DrawSection } from "@/components/landing/DrawSection"

export default function LandingScreen() {
  return (
    <main className="flex-1 w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Impact / Trust Strip */}
      <ImpactStrip />

      {/* 3. How ScoreKind Works */}
      <HowItWorks />

      {/* 4. Score Experience (Rolling 5-Score System) */}
      <ScoreExperience />

      {/* 5. Monthly Draw Mechanics (3 Tiers & Rollovers) */}
      <DrawSection />

      {/* 6. Charitable Impact Core */}
      <CharityImpact />

      {/* 7. Charity Spotlight */}
      <CharitySpotlight />

      {/* 8. Benefits & Why ScoreKind */}
      <BenefitsSection />

      {/* 9. Product Dashboard Preview */}
      <DashboardPreview />

      {/* 10. Membership & Transparent Pricing */}
      <PricingSection />

      {/* 11. Frequently Asked Questions */}
      <FAQSection />

      {/* 12. Final High-Impact CTA */}
      <FinalCTA />
    </main>
  )
}