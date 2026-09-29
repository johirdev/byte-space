import type { Metadata } from "next";
import DiscoverPassion from "@/Components/Frontend/Pages/Home/DiscoverPassion/DiscoverPassion";
import { DiverseLearningPath } from "@/Components/Frontend/Pages/Home/DiverseLearningPath/DiverseLearningPath";
import Faq from "@/Components/Frontend/Pages/Home/Faq/Faq";
import HeroSection from "@/Components/Frontend/Pages/Home/HeroSection/HeroSection";
import { ProfessionalGrowth } from "@/Components/Frontend/Pages/Home/ProfessionalGrowth/ProfessionalGrowth";
import Testimonials from "@/Components/Frontend/Pages/Home/Testimonials/Testimonials";
import TrustedBrand from "@/Components/Frontend/Pages/Home/TrustedBrand/TrustedBrand";
import UnlockPotential from "@/Components/Frontend/Pages/Home/UnlockPotential/UnlockPotential";
import JsonLd from "@/Components/Shared/JsonLd";
import { SITE, SITE_CONTACT, absoluteUrl } from "@/config/site";

export const metadata: Metadata = {
  // Absolute so the home page keeps the full brand title instead of the template.
  title: { absolute: SITE.title },
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": absoluteUrl("/#organization"),
      name: SITE.name,
      url: SITE.url,
      logo: absoluteUrl("/logo.png"),
      description: SITE.description,
      email: SITE_CONTACT.email,
      // Add real profile URLs here (sameAs) once the social accounts exist.
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: SITE.name,
      url: SITE.url,
      inLanguage: "en",
      publisher: { "@id": absoluteUrl("/#organization") },
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/courses")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function Home() {
  return (
    <main>
      <JsonLd data={structuredData} />
      <HeroSection />
      <TrustedBrand />
      <DiscoverPassion />
      <DiverseLearningPath />
      <ProfessionalGrowth />
      <UnlockPotential />
      <Testimonials />
      <Faq />
    </main>
  );
}
