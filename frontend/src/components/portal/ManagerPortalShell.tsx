"use client";

import React from "react";
import {
  BarChart3,
  Bot,
  Briefcase,
  Calculator,
  CalendarRange,
  Grid3X3,
  HandCoins,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import {
  PortalLayoutFrame,
  type PortalNavGroup,
} from "@/components/portal/PortalLayoutFrame";
import { ToastProvider } from "@/components/ui";
import { useManagerDemo } from "@/lib/demo/managerDemoStore";
import type { AccountType } from "@/types/database";

const MANAGER_NAV_GROUPS: PortalNavGroup[] = [
  {
    title: "Organization",
    items: [
      {
        label: "Workforce Overview",
        href: "/manager/overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: "Teams & Employees",
        href: "/manager/teams",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Skill Heatmap",
        href: "/manager/skills",
        icon: <Grid3X3 className="h-4 w-4" />,
      },
      {
        label: "Project Readiness",
        href: "/manager/projects",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        label: "Talent Discovery",
        href: "/manager/talent",
        icon: <Sparkles className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Development",
    items: [
      {
        label: "Training Planner",
        href: "/manager/training",
        icon: <CalendarRange className="h-4 w-4" />,
      },
      {
        label: "Budget Simulator",
        href: "/manager/budget",
        icon: <Calculator className="h-4 w-4" />,
      },
      {
        label: "Sponsorship Requests",
        href: "/manager/sponsorship",
        icon: <HandCoins className="h-4 w-4" />,
      },
      {
        label: "Learning Analytics",
        href: "/manager/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "Manager Copilot",
        href: "/manager/copilot",
        icon: <Bot className="h-4 w-4" />,
      },
      {
        label: "Settings",
        href: "/manager/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

interface ManagerPortalShellProps {
  userEmail: string;
  fullName: string;
  accountType: AccountType;
  children: React.ReactNode;
}

export function ManagerPortalShell({
  userEmail,
  fullName,
  accountType,
  children,
}: ManagerPortalShellProps) {
  const { managerState, sponsorships } = useManagerDemo();
  const pendingCount = sponsorships.filter(
    (s) => s.status === "Pending Review (Demo)"
  ).length;

  const groupsWithBadges = MANAGER_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === "/manager/sponsorship" && pendingCount > 0
        ? { ...item, badge: String(pendingCount) }
        : item
    ),
  }));

  return (
    <ToastProvider>
      <PortalLayoutFrame
        portalName="Manager Portal"
        portalBadge="Workforce Intel"
        portalVariant="manager"
        organizationLabel={managerState.organizationDisplayName}
        groups={groupsWithBadges}
        userEmail={userEmail}
        fullName={fullName}
        accountType={accountType}
        settingsHref="/manager/settings"
        switchPortalLink={{
          label: "Open Employee Portal",
          href: "/employee/overview",
        }}
      >
        {children}
      </PortalLayoutFrame>
    </ToastProvider>
  );
}
