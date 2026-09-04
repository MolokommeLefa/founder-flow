import * as React from "react";
import { z } from "zod";
import { ArrowRight, Check, Mail, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollReveal from "@/components/ScrollReveal";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const perks = [
  {
    icon: Mail,
    title: "Product updates",
    description: "Be first to know about new apps, features, and improvements.",
  },
  {
    icon: Sparkles,
    title: "Founder insights & stories",
    description: "Behind-the-scenes lessons and the craft behind building FounderOS.",
  },
  {
    icon: Users,
    title: "A community of builders",
    description: "Join like-minded founders pursuing growth and creative freedom together.",
  },
];

const NewsletterSection = () => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setStatus("loading");
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data });

    if (insertError) {
      if (insertError.code === "23505") {
        setStatus("success"); // already subscribed — treat as success
      } else {
        setStatus("error");
        setError("Something went wrong. Please try again.");
      }
      return;
    }
    setStatus("success");
  };

  return (
    <section className="py-24 bg-secondary/30 border-y border-border relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-secondary-foreground">The FounderOS Newsletter</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Join a community of <span className="text-gradient">founders in pursuit of growth</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Product updates, founder insights, and stories from the craft behind FounderOS — an
              invitation to like-minded individuals coming together to unlock creative freedom.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={100} className="grid sm:grid-cols-3 gap-4 mb-10">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="glass rounded-2xl p-5 text-left shadow-soft hover:shadow-card transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <perk.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </div>
            ))}
          </ScrollReveal>

          <ScrollReveal delayMs={200} className="max-w-xl mx-auto">
            {status === "success" ? (
              <div className="glass rounded-2xl p-6 text-center animate-scale-in">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground">You're in!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome to the community — keep an eye on your inbox for the next dispatch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1 rounded-xl"
                  aria-label="Email address"
                />
                <Button type="submit" variant="hero" size="lg" disabled={status === "loading"}>
                  {status === "loading" ? "Joining..." : "Join the community"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}
            {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
            {status !== "success" && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                No spam, ever. Unsubscribe anytime.
              </p>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
