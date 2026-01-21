import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to reclaim your <span className="text-gradient">freedom?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of founders who've stopped juggling tools and started scaling smarter. Your 14-day free trial awaits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="hero" size="xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Talk to Sales
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Cancel anytime • Full access to all apps
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
