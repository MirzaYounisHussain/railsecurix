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
  ArrowDown,
  BrainCircuit,
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
    tagline: "Behavioural classification, bot benchmarking & adaptive protection",
  },
  {
    id: "objectives",
    index: 3,
    name: "Objectives",
    shortName: "Objectives",
    icon: Target,
    tagline: "Core research & evaluation objectives for bot vs. human separation",
  },
  {
    id: "system-architecture",
    index: 4,
    name: "System Architecture",
    shortName: "Architecture",
    icon: Layers,
    tagline: "End-to-end dataflow, current implementation & pending detection layers",
  },
  {
    id: "next-milestones",
    index: 5,
    name: "Next Milestones",
    shortName: "Milestones",
    icon: Milestone,
    tagline: "Upcoming roadmap from bot simulation to AI model integration",
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
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#0b2144] dark:text-white">
                    Automated Ticket Scalping vs. Genuine Railway Passengers
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    Ticket and travel booking sites are often flooded by automated programs (bots) that grab seats within seconds, hoard them, or resell them at a markup. Genuine customers then find everything sold out. The usual defences, such as CAPTCHAs and IP blocklists, annoy real users, and modern bots can often get past them anyway. A bot can look like a normal visitor on paper, but it rarely behaves like one. The way it moves the mouse, types, and rushes through pages gives it away.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-orange-500 text-white w-fit">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Instant Seat Hoarding
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Automated bots flood booking portals the moment reservations open, grabbing seats in seconds to hoard or resell them while genuine passengers find everything sold out.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-rose-600 text-white w-fit">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Flawed Traditional Defences
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Conventional defences such as CAPTCHAs and IP blocklists frustrate and slow down real travelers, while modern bots routinely bypass them.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-blue-600 text-white w-fit">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Behavioural Signatures
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      While a bot can appear identical to a normal visitor on paper, the way it moves the mouse, types, and rushes through booking pages exposes its automated nature.
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
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#0b2144] dark:text-white">
                    Passive Behavioural Intelligence & Adaptive Ticket Protection
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    RailSecurix replaces intrusive CAPTCHAs with silent, real-time behavioural analysis. Instead of forcing every passenger to solve puzzles, the platform observes how a user interacts with the booking flow—how they move the mouse, type passenger details, and navigate between steps—to distinguish genuine travellers from automated booking scripts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 w-fit block">
                      <Activity className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Silent Interaction Telemetry
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Passively captures fine-grained interaction signals in the background—including mouse path curvature, velocity jitter, keystroke flight times, and page dwell times—without interrupting the user.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit block">
                      <BrainCircuit className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Session-Level ML Risk Scoring
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Aggregates behavioural features across the entire booking session into a machine learning classifier that computes a continuous bot-probability risk score before seat confirmation.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit block">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Graduated Adaptive Defence
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Applies proportional security based on risk: genuine human sessions book directly with zero friction, ambiguous sessions receive a lightweight verification challenge, and high-confidence bots are blocked.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit block">
                      <Lock className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Fair Seat Reservation Locking
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Prevents automated inventory hoarding by pairing authoritative seat locks and expiration timers with behavioural verification prior to final ticket issuance.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5 md:col-span-2 lg:col-span-2">
                    <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit block">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Zero-Friction Experience for Real Passengers
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Because human travellers naturally exhibit organic cursor movement and typing rhythms, legitimate customers complete their railway bookings smoothly without solving distorted text or image CAPTCHAs.
                    </p>
                  </div>
                </div>

                {/* Project Status Roadmap inside Proposed Solution */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Project Status &amp; Execution Roadmap
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-[#0b2144] dark:text-white">
                      Where We Are Right Now &amp; What Comes Next
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Stage 01 &bull; Current State
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Completed
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Frontend &amp; Booking Website
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        We have designed and built the complete railway reservation website featuring station autocomplete, dynamic journey dates, class filtering, fare sorting, and passenger checkout.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/25 border border-orange-200 dark:border-orange-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#f95c19]">
                          Stage 02 &bull; Next Step
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                          Up Next
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Automated Bot Script
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Next, we will build automated scripts that attack our booking portal—ranging from fast form-filling bots to scripts that mimic human mouse paths and typing delays.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Stage 03 &bull; Final Step
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0b2144] text-white">
                          Planned
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        AI Bot Detection System
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Finally, we will train the behavioural machine learning classifier on the collected interaction data and integrate real-time risk scoring into the booking flow.
                      </p>
                    </div>
                  </div>
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
                    Specific Project Targets
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#0b2144] dark:text-white">
                    Measurable Research &amp; Evaluation Objectives
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Each objective defines a specific experimental target, evaluation method, and success metric for separating automated ticket scalpers from real passengers:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-orange-500 text-white w-fit">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#f95c19]">
                          Objective 01
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Session-Level Classifier Accuracy on Held-Out Data
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Measure how accurately interaction behaviour separates bots from real passengers by training a session-level ML classifier (using cursor speed, path curvature, keystroke intervals, and page dwell time) and reporting both the <strong>bot detection rate (TPR)</strong> and <strong>human false-positive rate (FPR)</strong> strictly on held-out sessions so no session appears in both training and testing.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Target Metric: Bot Detection Rate (TPR) vs. Human FPR on Disjoint Sessions
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-600 text-white w-fit">
                          <Bot className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Objective 02
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Multi-Bot Evasion Benchmarking &amp; Signal Ablation
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Test resilience against progressively smarter bots—from a basic instant autofill script to an advanced bot that imitates human Bezier mouse curves and randomized typing delays. Benchmark the ML classifier against a simple completion-speed threshold rule, and run a <strong>feature ablation study</strong> removing one signal group at a time (mouse, keyboard, timing) to rank feature importance.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Target Metric: ML vs. Speed Rule + Feature Contribution Ranking
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-emerald-600 text-white w-fit">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Objective 03
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        Bot Booking Reduction vs. Passenger Friction Rate
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Quantify how effectively adaptive risk-based protection prevents seat hoarding with minimal human annoyance. Compare the percentage of <strong>successful bot ticket bookings</strong> on the protected portal against the unprotected baseline portal, and measure the exact percentage of genuine human travellers who get challenged or blocked.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
                      Target Metric: Bot Booking Drop (%) &amp; Human Challenge/Block Rate (%)
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
                {/* Header & Legend */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#f95c19]">
                      Visual System Flowchart
                    </span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#0b2144] dark:text-white">
                      End-to-End Architecture &amp; Dataflow Diagram
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Pending
                    </span>
                  </div>
                </div>

                {/* FLOWCHART 1: COMPLETED BOOKING, DATABASE & RAILRADAR CACHE FLOW */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0b2144] dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      1. Completed Frontend, Database &amp; RailRadar API Cache Flow
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      Completed &amp; Active
                    </span>
                  </div>

                  {/* Horizontal Flowchart Row */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                    {/* Node 1: React Frontend */}
                    <div className="flex-1 p-4 rounded-xl bg-[#0b2144] text-white text-center space-y-1.5 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                        React 18 + TS + Vite
                      </span>
                      <div className="font-extrabold text-sm">Frontend UI</div>
                      <div className="flex flex-wrap justify-center gap-1 pt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Station Search</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">IST Date Bar</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Filter &amp; Sort</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Email OTP</span>
                      </div>
                    </div>

                    {/* Arrow 1 */}
                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">REST JSON</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <span className="text-[9px] font-mono text-slate-400">/api/trains/search</span>
                    </div>

                    {/* Node 2: Flask Backend */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/70 text-center space-y-1.5 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Python Flask API
                      </span>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">Backend Controller</div>
                      <div className="flex flex-wrap justify-center gap-1 pt-1 text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">run_days Filter</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">5m Seat Lock</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">PNR &amp; PDF</span>
                      </div>
                    </div>

                    {/* Arrow 2 */}
                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600">Cache Hit</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <span className="text-[9px] font-mono text-slate-400">0 API Calls</span>
                    </div>

                    {/* Node 3: SQLite Database */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/70 text-center space-y-1.5 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        SQLite3 Local DB
                      </span>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">railsecurix.db</div>
                      <div className="flex flex-wrap justify-center gap-1 pt-1 text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">route_cache</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">trains &amp; stations</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">users &amp; bookings</span>
                      </div>
                    </div>

                    {/* Arrow 3 */}
                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-[#f95c19]">Cache Miss</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                      <span className="text-[9px] font-mono text-slate-400">Once / 7 Days</span>
                    </div>

                    {/* Node 4: RailRadar API */}
                    <div className="flex-1 p-4 rounded-xl bg-[#0b2144] text-white text-center space-y-1.5 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                        External API (.env)
                      </span>
                      <div className="font-extrabold text-sm">RailRadar API</div>
                      <div className="flex flex-wrap justify-center gap-1 pt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">RAILRADAR_API_KEY</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Weekly Sync</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FLOWCHART 2: NEXT STAGE — AUTOMATED BOT SCRIPT FLOW */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0b2144] dark:text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#f95c19]" />
                      2. Next Stage: Automated Bot Script Flow (How Bots Will Be Built)
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Pending &bull; Stage 2
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                    {/* Bot Engine */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-400 dark:border-amber-700 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f95c19] block">
                        Python Automation
                      </span>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Playwright / Selenium
                      </div>
                      <span className="text-[11px] text-slate-500 block">Launches headless browser sessions</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">Simulates</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                    </div>

                    {/* Bot Tier 1 & Tier 2 */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-400 dark:border-amber-700 text-center space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                        2 Bot Attack Tiers
                      </span>
                      <div className="flex flex-col sm:flex-row justify-center gap-1.5 text-[11px] font-bold">
                        <span className="bg-orange-50 dark:bg-orange-950/40 text-[#f95c19] border border-orange-200 dark:border-orange-800 px-2.5 py-1 rounded-lg">
                          Tier 1: Fast Autofill (&lt;2s)
                        </span>
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg">
                          Tier 2: Human-Mimicking
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">Attacks</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                    </div>

                    {/* Target Booking Flow */}
                    <div className="flex-1 p-4 rounded-xl bg-[#0b2144] text-white text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                        Target Portal
                      </span>
                      <div className="font-extrabold text-sm">Booking Checkout Flow</div>
                      <span className="text-[10px] text-slate-300 font-mono block">
                        /search &rarr; /passenger &rarr; /payment
                      </span>
                    </div>
                  </div>
                </div>

                {/* FLOWCHART 3: FINAL STAGE — AI BOT DETECTION & GATEKEEPER OVER USER */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0b2144] dark:text-white flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-blue-600" />
                      3. Final Stage: AI Bot Detection &amp; How It Is Called Over the User
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Pending &bull; Stage 3
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                    {/* Step 1: JS Listeners */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-400 dark:border-amber-700 text-center space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Browser Sensor
                      </span>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">JS Event Listeners</div>
                      <div className="flex flex-wrap justify-center gap-1">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Mouse Curve</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Key Timing</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Dwell Speed</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">On &ldquo;Book&rdquo; Click</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                    </div>

                    {/* Step 2: ML Classifier */}
                    <div className="flex-1 p-4 rounded-xl bg-[#0b2144] text-white text-center space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                        Scikit-Learn Model
                      </span>
                      <div className="font-extrabold text-sm">Session ML Classifier</div>
                      <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded inline-block font-mono">
                        Outputs Risk Score P(bot)
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-1 py-1 text-[#f95c19] shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">Gatekeeper</span>
                      <ArrowRight className="w-5 h-5 hidden lg:block" />
                      <ArrowDown className="w-5 h-5 lg:hidden" />
                    </div>

                    {/* Step 3: 3 Branching Decisions Over User */}
                    <div className="flex-1 grid grid-cols-1 gap-2">
                      <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300">Low (&lt;0.35)</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">&rarr; Direct Booking</span>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-amber-800 dark:text-amber-300">Med (0.35–0.70)</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">&rarr; Challenge Modal</span>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-rose-800 dark:text-rose-300">High (&ge;0.70)</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">&rarr; Block Bot (403)</span>
                      </div>
                    </div>
                  </div>

                  {/* Concise Explanation of the 3 Gatekeeper Risk Outcomes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block">
                        1. Low Risk (&lt; 0.35) &mdash; Direct Booking
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Normal human interaction. <strong>No pop-up appears at all</strong>&mdash;the passenger walks straight through and books their ticket immediately with zero delay.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 block">
                        2. Med Risk (0.35–0.70) &mdash; Challenge Modal
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        If the AI is unsure (e.g., a fast human using autofill), a small <strong>pop-up window (Challenge Modal)</strong> asks for a quick 2-second confirmation&mdash;acting as a safety net so real people are never wrongly blocked while scripts get stuck.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 space-y-1">
                      <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400 block">
                        3. High Risk (&ge; 0.70) &mdash; Block Bot (403)
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Definite automated bot behaviour. The system blocks the request immediately (<code>403 Forbidden</code>) without showing a pop-up and prevents seat hoarding.
                      </p>
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
                    Project Milestones & Current Progress
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    At the current stage, we have built the railway booking website. The automated bot simulation scripts and AI-based bot detection system are queued across the next three milestones:
                  </p>
                </div>

                {/* Current Completed Foundation */}
                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Current Stage: Railway Booking Website
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                      Designed and implemented the complete railway ticket booking website with dynamic train search, date navigation, filtering, sorting, seat reservation, and user authentication.
                    </p>
                  </div>
                </div>

                {/* 3 Pending Milestones */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#f95c19] shrink-0 mt-0.5">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#f95c19]">
                          Milestone 1: Automated Bot Simulation
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        Develop automation scripts to simulate railway ticket booking activities, replicating bot-like behaviour on the existing booking website.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Milestone 2: Behavioural Data Collection
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        Collect and analyse interaction data from both genuine human users and automated scripts to identify differences in their behavioural patterns.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Milestone 3: AI-Based Bot Detection & Integration
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        Develop a machine learning model to detect automated activity, assign risk scores and integrate the detection system into the booking website.
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
