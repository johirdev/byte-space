import DiscoverPassion from "@/Components/Frontend/Pages/Home/DiscoverPassion/DiscoverPassion";
import { DiverseLearningPath } from "@/Components/Frontend/Pages/Home/DiverseLearningPath/DiverseLearningPath";
import Faq from "@/Components/Frontend/Pages/Home/Faq/Faq";
import HeroSection from "@/Components/Frontend/Pages/Home/HeroSection/HeroSection";
import { ProfessionalGrowth } from "@/Components/Frontend/Pages/Home/ProfessionalGrowth/ProfessionalGrowth";
import Testimonials from "@/Components/Frontend/Pages/Home/Testimonials/Testimonials";
import TrustedBrand from "@/Components/Frontend/Pages/Home/TrustedBrand/TrustedBrand";
import UnlockPotential from "@/Components/Frontend/Pages/Home/UnlockPotential/UnlockPotential";

export default function Home() {
  return (
    <main>
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
