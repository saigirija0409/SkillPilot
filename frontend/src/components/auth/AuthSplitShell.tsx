"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";

import {
  BrandLogo,
  CompassGrowthIllustration,
  SkillConstellationIllustration,
} from "@/components/ui";

interface AuthSplitShellProps {
  children: React.ReactNode;
  eyebrow: string;
}

export function AuthSplitShell({ children, eyebrow }: AuthSplitShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Left Branded Forest Green Panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-forest px-8 py-10 text-[#FFFDF8] sm:px-12 lg:col-span-5 lg:py-14">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo size="md" showWordmark={false} />
            <span className="font-editorial text-2xl tracking-tight text-[#FFFDF8]">
              Skill<span className="italic text-pistachio">Pilot</span>
            </span>
          </Link>

          <span className="rounded-full border border-pistachio/30 bg-[#365E4A] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-pistachio">
            {eyebrow}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="my-12 space-y-6"
        >
          <h2 className="font-editorial text-4xl leading-[1.06] text-[#FFFDF8] sm:text-5xl">
            Good things{" "}
            <span className="italic text-butter">grow with you.</span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-pistachio/90 sm:text-base">
            Pick up your career journal where you left off—track verified
            skills, follow realistic learning blocks, and keep your private
            documents under your control.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl border border-pistachio/25 bg-[#345946] p-3"
            >
              <CompassGrowthIllustration className="h-20 w-20" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl border border-pistachio/25 bg-[#345946] p-3"
            >
              <SkillConstellationIllustration className="h-20 w-20" />
            </motion.div>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pistachio/20 pt-5 text-xs text-pistachio/80">
          <span>Supabase Authenticated • RLS Enforced</span>
          <Link href="/" className="font-semibold text-[#FFFDF8] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </aside>

      {/* Right Spacious Cream Form Panel */}
      <main className="flex flex-col items-center justify-center bg-canvas px-6 py-12 sm:px-12 lg:col-span-7">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
