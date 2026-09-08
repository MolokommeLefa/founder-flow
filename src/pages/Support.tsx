import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
import { Mail, MessageCircle, BookOpen } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Support</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Need help? Reach out and we'll get back to you as soon as possible.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <a
              href="mailto:support@example.com"
              className="glass rounded-2xl p-6 hover:shadow-card transition-shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Email us</h3>
              <p className="text-sm text-muted-foreground">support@example.com</p>
            </a>

            <div className="glass rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Community</h3>
              <p className="text-sm text-muted-foreground">Join our founder community for peer support.</p>
            </div>

            <div className="glass rounded-2xl p-6 sm:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Explore guides and FAQs to get the most out of FounderOS. Coming soon.
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              The support details above are placeholders. Please replace the email address and links with your real support channels before going live.
            </p>
          </div>
        </div>
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Support;
