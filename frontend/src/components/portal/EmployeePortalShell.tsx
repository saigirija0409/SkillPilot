"use client";

import React from "react";
import {
  Award,
  Bot,
  Compass,
  Flame,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  Newspaper,
  Search,
  Settings,
} from "lucide-react";

import {
  PortalLayoutFrame,
  type PortalNavGroup,
} from "@/components/portal/PortalLayoutFrame";
import { ToastProvider } from "@/components/ui";
import type { AccountType } from "@/types/database";

const EMPLOYEE_NAV_GROUPS: PortalNavGroup[] = [
  {
    title: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/employee/overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: "Skill Intelligence",
        href: "/employee/skills",
        icon: <Compass className="h-4 w-4" />,
      },
      {
        label: "Explore Opportunities",
        href: "/employee/explore",
        icon: <Search className="h-4 w-4" />,
      },
      {
        label: "My Roadmap",
        href: "/employee/roadmap",
        icon: <FolderKanban className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Development",
    items: [
      {
        label: "Challenges",
        href: "/employee/challenges",
        icon: <Flame className="h-4 w-4" />,
      },
      {
        label: "Skill Passport",
        href: "/employee/passport",
        icon: <Award className="h-4 w-4" />,
      },
      {
        label: "Industry Pulse",
        href: "/employee/industry",
        icon: <Newspaper className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "AI Copilot",
        href: "/employee/copilot",
        icon: <Bot className="h-4 w-4" />,
      },
      {
        label: "Sponsorship",
        href: "/employee/sponsorship",
        icon: <HandCoins className="h-4 w-4" />,
      },
      {
        label: "Settings",
        href: "/employee/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

interface EmployeePortalShellProps {
  userEmail: string;
  fullName: string;
  accountType: AccountType;
  children: React.ReactNode;
}

export function EmployeePortalShell({
  userEmail,
  fullName,
  accountType,
  children,
}: EmployeePortalShellProps) {
  const canSwitchToManager =
    accountType === "manager" || accountType === "admin";

  return (
    <ToastProvider>
      <PortalLayoutFrame
        portalName="Employee Portal"
        portalBadge="Career Journal"
        portalVariant="employee"
        groups={EMPLOYEE_NAV_GROUPS}
        userEmail={userEmail}
        fullName={fullName}
        accountType={accountType}
        settingsHref="/employee/settings"
        switchPortalLink={
          canSwitchToManager
            ? { label: "Switch to Manager Portal", href: "/manager/overview" }
            : null
        }
      >
        {children}
      </PortalLayoutFrame>
    </ToastProvider>
  );
}
