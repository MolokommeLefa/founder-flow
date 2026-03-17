import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="py-12 bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-soft">
              <img alt="FounderOS logo" className="w-7 h-7 object-contain" src="/lovable-uploads/c6aad4f4-cf3a-441e-9777-37d1b4861bb8.png" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">FounderOS</span>
          </div>

          <nav className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
            <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="https://x.com/Luma_coo">Twitter</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2024 FounderOS. Built for founders, by founders.
          </p>
        </div>
      </div>
    </footer>);

};

export default Footer;