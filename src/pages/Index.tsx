import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AppsSection from "@/components/AppsSection";
import DashboardPreview from "@/components/DashboardPreview";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <AppsSection />
      <DashboardPreview />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
