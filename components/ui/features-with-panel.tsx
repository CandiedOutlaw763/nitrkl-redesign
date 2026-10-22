"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ExternalLink, ArrowRight, Pause, Play, Sparkles } from "lucide-react";

export interface FeatureItem {
  title: string;
  alt?: string;
  content: string | React.ReactNode;
  category?: string;
  description?: string;
  href?: string;
}

function FeatureMedia({
  content,
  alt,
  item,
}: {
  content: string | React.ReactNode;
  alt?: string;
  item?: FeatureItem;
}) {
  if (typeof content !== "string") {
    return <div className="w-full h-full">{content}</div>;
  }

  const isVideo = /\.(mp4|webm|ogg)$/i.test(content);
  const isImage =
    /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(content) ||
    /unsplash|images\./i.test(content);

  if (isVideo) {
    return (
      <div className="relative w-full h-full group">
        <video
          src={content}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        {item?.href && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end opacity-95 transition-opacity">
            {item.category && (
              <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 mb-2 text-xs font-semibold rounded-full bg-[#771D1D] text-white">
                <Sparkles className="w-3 h-3 text-[#FAAAAA]" />
                {item.category}
              </span>
            )}
            <p className="text-white text-xs md:text-sm line-clamp-3 mb-3 text-zinc-200">
              {item.description}
            </p>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-lg w-fit transition-colors"
            >
              Know More <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="relative w-full h-full group overflow-hidden bg-zinc-950">
        <img
          src={content}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            // High-reliability Unsplash fallback if local path is unavailable in standalone Vite preview
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 md:p-8 flex flex-col justify-end z-10">
          {item?.category && (
            <span className="inline-flex items-center gap-1.5 self-start px-4 py-1 mb-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#771D1D] to-[#991B1B] [clip-path:polygon(12px_0%,100%_0%,calc(100%-12px)_100%,0%_100%)] border-l-[3px] border-[#DA8956] shadow-lg">
              <Sparkles className="w-3 h-3 text-[#DA8956]" />
              {item.category}
            </span>
          )}
          {item?.description && (
            <p className="text-xs md:text-sm line-clamp-3 mb-4 text-zinc-100 leading-relaxed font-normal">
              {item.description}
            </p>
          )}
          {item?.href && (
            <div className="flex items-center gap-4">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-white/20 hover:bg-[#771D1D] border border-white/30 hover:border-[#DA8956] backdrop-blur-md px-4 py-2 transition-all [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
              >
                Visit Startup Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">
                FTBI &bull; TIIR NIT Rourkela
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full p-8 bg-zinc-50 dark:bg-zinc-900">
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

export const NITR_INCUBATION_ITEMS: FeatureItem[] = [
  {
    title: "Stethaim — AI-Powered Lung Health Auscultation",
    category: "HealthTech & AI Diagnostics",
    alt: "NIT Rourkela Startup on Stethaim (AI powered lung health auscultation and monitoring)",
    content: "/nitrkl/docs/Entrepreneurship/images/Stethaim.webp",
    description:
      "Respiratory diseases such as COPD, pneumonia, and asthma remain major health concerns. Stethaim is an AI-powered smart auscultation device that captures lung sounds, detects wheezes and crackles, measures respiratory rate, and provides structured clinical insights for early diagnosis.",
    href: "https://www.stethaim.com",
  },
  {
    title: "IVAPLUS — Enterprise Cloud Automation & AI",
    category: "Enterprise AI & EdTech",
    alt: "NIT Rourkela Startup on IVAPLUS AI Solutions",
    content: "/nitrkl/docs/Entrepreneurship/images/Companypic.webp",
    description:
      "IVAPLUS is a software development company specializing in building highly-scalable, cloud-ready, comprehensive AI-driven solutions with primary focus on End-to-End automation of enterprise processes. Products include XAMLY exam administration and automated learning suites.",
    href: "https://www.ivaplus.co.in/",
  },
  {
    title: "IOTA Design & Innovations — 3D Bioprinting & MedTech",
    category: "DeepTech & Biomedical R&D",
    alt: "NIT Rourkela Startup on IOTA 3D Bioprinting",
    content: "/nitrkl/docs/Entrepreneurship/images/IOTA.webp",
    description:
      "IOTA Design & Innovations Lab Pvt. Ltd. is an R&D company specializing in medical devices and 3D printing technologies. It has developed a 3D bioprinter for cell printing in biotech research, along with diagnostics for early detection of Dry Eye and Parkinson's disease.",
    href: "https://iotadesign.in/",
  },
  {
    title: "Quidle Enterprise — Sustainable Urban Green Solutions",
    category: "CleanTech & Sustainability",
    alt: "NIT Rourkela Startup on Quidle Urban Greening",
    content: "/nitrkl/docs/Entrepreneurship/images/Quidle.webp",
    description:
      "A DPIIT-recognized startup by the Government of India focused on creating sustainable urban green solutions. The company specializes in urban gardening, landscape design, vertical green walls, and innovative smart planters for homes, offices, and institutions.",
    href: "https://quidle.in/",
  },
  {
    title: "Hoardspace — Smart OOH & Digital Billboard Marketplace",
    category: "AdTech & DOOH Marketplace",
    alt: "NIT Rourkela Startup on Hoardspace AdTech",
    content: "/nitrkl/docs/Entrepreneurship/images/hoardspace.webp",
    description:
      "Founded by student entrepreneurs from NIT Rourkela, Hoardspace provides an intelligent digital marketplace for Out-of-Home (OOH) and Digital Out-of-Home (DOOH) advertising, enabling brands to discover, compare, and book billboards and digital screens across Indian cities.",
    href: "https://www.hoardspace.in/",
  },
];

export interface FeaturesWithPanelProps {
  items?: FeatureItem[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  autoPlay?: boolean;
  intervalMs?: number;
  className?: string;
}

export default function FeaturesWithPanel({
  items = NITR_INCUBATION_ITEMS,
  title = "Incubations@NITR",
  subtitle,
  kicker,
  autoPlay = true,
  intervalMs = 4500,
  className,
}: FeaturesWithPanelProps) {
  const [active, setActive] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);

  // Auto-scroll ticker: continuous regardless of mouse pointer, only paused when button is pressed
  React.useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, items.length, intervalMs]);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  return (
    <section
      className={cn(
        "relative w-full py-16 text-foreground font-sans antialiased overflow-hidden",
        "font-['Noto_Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        {/* Section Header with Futuristic Kicker & Tech Ruler */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-dashed border-[#771D1D]/25 pb-6">
          <div>
            {kicker && (
              <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-[#771D1D] uppercase mb-2 px-3 py-1 bg-[#771D1D]/8 border-l-2 border-[#771D1D] [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]">
                <span className="text-[#DA8956] font-extrabold">[</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                <span>{kicker}</span>
                <span className="text-[#DA8956] font-extrabold">]</span>
              </div>
            )}
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl flex items-center flex-wrap gap-4">
              <span>{title}</span>
              <span className="inline-flex items-center gap-1.5 h-1.5 w-32 shrink-0">
                <span className="h-full w-20 bg-[#771D1D] rounded-full [clip-path:polygon(0_0,calc(100%-5px)_0,100%_100%,0_100%)]" />
                <span className="h-full w-10 bg-[#DA8956] rounded-full [clip-path:polygon(5px_0,100%_0,calc(100%-5px)_100%,0_100%)]" />
              </span>
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Auto-scroll toggle control with crazy chamfered borders */}
            <button
              type="button"
              onClick={togglePlay}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]",
                isPlaying
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 ring-1 ring-black/10 hover:bg-zinc-900 hover:text-white"
                  : "bg-[#771D1D] text-white ring-2 ring-[#DA8956] shadow-lg shadow-[#771D1D]/30"
              )}
              title={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
              aria-label={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Auto-scroll Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Auto-scroll</span>
                </>
              )}
            </button>

            <a
              href="/Resources/FTBI/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#771D1D] hover:bg-[#771D1D] hover:text-white px-3 py-1.5 border border-[#771D1D]/20 transition-all [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Two-Column Features with Sticky Interactive Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-14 lg:items-start">
          {/* Left Column: Interactive Startup List */}
          <div>
            <ul className="flex flex-col gap-2.5">
              {items.map((item, index) => {
                const isActive = active === index;
                const formattedNum = String(index + 1).padStart(2, "0");
                return (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    onClick={() => setActive(index)}
                    className={cn(
                      "group relative flex flex-col p-4 cursor-pointer transition-all duration-250",
                      // CRAZY ASYMMETRIC CHAMFERED BORDER: No round or standard square border!
                      "[clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]",
                      isActive
                        ? "bg-gradient-to-r from-[#771D1D]/10 to-[#DA8956]/5 ring-2 ring-[#771D1D] translate-x-2 shadow-lg shadow-[#771D1D]/15"
                        : "bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ring-1 ring-black/8 dark:ring-white/10 hover:translate-x-1"
                    )}
                  >
                    <div className="flex flex-row items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* CRAZY FACETED OCTAGONAL NUMBER CHIP */}
                        <span
                          className={cn(
                            "size-8 flex items-center justify-center font-mono text-xs font-black shrink-0 transition-all duration-250",
                            "[clip-path:polygon(28%_0%,72%_0%,100%_28%,100%_72%,72%_100%,28%_100%,0%_72%,0%_28%)]",
                            isActive
                              ? "bg-gradient-to-br from-[#771D1D] to-[#B91C1C] text-white shadow-[0_0_12px_rgba(119,29,29,0.6)] ring-1 ring-[#DA8956]"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200"
                          )}
                        >
                          {formattedNum}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "block text-sm font-bold truncate transition-colors duration-200",
                              isActive
                                ? "text-[#771D1D] dark:text-[#f87171]"
                                : "text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white"
                            )}
                          >
                            {item.title}
                          </span>
                          {item.category && (
                            <span className="block font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 size-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#771D1D] border border-black/10 dark:border-white/10 transition-all [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px),0_6px)]"
                          title="Open external website"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Active Progress Bar indicator: Chamfered Telemetry Gauge */}
                    {isActive && isPlaying && (
                      <motion.div
                        className="mt-3 h-1 bg-[#771D1D]/20 overflow-hidden w-full [clip-path:polygon(4px_0,100%_0,calc(100%-4px)_100%,0_100%)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#771D1D] via-[#DA8956] to-amber-200 shadow-[0_0_8px_rgba(119,29,29,0.8)]"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: intervalMs / 1000,
                            ease: "linear",
                            repeat: 0,
                          }}
                        />
                      </motion.div>
                    )}

                    {/* Mobile inline accordion preview */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full overflow-hidden lg:hidden"
                        >
                          <div className="w-full mt-3 overflow-hidden aspect-4/3 relative shadow-xl [clip-path:polygon(0_22px,22px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-32px),calc(100%-32px)_100%,22px_100%,0_calc(100%-22px))] ring-2 ring-[#771D1D]">
                            <div className="absolute inset-0">
                              <FeatureMedia
                                content={item.content}
                                alt={item.alt}
                                item={item}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Right Column: Sticky Media Display with Crazy HUD Reticle Frame */}
          <div className="hidden lg:block sticky top-24">
            {/* Top Telemetry Data */}
            <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-widest text-[#771D1D] mb-2 px-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>TIIR-FTBI // VENTURE RADAR</span>
              </span>
              <span className="text-zinc-500">22.253°N &bull; 84.901°E [ACTIVE]</span>
            </div>

            {/* CRAZY MECHA-VIEWFINDER FRAME: Multi-chamfer cutouts with Glowing Border & Floating Corner Reticles */}
            <div className="relative p-[3px] bg-gradient-to-br from-[#771D1D] via-[#DA8956] to-[#B91C1C] [clip-path:polygon(0_28px,28px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-46px),calc(100%-46px)_100%,28px_100%,0_calc(100%-28px))] drop-shadow-[0_20px_45px_rgba(119,29,29,0.28)]">
              {/* Corner HUD Reticle Crosshairs */}
              <div className="absolute inset-[-8px] pointer-events-none z-20">
                <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#771D1D]" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#771D1D]" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#771D1D]" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#771D1D]" />
              </div>

              <div className="relative w-full aspect-4/3 overflow-hidden bg-zinc-950 [clip-path:polygon(0_26px,26px_0,calc(100%-16px)_0,100%_16px,100%_calc(100%-44px),calc(100%-44px)_100%,26px_100%,0_calc(100%-26px))]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <FeatureMedia
                      content={items[active].content}
                      alt={items[active].alt}
                      item={items[active]}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
