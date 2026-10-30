import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldAlert,
  Sparkles,
  Target,
  Layers,
  Milestone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Clock,
  ShieldCheck,
  Activity,
  Lock,
  Laptop,
  Server,
  Database,
  ArrowDown,
  BrainCircuit,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface SectionMeta {
  id: string;
  index: number;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}

const SECTIONS_META: SectionMeta[] = [
  {
    id: "problem-statement",
    index: 1,
    name: "Problem Statement",
    shortName: "Problem",
    icon: ShieldAlert,
    tagline: "The reservation challenge facing genuine railway passengers",
  },
  {
    id: "proposed-solution",
    index: 2,
    name: "Proposed Solution",
    shortName: "Solution",
    icon: Sparkles,
    tagline: "AI-assisted behavioral telemetry & adaptive reservation protection",
  },
  {
    id: "objectives",
    index: 3,
    name: "Objectives",
    shortName: "Objectives",
    icon: Target,
    tagline: "Concrete SMART targets for academic prototype evaluation",
  },
  {
    id: "system-architecture",
    index: 4,
    name: "System Architecture",
    shortName: "Architecture",
    icon: Layers,
    tagline: "End-to-end dataflow, telemetry capture, and subsystem design",
  },
  {
    id: "next-milestones",
    index: 5,
    name: "Next Milestones",
    shortName: "Milestones",
    icon: Milestone,
    tagline: "Key deliverables prepared for upcoming prototype demonstration",
  },
];

