import { Train, ShieldCheck } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card text-muted-foreground mt-auto">
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-blue-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold text-foreground">RailSecurix</span>
            <p className="text-xs text-muted-foreground">Secure Booking. Smarter Protection.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Multi-Signal Behavioral Bot Detection & Adaptive Cybersecurity</span>
        </div>

        <p className="text-xs text-muted-foreground text-center md:text-right">
          © {new Date().getFullYear()} RailSecurix. Local Cybersecurity Research Simulation.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
