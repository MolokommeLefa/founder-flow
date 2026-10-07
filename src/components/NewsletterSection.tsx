import * as React from "react";
import { Mail, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NewsletterSignup from "@/components/NewsletterSignup";
import ScrollReveal from "@/components/ScrollReveal";

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

type NewsletterPost = {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  web_url: string | null;
  published_at: string | null;
};

const NewsletterSection = ({ showForm = true }: { showForm?: boolean }) => {
  const [posts, setPosts] = React.useState<NewsletterPost[]>([]);

  React.useEffect(() => {
    let active = true;
    supabase
      .from("newsletter_posts")
      .select("id,title,subtitle,excerpt,thumbnail_url,web_url,published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3)
      .then(({ data }) => {
        if (active && data) setPosts(data as NewsletterPost[]);
      });
    return () => {
      active = false;
    };
  }, []);


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

          {showForm && (
            <ScrollReveal delayMs={200} className="max-w-xl mx-auto">
              <NewsletterSignup />
            </ScrollReveal>
          )}

          {posts.length > 0 && (
            <ScrollReveal delayMs={300} className="mt-16">
              <h3 className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-6">
                Latest issues
              </h3>
              <div className="grid sm:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <a
                    key={post.id}
                    href={post.web_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="glass rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all hover:-translate-y-1 group"
                  >
                    <div className="aspect-[16/9] bg-primary/10 overflow-hidden">
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mail className="w-6 h-6 text-primary/60" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 text-left">
                      {post.published_at && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(post.published_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      <h4 className="font-semibold text-foreground leading-snug mb-1 line-clamp-2">
                        {post.title}
                      </h4>
                      {(post.excerpt ?? post.subtitle) && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.excerpt ?? post.subtitle}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
