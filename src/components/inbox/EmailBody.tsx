import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Renders email HTML inside a sandboxed iframe so remote/inline images,
 * tables and inline styles display the way the sender intended.
 */
const EmailBody = ({ html, text }: { html?: string; text?: string }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!html) return;
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      setHeight(Math.max(doc.body.scrollHeight + 32, 200));
    };
    frame.addEventListener("load", measure);
    const t = window.setInterval(measure, 500);
    const stop = window.setTimeout(() => window.clearInterval(t), 4000);
    return () => {
      frame.removeEventListener("load", measure);
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, [html]);

  if (!html) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
        {text || "—"}
      </pre>
    );
  }

  const srcDoc = `<!doctype html><html><head><base target="_blank">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:transparent;
    color:${isDark ? "#e6e6e6" : "#1c1c1c"};
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
    font-size:14px;line-height:1.6;word-break:break-word;}
  img{max-width:100%;height:auto;}
  table{max-width:100%!important;}
  a{color:${isDark ? "#8ab4f8" : "#1a56db"};}
  blockquote{margin:0 0 0 12px;padding-left:12px;border-left:2px solid ${isDark ? "#3a3a3a" : "#e0e0e0"};}
</style></head><body>${html}</body></html>`;

  return (
    <iframe
      ref={frameRef}
      title="Email content"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      className="w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
};

export default EmailBody;
