"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  Award,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AchievementItem {
  id?: string | number;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  knowMoreUrl?: string;
  category: "faculty" | "student";
  badge?: string;
}

// Backwards compatibility alias for the original Testimonial interface
export type Testimonial = AchievementItem;

export const defaultAchievements: AchievementItem[] = [
  // Faculty Achievements (from NIT Rourkela website)
  {
    id: "fac-1",
    name: "NIT Rourkela Secures Over ₹8.50 Crore in ANRF Advanced Research Grants",
    title: "Faculty Achievements • Research & Grants",
    description:
      "NIT Rourkela faculty members have secured over ₹8.50 Crore in prestigious Advanced Research Grants from the Anusandhan National Research Foundation (ANRF), driving cutting-edge translational investigations across engineering and physical sciences.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/fac-ANRF.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/FacultyAwards/?id=31",
    category: "faculty",
    badge: "ANRF Grant",
  },
  {
    id: "fac-2",
    name: "69 Faculty Members Featured in SciRank Global's Top 5% Scientists List",
    title: "Faculty Achievements • Global Scholarly Distinction",
    description:
      "69 distinguished faculty members from NIT Rourkela have been recognized and featured in the SciRank Global World's Top 5% Scientists List, affirming the institute's prolific research productivity and global citation impact.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/fa-SciRank.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/FacultyAwards/?id=29",
    category: "faculty",
    badge: "World Top 5%",
  },
  {
    id: "fac-3",
    name: "NIT Rourkela Scientist Honoured with INSA Associate Fellowship!",
    title: "Faculty Achievements • Fellowship & Academy Honors",
    description:
      "Distinguished scientist and faculty member from NIT Rourkela has been conferred the prestigious Indian National Science Academy (INSA) Associate Fellowship for pioneering scientific innovations and leadership in fundamental research.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/fac-award-insa.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/FacultyAwards/?id=27",
    category: "faculty",
    badge: "INSA Fellowship",
  },
  {
    id: "fac-4",
    name: "PMECRG Awarded to Faculty Members of NIT Rourkela!",
    title: "Faculty Achievements • National Research Grants",
    description:
      "Prime Minister's Early Career Research Grants (PMECRG) awarded to early-career faculty members of NIT Rourkela, providing vital national support to spearhead high-priority technology missions and foundational research.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/fac-PMECRG.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/FacultyAwards/?id=26",
    category: "faculty",
    badge: "PMECRG National Grant",
  },

  // Student Achievements (from NIT Rourkela website)
  {
    id: "std-1",
    name: "Ph.D. Scholar Receives Prestigious IEEE IAS Student Travel Award",
    title: "Student Achievements • International Travel Award",
    description:
      "A doctoral researcher from NIT Rourkela was selected for the globally prestigious IEEE Industry Applications Society (IAS) Student Travel Award, enabling international presentation of novel high-efficiency power systems research.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/std-award12.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/StudentAchievements/?id=32",
    category: "student",
    badge: "IEEE IAS Award",
  },
  {
    id: "std-2",
    name: "NIT Rourkela Students Win Multiple Awards at BTTD-2026",
    title: "Student Achievements • National Design & Technology Championship",
    description:
      "Student innovators and engineers from NIT Rourkela demonstrated extraordinary technical prowess by sweeping multiple accolades and top podium finishes at the BTTD-2026 technological design convention.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/std-BTTD-2026.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/StudentAchievements/?id=30",
    category: "student",
    badge: "BTTD-2026 Winners",
  },
  {
    id: "std-3",
    name: "MTech Students Selected as 'Delegates' under IEEE SPACE 2026!",
    title: "Student Achievements • IEEE Delegation & Research",
    description:
      "Postgraduate MTech scholars from NIT Rourkela were chosen as official institute delegates under the IEEE SPACE 2026 program, recognizing their technical publications and contributions in signal processing and communications.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/std-award210426.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/StudentAchievements/?id=24",
    category: "student",
    badge: "IEEE SPACE 2026",
  },
  {
    id: "std-4",
    name: "NIT Rourkela Team Wins First Prize at 'Robofest Gujarat 5.0'",
    title: "Student Achievements • National Robotics Championship",
    description:
      "The student robotics club of NIT Rourkela clinched the First Prize trophy at the prestigious national-level 'Robofest Gujarat 5.0' robotics competition, showcasing exceptional autonomous engineering, precision control, and design ingenuity.",
    imageUrl: "/nitrkl/docs/AwardsAchievements/RobofestGujarat5.0.webp",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80",
    knowMoreUrl: "/Home/StudentAchievements/?id=23",
    category: "student",
    badge: "First Prize Winner",
  },
];

