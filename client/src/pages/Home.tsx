import SearchForm from "@/components/SearchForm";
import { Link, useNavigate } from "react-router-dom";
import {
  Train, Shield, Clock, ShieldCheck, Activity, Cpu, CheckCircle2,
  ArrowRight, Lock, Zap, FileText, Layers, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Activity,
    title: "Multi-Signal Telemetry",
    desc: "Passive biometric capture of keystroke flight times, cursor kinematics, and form dwell patterns.",
    badge: "Biometrics"
  },
  {
    icon: Cpu,
    title: "AI-Powered Bot Classifier",
    desc: "Random Forest engine with session-level data partitioning to prevent data leakage.",
    badge: "Machine Learning"
  },
  {
    icon: ShieldCheck,
    title: "0–100 Explainable Risk Engine",
    desc: "Real-time threat calibration with transparent feature-level attribution of anomalies.",
    badge: "Explainable AI"
  },
  {
    icon: Lock,
    title: "Graduated Adaptive Security",
    desc: "Tiered defenses (Allow -> Verify -> Rate-Limit) preventing legitimate traveler lockouts.",
    badge: "Zero-Trust"
  },
];

const researchMetrics = [
  { value: "96.7%", label: "Detection Accuracy", detail: "Evaluated on held-out sessions" },
  { value: "< 2.0%", label: "False Positive Rate", detail: "Optimized for genuine travelers" },
  { value: "< 15 ms", label: "Inference Latency", detail: "Zero friction during Tatkal checkout" },
  { value: "100%", label: "Server-Authoritative", detail: "Fares, seats & locks verified in SQLite" },
];

const popularRoutes = [
  { no: "12951", name: "Tejas Rajdhani Express", from: "NDLS - New Delhi", to: "BCT - Mumbai Central", time: "16:55 → 08:35", duration: "15h 40m", fare: "₹1,850" },
  { no: "22436", name: "Vande Bharat Express", from: "NDLS - New Delhi", to: "BCT - Mumbai Central", time: "06:00 → 14:15", duration: "08h 15m", fare: "₹1,420" },
  { no: "12301", name: "Howrah Rajdhani Express", from: "NDLS - New Delhi", to: "HWH - Howrah", time: "16:50 → 09:55", duration: "17h 05m", fare: "₹1,920" },
  { no: "22692", name: "Bengaluru Rajdhani", from: "NDLS - New Delhi", to: "SBC - Bengaluru", time: "20:45 → 06:40", duration: "33h 55m", fare: "₹2,150" },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white pt-16 pb-28 px-4">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-6 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI-Secured Railway Ticket Reservation Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
            RailSim <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-sky-300">Express</span>
          </h1>

          <p className="text-lg md:text-xl font-medium text-slate-300 max-w-2xl mx-auto mb-2">
            Secure Booking. Smarter Protection.
          </p>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto mb-10">
            An integrated, domain-specific behavioral bot detection and adaptive defense framework for high-demand railway reservations.
          </p>

          {/* SEARCH FORM COMPONENT */}
          <div className="max-w-4xl mx-auto text-left">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* RESEARCH METRICS BAR */}
      <section className="relative z-20 -mt-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-border">
            {researchMetrics.map((m, idx) => (
              <div key={idx} className="text-center p-2">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-700 dark:text-blue-400">{m.value}</div>
                <div className="text-xs font-bold text-foreground mt-0.5">{m.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{m.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE CYBERSECURITY NOVELTY PILLARS */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Multi-Signal Behavioral Security Architecture
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Distinguishes human travelers from automated scalping bots via non-invasive client biometrics and calibrated server risk scoring.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-base text-foreground">{p.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR SCHEDULED TRAINS */}
      <section className="py-12 px-4 bg-slate-100/60 dark:bg-slate-900/40 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Scheduled Express Routes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Authoritative schedule and availability managed locally in SQLite</p>
            </div>
            <Link to="/search" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All Routes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {popularRoutes.map((r) => (
              <div key={r.no} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">#{r.no}</span>
                    <h3 className="text-sm font-bold text-foreground">{r.name}</h3>
                  </div>
                  <span className="text-xs font-extrabold text-foreground">{r.fare}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div>
                    <p className="font-semibold text-foreground">{r.from}</p>
                    <p className="text-[11px]">{r.time.split('→')[0]}</p>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-medium">{r.duration}</span>
                    <div className="w-16 h-[1px] bg-border my-1 mx-auto" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{r.to}</p>
                    <p className="text-[11px]">{r.time.split('→')[1]}</p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/search?source=${r.from.split(' - ')[0]}&destination=${r.to.split(' - ')[0]}`)}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2"
                >
                  Book on this Route
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
