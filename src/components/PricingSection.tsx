import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Rocket, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    icon: Sparkles,
    name: "Pro",
    price: "$19",
    cadence: "/month",
    description: "For solo founders running the whole business themselves.",
    features: [
      "All core apps: Tasks, Calendar, Projects",
      "Analytics & focus tracking",
      "10 GB document storage",
      "Gmail inbox integration",
      "Email support",
    ],
    cta: "Start with Pro",
    highlighted: false,
  },
  {
    icon: Rocket,
    name: "Max",
    price: "$49",
    cadence: "/month",
    description: "For small teams that need automations and deeper collaboration.",
    features: [
      "Everything in Pro",
      "Unlimited automations & workflows",
      "Team inbox and shared documents",
      "100 GB storage + version history",
      "Agent (MCP) integrations",
      "Priority support",
    ],
    cta: "Upgrade to Max",
    highlighted: true,
  },
  {
    icon: Building2,
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "For scaling companies with security and compliance needs.",
    features: [
      "Everything in Max",
      "SSO / SAML & advanced permissions",
      "Unlimited storage & audit logs",
      "Custom integrations and onboarding",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
    cta: "Talk to Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Pricing that scales with <span className="text-gradient">you</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free for 14 days. Move up when your team does — no contracts, cancel any time.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto items-start">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delayMs={i * 100}>
              <div
                className={cn(
                  "relative h-full rounded-3xl border p-8 backdrop-blur-2xl transition-all duration-300",
                  plan.highlighted
                    ? "border-primary/40 bg-card shadow-soft lg:scale-[1.03]"
                    : "border-border/60 bg-card/60 hover:border-border",
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/60">
                    <plan.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="font-semibold tracking-tight text-foreground">{plan.name}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">{plan.price}</span>
                  {plan.cadence && <span className="text-muted-foreground">{plan.cadence}</span>}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>

                <Button
                  className="mt-7 w-full rounded-xl"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() =>
                    plan.name === "Enterprise"
                      ? (window.location.href = "mailto:sales@founderos.app?subject=Enterprise%20plan")
                      : navigate("/pricing")
                  }
                >
                  {plan.cta}
                </Button>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
