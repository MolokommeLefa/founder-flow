const Footer = () => {
  return (
    <footer className="py-12 bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-foreground">FounderOS</span>
          </div>

          <nav className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2024 FounderOS. Built for founders, by founders.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
