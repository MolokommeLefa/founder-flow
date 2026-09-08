import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              This is a placeholder terms of service. Please replace this text with your company's actual terms before publishing.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">1. Acceptance of terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By accessing or using FounderOS, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">2. Use of services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">3. Accounts and security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">4. Limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To the fullest extent permitted by law, FounderOS shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">5. Changes to terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the services after changes constitutes acceptance of the revised terms.
            </p>
          </div>
        </div>
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Terms;