export interface TestimonialCarouselProps {
  className?: string;
  items?: AchievementItem[];
  autoScroll?: boolean;
  autoScrollInterval?: number; // In milliseconds, default 5000ms
  defaultCategory?: "all" | "faculty" | "student";
  showCategoryTabs?: boolean;
}

export function TestimonialCarousel({
  className,
  items = defaultAchievements,
  autoScroll = true,
  autoScrollInterval = 5000,
  defaultCategory = "all",
  showCategoryTabs = true,
}: TestimonialCarouselProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "faculty" | "student">(defaultCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items by category
  const filteredAchievements = items.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const activeList = filteredAchievements.length > 0 ? filteredAchievements : items;

  // Next & Previous handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % activeList.length);
  }, [activeList.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + activeList.length) % activeList.length);
  }, [activeList.length]);

  // Reset index when category tab changes
  const handleCategoryChange = (category: "all" | "faculty" | "student") => {
    setSelectedCategory(category);
    setCurrentIndex(0);
  };

  // Auto-scroll effect: advances every `autoScrollInterval` ms unless paused
  useEffect(() => {
    if (!isAutoScrolling || activeList.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [isAutoScrolling, autoScrollInterval, handleNext, activeList.length]);

  // Keyboard navigation when user is focused on the carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (node) {
        node.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [handleNext, handlePrevious]);

  const currentItem = activeList[currentIndex] || activeList[0];
  const isFaculty = currentItem.category === "faculty";
  const imageKey = currentItem.id || currentItem.imageUrl;
  const currentImageSrc = imgError[imageKey]
    ? currentItem.fallbackImageUrl || currentItem.imageUrl
    : currentItem.imageUrl;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "w-full max-w-5xl mx-auto px-4 py-8 focus:outline-none select-none font-['Noto_Sans',sans-serif]",
        className
      )}
      aria-label="Achievements Carousel"
    >
      {/* Category Tabs & Header */}
      {showCategoryTabs && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#771D1D] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              NIT Rourkela Honors
            </span>
          </div>

          <div className="flex items-center p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-inner">
            <button
              onClick={() => handleCategoryChange("all")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer",
                selectedCategory === "all"
                  ? "bg-[#771D1D] text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              All Achievements
            </button>
            <button
              onClick={() => handleCategoryChange("faculty")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer",
                selectedCategory === "faculty"
                  ? "bg-[#771D1D] text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              Faculty
            </button>
            <button
              onClick={() => handleCategoryChange("student")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer",
                selectedCategory === "student"
                  ? "bg-[#771D1D] text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </button>
          </div>
        </div>
      )}

      {/* Desktop layout (Non-destructive Side-by-Side Unified Card) */}
      <div className="hidden md:flex relative items-stretch rounded-3xl overflow-hidden bg-white dark:bg-[#18191E] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl">
        {/* Avatar / Feature Image Box */}
        <div className="w-[48%] min-h-[390px] bg-neutral-900 flex-shrink-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageSrc}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image
                src={currentImageSrc}
                alt={currentItem.name}
                width={600}
                height={450}
                className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                draggable={false}
                priority
                unoptimized
                onError={() => {
                  setImgError((prev) => ({ ...prev, [imageKey]: true }));
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card Content Box */}
        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Headline */}
              <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-4 leading-snug line-clamp-3">
                {currentItem.name}
              </h2>

              {/* Full Description from website */}
              <p className="text-neutral-700 dark:text-neutral-300 text-sm lg:text-base leading-relaxed mb-8">
                {currentItem.description}
              </p>

              {/* Know More Action Button */}
              <div className="flex items-center gap-4">
                <Link
                  href={currentItem.knowMoreUrl || "#"}
                  target={currentItem.knowMoreUrl?.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#771D1D] hover:bg-[#8f2424] text-white font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
                  aria-label={`Know more about ${currentItem.name}`}
                >
                  <span>Know More</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href={
                    isFaculty
                      ? "/nitrkl/index.html#faculty-awards"
                      : "/nitrkl/index.html#student-awards"
                  }
                  className="text-xs font-semibold text-neutral-500 hover:text-[#771D1D] dark:text-neutral-400 dark:hover:text-[#FAAAAA] transition-colors"
                >
                  View All in Portal →
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden max-w-sm mx-auto text-left bg-transparent">
        {/* Avatar */}
        <div className="w-full aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden mb-5 relative shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageSrc}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image
                src={currentImageSrc}
                alt={currentItem.name}
                width={600}
                height={450}
                className="w-full h-full object-cover object-center"
                draggable={false}
                priority
                unoptimized
                onError={() => {
                  setImgError((prev) => ({ ...prev, [imageKey]: true }));
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card content */}
        <div className="px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 leading-snug">
                {currentItem.name}
              </h2>

              <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed mb-6">
                {currentItem.description}
              </p>

              {/* Know More Button */}
              <div className="flex items-center gap-3">
                <Link
                  href={currentItem.knowMoreUrl || "#"}
                  target={currentItem.knowMoreUrl?.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#771D1D] hover:bg-[#8f2424] text-white font-medium text-sm transition-all duration-300 shadow cursor-pointer"
                  aria-label={`Know more about ${currentItem.name}`}
                >
                  <span>Know More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={
                    isFaculty
                      ? "/nitrkl/index.html#faculty-awards"
                      : "/nitrkl/index.html#student-awards"
                  }
                  className="text-xs font-semibold text-neutral-500 hover:text-[#771D1D] dark:text-neutral-400"
                >
                  View All →
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation & Controls (Auto-scroll & Manual) */}
      <div className="flex justify-center items-center gap-4 sm:gap-6 mt-8">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          aria-label="Previous achievement"
          className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-sm flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 items-center">
          {activeList.map((_, itemIndex) => (
            <button
              key={itemIndex}
              onClick={() => setCurrentIndex(itemIndex)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                itemIndex === currentIndex
                  ? "w-8 bg-[#771D1D] dark:bg-[#DA8956]"
                  : "w-2.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400"
              )}
              aria-label={`Go to slide ${itemIndex + 1}`}
            />
          ))}
        </div>

        {/* Play/Pause Auto-scroll toggle */}
        <button
          onClick={() => setIsAutoScrolling((prev) => !prev)}
          aria-label={isAutoScrolling ? "Pause auto-scroll" : "Play auto-scroll"}
          title={isAutoScrolling ? "Pause auto-scroll" : "Play auto-scroll"}
          className={cn(
            "w-9 h-9 rounded-full border shadow-sm flex items-center justify-center transition-colors cursor-pointer text-xs",
            isAutoScrolling
              ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
              : "bg-[#771D1D] text-white border-[#771D1D]"
          )}
        >
          {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          aria-label="Next achievement"
          className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-sm flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-200"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Index Counter / Status */}
      <div className="text-center mt-3 text-xs text-neutral-400 dark:text-neutral-500 font-mono">
        {currentIndex + 1} / {activeList.length}
      </div>
    </div>
  );
}

export default TestimonialCarousel;
