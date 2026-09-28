import DiscoverPassion from "@/Components/Frontend/Pages/Home/DiscoverPassion/DiscoverPassion";
import { DiverseLearningPath } from "@/Components/Frontend/Pages/Home/DiverseLearningPath/DiverseLearningPath";
import HeroSection from "@/Components/Frontend/Pages/Home/HeroSection/HeroSection";
import TrustedBrand from "@/Components/Frontend/Pages/Home/TrustedBrand/TrustedBrand";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <TrustedBrand />
      <DiscoverPassion />
      <DiverseLearningPath />
    </main>
  );
}
