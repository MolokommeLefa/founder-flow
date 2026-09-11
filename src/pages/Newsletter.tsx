import * as React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
import ScrollReveal from "@/components/ScrollReveal";
import { Mail, Send, BookOpen, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NewsletterPost = {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  web_url: string | null;
  published_at: string | null;
};

const highlights = [
  {
    icon: Send,
    title: "One thoughtful dispatch",
    description: "A concise letter in your inbox — no noise, no filler, just signal.",
  },
  {
    icon: BookOpen,
    title: "Lessons from the build",
    description: "Real decisions, trade-offs, and the craft behind shipping FounderOS.",
  },
  {
    icon: Mail,
    title: "Early access",
    description: "Subscribers hear about new apps and features before anyone else.",
  },
];

const Newsletter = () => {
  const [posts, setPosts] = React.useState<NewsletterPost[]>([]);

  React.useEffect(() => {
    let active = true;
    supabase
      .from("newsletter_posts")
      .select("id,title,subtitle,excerpt,thumbnail_url,web_url,published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(6)
      .then(({ data }) => {
        if (active && data) setPosts(data as NewsletterPost[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/3 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-secondary-foreground">Newsletter</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Letters for founders in <span className="text-gradient">pursuit of growth</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Product updates, founder insights, and stories from the craft behind FounderOS —
                shared with a community of like-minded builders chasing creative freedom.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={120} className="grid sm:grid-cols-3 gap-4 mt-12 text-left">
              {highlights.map((item) => (
                <div key={item.title} className="glass rounded-2xl p-5 shadow-soft">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Signup form */}
      <NewsletterSection />

      {/* Archive */}
      {posts.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <ScrollReveal className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">Past issues</h2>
                  <p className="text-muted-foreground mt-2">
                    Catch up on previous dispatches from the newsletter archive.
                  </p>
                </div>
              </ScrollReveal>

              {featured && (
                <ScrollReveal delayMs={80}>
                  <a
                    href={featured.web_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="glass rounded-3xl overflow-hidden shadow-soft hover:shadow-card transition-all group grid md:grid-cols-2 mb-6"
                  >
                    <div className="aspect-[16/9] md:aspect-auto bg-primary/10 overflow-hidden">
                      {featured.thumbnail_url ? (
                        <img
                          src={featured.thumbnail_url}
                          alt={featured.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mail className="w-10 h-10 text-primary/60" />
                        </div>
                      )}
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      {featured.published_at && (
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                          {new Date(featured.published_at).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      <h3 className="text-2xl font-semibold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
                        {featured.title}
                      </h3>
                      {(featured.excerpt ?? featured.subtitle) && (
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {featured.excerpt ?? featured.subtitle}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Read issue <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </a>
                </ScrollReveal>
              )}

              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((post, i) => (
                    <ScrollReveal key={post.id} delayMs={120 + i * 60}>
                      <a
                        href={post.web_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="glass rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all hover:-translate-y-1 group block h-full"
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
                        <div className="p-5">
                          {post.published_at && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(post.published_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                          <h4 className="font-semibold text-foreground leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          {(post.excerpt ?? post.subtitle) && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {post.excerpt ?? post.subtitle}
                            </p>
                          )}
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Newsletter;
