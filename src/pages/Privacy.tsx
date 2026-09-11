import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              This is a placeholder privacy policy. Please replace this text with your company's actual privacy policy before publishing.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">1. Information we collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information you provide directly to us, such as your email address, name, and any content you create or upload while using FounderOS.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">2. How we use your information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to operate, maintain, and improve the services we provide, to communicate with you, and to personalize your experience.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">3. Sharing your information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share information with service providers who perform services on our behalf, or as required by law.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">4. Your rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have rights to access, update, or delete your personal information. Contact us to exercise these rights.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">5. Contact us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at support@example.com.
            </p>
          </div>
        </div>
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Privacy;
