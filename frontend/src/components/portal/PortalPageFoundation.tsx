import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Button,
  CompassGrowthIllustration,
  EditorialHeading,
  EmptyState,
  PastelCard,
  type PastelTone,
  StatusLabel,
} from "@/components/ui";

interface PortalPageFoundationProps {
  eyebrow: string;
  title: string;
  italicAccent?: string;
  subtitle: string;
  phaseNote: string;
  tone?: PastelTone;
  plannedCapabilities: string[];
  backHref: string;
  backLabel: string;
}

export function PortalPageFoundation({
  eyebrow,
  title,
  italicAccent,
  subtitle,
  phaseNote,
  tone = "pistachio",
  plannedCapabilities,
  backHref,
  backLabel,
}: PortalPageFoundationProps) {
  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow={eyebrow}
        title={title}
        italicAccent={italicAccent}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <StatusLabel tone="inferred" label={phaseNote} />
            <Link href={backHref}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              >
                {backLabel}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <PastelCard
          tone={tone}
          eyebrow="Route Foundation Ready"
          title="Dedicated route established"
          description="This dedicated Next.js App Router destination is active and protected. Interactive workflows will connect here in the upcoming build phase without fabricated placeholders."
          illustration={<CompassGrowthIllustration className="h-20 w-20" />}
          className="lg:col-span-5"
        />

        <div className="lg:col-span-7">
          <EmptyState
            title={`Planned for ${phaseNote}`}
            description={`Capabilities wired into this route: ${plannedCapabilities.join(" • ")}.`}
            action={
              <Link href={backHref}>
                <Button variant="primary" size="sm">
                  {backLabel}
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
