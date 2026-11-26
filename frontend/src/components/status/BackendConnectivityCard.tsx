"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Server, ShieldCheck, AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/status/StatusBadge";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { fetchBackendHealth, getApiBaseUrl } from "@/services/api";
import type { BackendHealthResponse } from "@/types/health";

export function BackendConnectivityCard() {
  const frontendSupabaseConfigured = isSupabaseBrowserConfigured();
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = getApiBaseUrl();

  const loadHealth = useCallback(async () => {
    try {
      const data = await fetchBackendHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reach FastAPI backend";
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRecheck = useCallback(() => {
    setLoading(true);
    setError(null);
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    let active = true;
    fetchBackendHealth()
      .then((data) => {
        if (!active) return;
        setHealth(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to reach FastAPI backend";
        setError(message);
        setHealth(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const backendTone = loading
    ? "loading"
    : error
      ? "error"
      : health?.status === "ok"
        ? "healthy"
        : "warning";

  const backendLabel = loading
    ? "Checking..."
    : error
      ? "Disconnected"
      : "Connected";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              System &amp; Backend Connectivity
            </h2>
            <p className="text-sm text-slate-500">
              Target API: <code className="font-mono text-xs">{apiBaseUrl}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge tone={backendTone} label={backendLabel} />
          <button
            type="button"
            onClick={handleRecheck}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Re-check
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Could not connect to FastAPI backend</p>
            <p className="mt-1 text-rose-700">{error}</p>
            <p className="mt-2 text-xs text-rose-600">
              Ensure the backend server is running on{" "}
              <code className="font-mono">{apiBaseUrl}</code> and CORS allows{" "}
              <code className="font-mono">http://localhost:3000</code>.
            </p>
          </div>
        </div>
      ) : null}

      {health ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Backend Service
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {health.service} (v{health.version})
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Environment: <span className="font-medium">{health.environment}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Checked at: {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              Integration Readiness
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-700">Frontend Supabase</span>
                <StatusBadge
                  tone={frontendSupabaseConfigured ? "healthy" : "warning"}
                  label={frontendSupabaseConfigured ? "Configured" : "Env Pending"}
                />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-700">Backend Supabase</span>
                <StatusBadge
                  tone={health.integrations.supabase.configured ? "healthy" : "warning"}
                  label={
                    health.integrations.supabase.configured
                      ? "Configured"
                      : "Env Pending"
                  }
                />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-700">Backend Gemini AI</span>
                <StatusBadge
                  tone={health.integrations.gemini.configured ? "healthy" : "warning"}
                  label={
                    health.integrations.gemini.configured
                      ? "Configured"
                      : "Env Pending"
                  }
                />
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
