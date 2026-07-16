import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; client_name?: string; redirect_uris?: string[] };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
const oauthApi = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        setLoading(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error } = await oauthApi.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauthApi.approveAuthorization(authorizationId)
      : await oauthApi.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an app";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-2xl p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Connect {clientName} to FounderOS
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {clientName} will be able to call FounderOS tools while you are signed in.
              This does not bypass FounderOS's permissions or backend policies.
            </p>

            <div className="rounded-lg border border-border/60 bg-background/40 p-4 mb-6 space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Requested access</div>
              {scopes.length > 0 ? (
                <ul className="text-sm text-foreground/90 space-y-1">
                  {scopes.map((s) => (
                    <li key={s}>• {s === "openid" || s === "email" || s === "profile" ? `Share your ${s === "openid" ? "basic profile" : s}` : `Additional permission: ${s}`}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/90">Access to your FounderOS tools as you.</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                Cancel connection
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthConsent;
