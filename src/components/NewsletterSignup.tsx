import * as React from "react";
import { z } from "zod";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

type Status = "idle" | "loading" | "success" | "error";

const NewsletterSignup = ({ className = "" }: { className?: string }) => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
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

    // Keep a local copy of the subscriber
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data });

    if (insertError && insertError.code !== "23505") {
      setStatus("error");
      setError("Something went wrong. Please try again.");
      return;
    }

    // Send the subscriber to beehiiv
    const { data, error: fnError } = await supabase.functions.invoke("beehiiv/subscribe", {
      body: { email: parsed.data },
    });

    if (fnError || (data as { error?: string } | null)?.error) {
      setStatus("error");
      setError("We saved your email but couldn't confirm the signup. Please try again shortly.");
      return;
    }

    setStatus("success");
  };

  return (
    <div className={className}>
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
        <>
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
          {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            No spam, ever. Unsubscribe anytime.
          </p>
        </>
      )}
    </div>
  );
};

export default NewsletterSignup;
