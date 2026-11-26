import React from "react";

import { cn } from "@/lib/utils";

interface IllustrationProps {
  className?: string;
  label?: string;
}

export function CompassGrowthIllustration({
  className,
  label = "Career direction compass illustration",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("h-24 w-24", className)}
    >
      <circle cx="60" cy="60" r="52" fill="#FFFDF8" stroke="#E2DFD5" strokeWidth="1.5" />
      <path
        d="M24 84C36 62 56 44 92 34"
        stroke="#294C3B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="88" cy="35" r="11" fill="#F9DF91" />
      <circle cx="42" cy="66" r="7" fill="#D9E8B5" stroke="#294C3B" strokeWidth="1.5" />
      <circle cx="66" cy="48" r="5" fill="#DDD6F3" stroke="#294C3B" strokeWidth="1.5" />
      <path
        d="M84 31L93 34L87 42"
        stroke="#294C3B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SkillConstellationIllustration({
  className,
  label = "Connected skills network illustration",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("h-24 w-24", className)}
    >
      <rect x="12" y="16" width="96" height="88" rx="20" fill="#FFFDF8" stroke="#E2DFD5" strokeWidth="1.5" />
      <path
        d="M36 74L58 46L86 64M58 46L78 32"
        stroke="#294C3B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="74" r="9" fill="#F4C9B4" stroke="#294C3B" strokeWidth="1.5" />
      <circle cx="58" cy="46" r="11" fill="#D9E8B5" stroke="#294C3B" strokeWidth="1.5" />
      <circle cx="86" cy="64" r="8" fill="#DDD6F3" stroke="#294C3B" strokeWidth="1.5" />
      <circle cx="78" cy="32" r="6" fill="#F9DF91" stroke="#294C3B" strokeWidth="1.5" />
    </svg>
  );
}

export function RoadmapRibbonIllustration({
  className,
  label = "30-60-90 day learning path illustration",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("h-24 w-24", className)}
    >
      <rect x="14" y="20" width="92" height="80" rx="18" fill="#F8F6F0" stroke="#E2DFD5" strokeWidth="1.5" />
      <rect x="24" y="34" width="32" height="12" rx="6" fill="#D9E8B5" />
      <rect x="44" y="54" width="40" height="12" rx="6" fill="#F9DF91" />
      <rect x="60" y="74" width="36" height="12" rx="6" fill="#DDD6F3" />
      <path
        d="M28 40H52M48 60H78M64 80H90"
        stroke="#294C3B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function JournalSparkIllustration({
  className,
  label = "Career journal notebook illustration",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("h-24 w-24", className)}
    >
      <rect x="22" y="18" width="76" height="84" rx="14" fill="#FFFDF8" stroke="#294C3B" strokeWidth="1.75" />
      <path d="M36 18V102" stroke="#E2DFD5" strokeWidth="1.5" />
      <circle cx="68" cy="46" r="14" fill="#F4C9B4" />
      <path d="M48 70H84M48 80H74" stroke="#294C3B" strokeWidth="2" strokeLinecap="round" />
      <path d="M68 38V54M60 46H76" stroke="#294C3B" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
