"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
import { fetchManagerAnalyticsApi } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import type { ManagerAnalyticsResponseDto } from "@/types/api";
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

interface ManagerOrgContextValue {
  organizationId: string | null;
  analytics: ManagerAnalyticsResponseDto | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  retryAnalytics: () => void;
}

const ManagerOrgContext = createContext<ManagerOrgContextValue>({
  organizationId: null,
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,
  retryAnalytics: () => {},
});

export function useManagerOrganizationData() {
  return useContext(ManagerOrgContext);
}

interface ManagerPortalShellProps {
  userEmail: string;
  fullName: string;
  accountType: AccountType;
  organizationId: string | null;
  children: React.ReactNode;
}

export function ManagerPortalShell({
  userEmail,
  fullName,
  accountType,
  organizationId,
  children,
}: ManagerPortalShellProps) {
  const { managerState, sponsorships } = useManagerDemo();
  const [analytics, setAnalytics] =
    useState<ManagerAnalyticsResponseDto | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(
    Boolean(organizationId)
  );
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    let active = true;

    async function loadAnalytics(orgId: string) {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        if (active) {
          setAnalyticsError("No active session token available.");
          setAnalyticsLoading(false);
        }
        return;
      }

      try {
        const res = await fetchManagerAnalyticsApi(orgId, token);
        if (!active) return;
        setAnalytics(res);
        setAnalyticsError(null);
      } catch (err) {
        if (!active) return;
        setAnalytics(null);
        setAnalyticsError(
          err instanceof Error
            ? err.message
            : "Failed to load manager workforce analytics."
        );
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    }

    void loadAnalytics(organizationId);
    return () => {
      active = false;
    };
  }, [organizationId, reloadKey]);

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

  function retryAnalytics() {
    if (!organizationId) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <ToastProvider>
      <ManagerOrgContext.Provider
        value={{
          organizationId,
          analytics,
          analyticsLoading,
          analyticsError,
          retryAnalytics,
        }}
      >
        <PortalLayoutFrame
          portalName="Manager Portal"
          portalBadge="Workforce Intel"
          portalVariant="manager"
          organizationLabel={
            organizationId
              ? `Org: ${organizationId.slice(0, 8)}…`
              : managerState.organizationDisplayName
          }
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
      </ManagerOrgContext.Provider>
    </ToastProvider>
  );
}
