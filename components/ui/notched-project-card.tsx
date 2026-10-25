"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotchedProjectCardProps {
  href?: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  tags?: string[];
  monochrome?: boolean;
  accent?: string;
  btnColor?: string;
  className?: string;
}

/**
 * NotchedProjectCard
 * Authentic 21st.dev component by Maud Benaddi.
 * Completely borderless card layout featuring an image with a signature
 * bottom-right rounded notch cutout, nested circular action arrow button,
 * top-right floating badge, bold display title, description, and bottom tags.
 */
export function NotchedProjectCard({
  href = "#",
  title,
  description,
  image,
  badge,
  tags = [],
  monochrome = true,
  accent = "#DA8956",
  btnColor,
  className,
}: NotchedProjectCardProps) {
  return (
    <a
      href={href}
      className={cn(
        "group relative flex flex-col font-['Noto_Sans'] text-neutral-900 no-underline transition-all duration-300",
        className
      )}
      style={
        {
          "--card-accent": accent,
        } as React.CSSProperties
      }
    >
      {/* Media Cover with Signature Bottom-Right Rounded Notch Cutout */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[26px] bg-neutral-100 dark:bg-neutral-900">
        <img
          src={image}
          alt={title}
          className={cn(
            "h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105",
            monochrome && "grayscale group-hover:grayscale-0 transition-[filter,transform]"
          )}
        />

        {/* Floating Top-Right Status Badge (matching 21st.dev design) */}
        {badge && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center rounded-full bg-black/65 px-3.5 py-1 text-xs font-bold tracking-wider text-white backdrop-blur-md">
              {badge}
            </span>
          </div>
        )}

        {/* Signature Inverted Bottom-Right Notch Cutout SVG */}
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -bottom-px -right-px z-10 h-24 w-24 fill-white text-white dark:fill-zinc-950"
          aria-hidden="true"
        >
          <path d="M 100 0 C 100 16 92 28 80 34 A 38 38 0 0 0 34 80 C 28 92 16 100 0 100 L 100 100 Z" />
        </svg>

        {/* Nested Circular Action Arrow Button */}
        <div
          className={cn(
            "absolute bottom-2.5 right-2.5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-neutral-900 shadow-sm transition-all duration-300 group-hover:scale-105",
            btnColor ? "" : "bg-neutral-100 group-hover:text-white"
          )}
          style={{
            backgroundColor: btnColor || undefined,
          }}
          onMouseEnter={(e) => {
            if (!btnColor) e.currentTarget.style.backgroundColor = accent;
          }}
          onMouseLeave={(e) => {
            if (!btnColor) e.currentTarget.style.backgroundColor = "";
          }}
        >
          <ArrowUpRight className="h-6 w-6 stroke-[2.2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* Content Area Below Image — No enclosing card border */}
      <div className="flex flex-1 flex-col pt-4">
        {/* Title */}
        <h3 className="text-2xl font-bold tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-neutral-950 dark:text-white">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>

        {/* Bottom Tags List */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-600 transition-colors dark:bg-neutral-800 dark:text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export default NotchedProjectCard;