export const About: React.FC = () => {
  const { sectionId } = useParams<{ sectionId?: string }>();
  const navigate = useNavigate();

  // Validate or default to problem-statement
  const activeId = sectionId && SECTIONS_META.some((s) => s.id === sectionId) ? sectionId : "problem-statement";
  const currentIndex = SECTIONS_META.findIndex((s) => s.id === activeId);
  const currentSection = SECTIONS_META[currentIndex];

  const prevSection = currentIndex > 0 ? SECTIONS_META[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS_META.length - 1 ? SECTIONS_META[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full space-y-8 sm:space-y-10">
        {/* Page Top Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[#0b2144] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#f95c19]" />
            MDC Project — CSE Cybersecurity Batch 2025
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#0b2144] dark:text-white tracking-tight">
            About <span className="text-[#f95c19]">RailSecurix</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">
            AI-Secured Online Railway Reservation & Adaptive Behavioral Bot Mitigation
          </p>
        </div>

        {/* 5 Static Options Bar to Shift Across Sections */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200/90 dark:border-slate-800 sticky top-20 z-30 backdrop-blur-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
            {SECTIONS_META.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeId;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => navigate(`/about/${sec.id}`)}
                  className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-xs transition-all duration-150 cursor-pointer text-center sm:text-left ${
                    isActive
                      ? "bg-[#0b2144] text-white shadow-sm dark:bg-[#122e57] dark:border dark:border-[#1e467d]"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? "bg-white/10 text-orange-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block truncate">{sec.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Page Content Container for the Selected Section */}
        <main className="space-y-8 animate-in fade-in duration-200" key={activeId}>
          {/* Section Hero Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#f95c19] shrink-0 border border-orange-200/60 dark:border-orange-800">
                <currentSection.icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#f95c19]">
                  Section 0{currentSection.index} of 05
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0b2144] dark:text-white">
                  {currentSection.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {currentSection.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
              {prevSection && (
                <button
                  onClick={() => navigate(`/about/${prevSection.id}`)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{prevSection.shortName}</span>
                </button>
              )}
              {nextSection && (
                <button
                  onClick={() => navigate(`/about/${nextSection.id}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0b2144] hover:bg-[#122e57] text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <span>{nextSection.shortName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Problem Statement */}
          {activeId === "problem-statement" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    The Primary Challenge
                  </span>
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    During periods of high demand, railway passengers can face difficulties securing confirmed tickets. Automated booking bots and unfair reservation practices can reduce genuine passengers' chances of booking tickets. Traditional booking systems may also struggle to distinguish legitimate human activity from suspicious automated behaviour without creating unnecessary friction for real users.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-orange-500 text-white w-fit">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      High-Demand Ticket Scarcity
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      High-demand Tatkal reservation quotas open for short daily timeframes, causing extreme concurrency spikes where genuine travelers compete against programmatic scripts.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-rose-600 text-white w-fit">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Automated Scalping Bots
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Automated scripts and extension macros fill out forms in sub-second intervals and lock up available seats, starving out ordinary passengers using manual inputs.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-blue-600 text-white w-fit">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      CAPTCHA Friction Dilemma
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Conventional distorted-text and image CAPTCHAs delay genuine travelers, cause accessibility barriers, and fail against modern automated solver services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Proposed Solution */}
          {activeId === "proposed-solution" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f95c19]">
                    Core Solution Concept
                  </span>
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    RailSecurix is an AI-assisted railway booking security concept designed to support fairer and safer ticket reservations. It uses behavioural signals and risk-based analysis to help identify suspicious automated booking activity while keeping the booking experience smooth for genuine passengers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 w-fit">
                        <Activity className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Implemented
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Behavioural Bot Detection
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Continuous telemetry measuring natural keystroke flight times, mouse cursor velocity, and form dwell times rather than intrusive challenges.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                        <Layers className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Implemented
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Multi-Signal Telemetry Analysis
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Correlates spatial curvature, mouse entropy, typing cadence, and scroll hesitation into unified session vectors.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
                        <BrainCircuit className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Implemented
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Adaptive Risk-Based Protection
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Graduated policy response: Low risk sessions check out directly; elevated anomalies trigger lightweight verification step-ups.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                        <Lock className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Implemented
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Secure Online Booking
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Authentic seat locking mechanisms, temporary lock expiration timers, and authoritative transactional booking APIs.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 md:col-span-2 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Implemented
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Reduced Friction for Legitimate Users
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Valid human passengers experience zero puzzle interruptions or delays, ensuring they can reserve their seats rapidly during peak reservation openings.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Project Implementation Note:</strong> Capabilities shown as implemented reflect the local simulated railway stack (Flask API + React SPA + SQLite). Live connectivity to national production railway networks is conceptual.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Objectives */}
          {activeId === "objectives" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    SMART Project Targets
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0b2144] dark:text-white">
                    Specific, Measurable, Achievable, Relevant, and Time-bound Goals
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    The following goals serve as proposed evaluation targets for upcoming academic prototype testing:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#f95c19]">Target 1</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Proposed Target
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Behavioural Detection
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Develop and test a prototype that evaluates multiple behavioural signals to identify suspicious automated booking patterns, targeting at least <strong>85% detection precision</strong> on a documented test dataset by the next project milestone.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Precision Metric: &ge; 85%
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#f95c19]">Target 2</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Proposed Target
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Booking Experience
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Evaluate the booking interface with at least <strong>10 representative test scenarios</strong> and aim for successful completion of at least <strong>95% of valid user flows</strong> by the next testing milestone.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Success Rate: &ge; 95% (10 Scenarios)
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#f95c19]">Target 3</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Proposed Target
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Responsive Usability
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Validate the About page and primary navigation across mobile, tablet, laptop, and desktop layouts, aiming for <strong>zero critical layout defects</strong> and <strong>zero broken navigation links</strong> before the next project demonstration.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Quality: 0 Layout Breaks (320px–1920px)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: System Architecture */}
          {activeId === "system-architecture" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-8">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    High-Level Design
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0b2144] dark:text-white">
                    End-to-End Behavioral Telemetry & Execution Flow
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Labeled components illustrate the top-to-bottom and left-to-right flow from user input to ticket issuance:
                  </p>
                </div>

                {/* High-level Interactive Flow Diagram */}
                <div className="p-5 sm:p-7 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-2">
                    {/* Step 1 */}
                    <div className="w-full lg:w-1/6 p-4 rounded-xl bg-[#0b2144] text-white text-center shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Step 1</span>
                      <span className="font-extrabold text-xs sm:text-sm">User</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">Traveler / Browser</span>
                      <span className="mt-2 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        Implemented
                      </span>
                    </div>

                    <div className="text-orange-500 flex items-center justify-center py-1 lg:py-0">
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                    </div>

                    {/* Step 2 */}
                    <div className="w-full lg:w-1/6 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-[#0b2144] dark:text-sky-300 tracking-wider">Step 2</span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">RailSecurix Frontend</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">React SPA + UI</span>
                      <span className="mt-2 text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        Implemented
                      </span>
                    </div>

                    <div className="text-orange-500 flex items-center justify-center py-1 lg:py-0">
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                    </div>

                    {/* Step 3 */}
                    <div className="w-full lg:w-1/6 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-[#0b2144] dark:text-sky-300 tracking-wider">Step 3</span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Behavioural Signals</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Timing & Trajectory</span>
                      <span className="mt-2 text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        Implemented
                      </span>
                    </div>

                    <div className="text-orange-500 flex items-center justify-center py-1 lg:py-0">
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                    </div>

                    {/* Step 4 */}
                    <div className="w-full lg:w-1/6 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-[#0b2144] dark:text-sky-300 tracking-wider">Step 4</span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Risk Analysis</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Behavioral Detection</span>
                      <span className="mt-2 text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        Implemented
                      </span>
                    </div>

                    <div className="text-orange-500 flex items-center justify-center py-1 lg:py-0">
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                    </div>

                    {/* Step 5 */}
                    <div className="w-full lg:w-1/6 p-4 rounded-xl bg-[#0b2144] text-white text-center shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Step 5</span>
                      <span className="font-extrabold text-xs sm:text-sm">Booking Decision</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">Direct Confirm / Step-up</span>
                      <span className="mt-2 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        Implemented
                      </span>
                    </div>
                  </div>

                  {/* Supporting Subsystem Grid */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#0b2144] dark:text-slate-200">
                        <Server className="w-4 h-4 text-blue-500" /> Flask REST Backend
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Central session routing, OTP email dispatcher, risk-score endpoints, and ticket creation.
                      </p>
                      <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded mt-1">
                        Implemented
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#0b2144] dark:text-slate-200">
                        <Database className="w-4 h-4 text-indigo-500" /> SQLite Persistence Engine
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Persistent tables for users, stations, train schedules, temporary seat locks, and booking logs.
                      </p>
                      <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded mt-1">
                        Implemented
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-amber-300 dark:border-amber-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-400">
                        <ExternalLink className="w-4 h-4" /> Live IRCTC Production Gateway
                      </div>
                      <p className="text-[11px] text-slate-500">
                        National Indian Railways ticketing APIs, PRS payment gateways, and hardware security modules.
                      </p>
                      <span className="inline-block text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded mt-1">
                        Planned Scope
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Next Milestones */}
          {activeId === "next-milestones" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Roadmap & Deliverables
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0b2144] dark:text-white">
                    Deliverables Prepared for the Next Project Milestone
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Exactly 2 concrete milestone targets prioritized for academic demonstration:
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Milestone 1: Workflow Validation
                      </span>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        Complete integration and validation of the behavioural detection and risk-analysis workflow against the capabilities currently implemented in the project.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#f95c19] shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#f95c19] block">
                        Milestone 2: UI & Prototype Testing
                      </span>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        Conduct responsive UI, navigation, and functional testing, then document the results and prepare the prototype for the next MDC demonstration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Quick Section Shift Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
            >
              &larr; Back to Train Reservation
            </Link>

            <div className="flex items-center gap-2">
              {prevSection && (
                <button
                  type="button"
                  onClick={() => navigate(`/about/${prevSection.id}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: {prevSection.name}</span>
                </button>
              )}
              {nextSection && (
                <button
                  type="button"
                  onClick={() => navigate(`/about/${nextSection.id}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0b2144] hover:bg-[#122e57] text-white flex items-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <span>Next: {nextSection.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default About;
