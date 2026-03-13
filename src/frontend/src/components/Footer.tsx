import { Film, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer className="border-t border-border bg-card/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Film className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm">
              <span className="gradient-text">PAID</span>
              <span className="text-foreground">EDIT</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {year}. Built with{" "}
            <Heart className="inline w-3 h-3 text-primary fill-primary" /> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Professional Video Editing Service
          </p>
        </div>
      </div>
    </footer>
  );
}
