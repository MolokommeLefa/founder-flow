import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type PolarPrice = { amount_type: string; price_amount?: number; price_currency?: string };
type PolarProduct = {
  id: string;
  name: string;
  description: string | null;
  recurring_interval: string | null;
  prices: PolarPrice[];
  benefits: { id: string; description: string }[];
};

const formatPrice = (p?: PolarPrice) => {
  if (!p || p.amount_type !== "fixed" || p.price_amount == null) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (p.price_currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 0,
  }).format(p.price_amount / 100);
};

const Pricing = () => {
  const [products, setProducts] = useState<PolarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const checkoutId = params.get("checkout_id");

  useEffect(() => {
    supabase.functions
      .invoke("polar", { body: { action: "products" } })
      .then(({ data, error }) => {
        if (error) throw error;
        setProducts(data?.items ?? []);
      })
      .catch(() => toast.error("Could not load plans"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!checkoutId) return;
    supabase.functions
      .invoke("polar", { body: { action: "verify", checkout_id: checkoutId } })
      .then(({ data, error }) => {
        if (error || !data) return;
        if (data.status === "succeeded" || data.status === "confirmed") {
          toast.success("Subscription active — welcome aboard!");
        } else if (data.status === "expired" || data.status === "failed") {
          toast.error("Checkout was not completed.");
        }
      })
      .finally(() => {
        params.delete("checkout_id");
        setParams(params, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId]);

  const startCheckout = async (productId: string) => {
    setBusyId(productId);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error("Please sign in first");
      setBusyId(null);
      return;
    }
    const { data, error } = await supabase.functions.invoke("polar", {
      body: {
        action: "checkout",
        product_id: productId,
        success_url: `${window.location.origin}/pricing`,
      },
    });
    if (error || !data?.url) {
      toast.error("Could not start checkout");
      setBusyId(null);
      return;
    }
    window.location.href = data.url;
  };

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to workspace
        </Link>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Simple, founder-friendly pricing</h1>
          <p className="mt-3 text-muted-foreground">
            One plan, everything included. Cancel any time.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {products.map((product) => {
              const price = product.prices.find((p) => p.amount_type !== "metered_unit");
              return (
                <Card
                  key={product.id}
                  className="rounded-2xl border-border/60 bg-card/60 p-8 backdrop-blur-2xl"
                >
                  <h2 className="text-xl font-medium">{product.name}</h2>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">{formatPrice(price)}</span>
                    {product.recurring_interval && (
                      <span className="text-muted-foreground">/{product.recurring_interval}</span>
                    )}
                  </div>
                  {product.description && (
                    <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
                  )}
                  {product.benefits.length > 0 && (
                    <ul className="mt-6 space-y-2">
                      {product.benefits.map((b) => (
                        <li key={b.id} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {b.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="mt-8 w-full rounded-xl"
                    onClick={() => startCheckout(product.id)}
                    disabled={busyId === product.id}
                  >
                    {busyId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Pricing;
