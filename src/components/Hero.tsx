import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="min-h-screen gradient-hero flex items-center justify-center pt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-secondary-foreground">Built for freedom-first founders</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Your entire business.
            <br />
            <span className="text-gradient">One seamless system.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Scale without sacrificing your time. FounderOS brings together everything you need—from tasks to finances to team—in an ecosystem designed for founders who value freedom.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-16 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by 2,000+ founders worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              {['Forbes', 'TechCrunch', 'Wired', 'Inc.'].map((brand) => (
                <span key={brand} className="text-lg font-semibold text-muted-foreground">{brand}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
