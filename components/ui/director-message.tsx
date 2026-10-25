"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DirectorMessageProps {
  name?: {
    first: string;
    last: string;
  };
  role?: string;
  photoUrl?: string;
  badge?: string;
  quote?: string;
  paragraphs?: string[];
  ctaHref?: string;
  className?: string;
}

/**
 * DirectorMessageCard
 * Full-width horizontal executive card with photo on the left and rich text on the right
 * covering the entire container space.
 */
export function DirectorMessageCard({
  name = { first: "Prof. K.", last: "Umamaheshwar Rao" },
  role = "Director • National Institute of Technology Rourkela",
  photoUrl = "/assets/images/director.webp",
  badge = "Director • Leadership",
  quote = "With sixty dedicated years of service to the nation, NIT Rourkela stands as a global beacon of academic rigor, research excellence, and sustainable innovation.",
  paragraphs = [
    "It is a privilege for me to serve as Director of NIT Rourkela. Our institution is built upon strong foundational pillars of teaching excellence, cutting-edge translational research, and dedicated service to the nation. We cultivate visionary engineers, scientists, and entrepreneurs ready to lead in an increasingly complex and interconnected world.",
    "As we navigate the transformative demands of Industry 4.0 and emerging computational disciplines, our focus remains firmly on interdisciplinary learning, fostering world-class incubation, and creating sustainable technological wealth and welfare for all humanity.",
  ],
  ctaHref = "/About/DirectorsMessage/",
  className,
}: DirectorMessageProps) {
  return (
    <div
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white font-sans text-zinc-900 shadow-md transition-all duration-400 ease-out hover:-translate-y-1 hover:shadow-2xl hover:border-zinc-300 md:flex-row dark:border-white/10 dark:bg-[#15161A] dark:text-white",
        className
      )}
    >
      {/* Photo Column on the Left */}
      <div className="relative w-full overflow-hidden bg-zinc-100 md:w-[380px] md:min-w-[340px] md:shrink-0 dark:bg-zinc-800">
        <img
          src={photoUrl}
          alt={`${name.first} ${name.last} - Director`}
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Floating Badge */}
        {badge && (
          <div className="absolute bottom-5 left-5 z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white shadow-lg backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DA8956]" />
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Rich Text Column on the Right Covering the Entire Space */}
      <div className="flex flex-1 flex-col justify-between p-8 sm:p-10 lg:p-12">
        <div>
          {/* Tagline kicker */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#771D1D]/20 bg-[#771D1D]/5 px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#771D1D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DA8956]" />
            <span>Message from the Director</span>
          </div>

          {/* Large Display Name */}
          <h3 className="text-3xl font-light tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            <span className="font-light text-zinc-600 dark:text-zinc-400">{name.first}</span>{" "}
            <span className="font-extrabold bg-gradient-to-r from-zinc-900 via-[#771D1D] to-[#A72626] bg-clip-text text-transparent dark:from-white dark:via-[#FAAAAA] dark:to-[#DA8956]">
              {name.last}
            </span>
          </h3>

          <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {role}
          </p>

          {/* Pull quote */}
          {quote && (
            <blockquote className="my-6 border-l-4 border-[#771D1D] pl-4 text-base font-medium italic leading-relaxed text-zinc-800 sm:text-lg dark:text-zinc-200">
              &ldquo;{quote}&rdquo;
            </blockquote>
          )}

          {/* Paragraphs */}
          <div className="space-y-3.5 text-sm leading-relaxed text-zinc-600 sm:text-[15px] dark:text-zinc-300">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[#771D1D]">Director&apos;s Desk</span>
            <span>&bull;</span>
            <span>Office of the Director, NIT Rourkela</span>
          </div>

          <a
            href={ctaHref}
            className="group/btn inline-flex items-center gap-2.5 rounded-full bg-[#771D1D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#A72626] hover:shadow-lg"
          >
            <span>Read Full Address</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DirectorMessage() {
  return (
    <section className="w-full bg-white py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <DirectorMessageCard />
      </div>
    </section>
  );
}
