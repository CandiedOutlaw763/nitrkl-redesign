"use client";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";
import { NotchedProjectCard } from "@/components/ui/notched-project-card";

/* Three cards for About the Institute, Vision, and Mission with Magic UI DotPattern background */

export function AboutNotchedCards() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-white py-16 text-zinc-900">
      {/* Magic UI Dot Pattern (for this section only) */}
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent_85%)] fill-neutral-400/50",
        )}
      />

      <div className="relative z-10 grid w-full max-w-6xl gap-x-5 gap-y-12 p-6 min-[700px]:grid-cols-3 lg:gap-x-8 lg:p-8">
        {/* Card 1: About the Institute */}
        <NotchedProjectCard
          href="/Institute/Welcome/"
          title="About the Institute"
          description="Elevated from Regional Engineering College, Rourkela to a premier national university, producing world-class engineers, scientists, and leaders across 20 specialized departments."
          image="/assets/images/campus.jpeg"
          badge="Estd. 1961"
          tags={["National Importance", "NIRF Top Ranked", "Research Hub"]}
          monochrome
          accent="#771D1D"
        />

        {/* Card 2: Institute Vision */}
        <NotchedProjectCard
          href="/Institute/Welcome/"
          title="Institute Vision"
          description="To become an internationally acclaimed institution of higher learning serving as a source of knowledge and expertise, and a preferred destination for undergraduate and graduate studies."
          image="/assets/images/gallery7.webp"
          badge="Strategic Horizon"
          tags={["Global Acclaim", "Fountain of Knowledge", "Premier Destination"]}
          monochrome
          btnColor="#DA8956"
          accent="#DA8956"
        />

        {/* Card 3: Institute Mission */}
        <NotchedProjectCard
          href="/Institute/Welcome/"
          title="Institute Mission"
          description="To advance and spread knowledge in science and technology leading to the creation of wealth and welfare of humanity, powered by Industry 4.0 learning frameworks and cutting-edge research."
          image="/assets/images/gallery9.webp"
          badge="Core Purpose"
          tags={["Knowledge Creation", "Humanity & Welfare", "Industry 4.0"]}
          monochrome
          accent="#DA8956"
        />
      </div>
    </section>
  );
}

export default function Demo() {
  return <AboutNotchedCards />;
}
