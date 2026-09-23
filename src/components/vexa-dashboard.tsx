"use client";

import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Cloud,
  Clock3,
  Command,
  Gauge,
  History,
  Inbox,
  Link2,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircleMore,
  Mic,
  Newspaper,
  Play,
  Radar,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  isActionRevisable,
  isActionReviewable,
  summarizeActions,
  type ActionCenterResponse,
} from "@/lib/actions/contracts";
import type { ReplyRevisionInput } from "@/lib/actions/revisions";
import type { BriefingItem, SourceCategory } from "@/lib/domain/models";
import { categoryLabels } from "@/lib/domain/models";
import { getDemoActionCenter } from "@/lib/fixtures/actions";
import { getDemoFocusPlan } from "@/lib/fixtures/focus";
import { getDemoInbox } from "@/lib/fixtures/inbox";
import { getDemoRelationships } from "@/lib/fixtures/relationships";
import type { FocusPlanResponse, FocusProposal } from "@/lib/focus/contracts";
import type {
  InboxCategory,
  InboxItem,
  InboxResponse,
} from "@/lib/inbox/contracts";
import type { OrbAnswer } from "@/lib/intelligence/orb";
import type {
  RelationshipPerson,
  RelationshipsResponse,
  RelationshipSignal,
} from "@/lib/relationships/contracts";

interface ScheduleItem {
  time: string;
  title: string;
  meta: string;
}

interface VexaDashboardProps {
  briefingItems: BriefingItem[];
  schedule: ScheduleItem[];
  sourceMode: "live" | "fixture";
  googleConnected: boolean;
  googleConfigured: boolean;
  viewer?: {
    displayName: string;
    organizationName: string;
  };
}

interface PreparedReply {
  actionId: string;
  subject: string;
  body: string;
  destination: string;
  groundingMode: "deterministic" | "model";
}

interface OrbExchange {
  id: string;
  question: string;
  response?: OrbAnswer;
  error?: string;
}

type View = "Today" | "Inbox" | "People" | "Focus" | "Actions";

const primaryNavigation = [
  { label: "Today" as const, icon: Sparkles },
  { label: "Inbox" as const, icon: Inbox, count: 7 },
  { label: "People" as const, icon: Users },
  { label: "Focus" as const, icon: Gauge },
  { label: "Actions" as const, icon: ListChecks },
];

const spaces = [
  { label: "Work", icon: BriefcaseBusiness, color: "blue" },
  { label: "Social", icon: MessageCircleMore, color: "coral" },
  { label: "News", icon: Newspaper, color: "amber" },
  { label: "Protect", icon: ShieldCheck, color: "mint" },
];

const categoryIcons: Record<SourceCategory, typeof BriefcaseBusiness> = {
  work: BriefcaseBusiness,
  social: Users,
  news: Newspaper,
  protect: ShieldCheck,
};

const opportunities = [
  { icon: TrendingUp, type: "Market signal", title: "Three African banks opened AI-partner programs", detail: "Strong fit with Vexa Protect and approval-gated workflows.", sources: "4 sources", tone: "violet" },
  { icon: UserRoundSearch, type: "Relationship", title: "A warm path into Atlas Labs just reopened", detail: "Amara replied after your product update was shared internally.", sources: "Gmail + LinkedIn", tone: "coral" },
  { icon: Radar, type: "Competitor move", title: "Approval-based AI actions are becoming table stakes", detail: "Lead with evidence, control, and cross-source memory instead.", sources: "3 sources", tone: "mint" },
];

export function VexaDashboard({ briefingItems, schedule, sourceMode, googleConnected, googleConfigured, viewer }: VexaDashboardProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>("Today");
  const [orbOpen, setOrbOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<BriefingItem | null>(null);
  const [preparedReply, setPreparedReply] = useState<PreparedReply | null>(null);
  const [preparingReply, setPreparingReply] = useState(false);
  const [query, setQuery] = useState("");
  const [orbExchanges, setOrbExchanges] = useState<OrbExchange[]>([]);
  const [orbBusy, setOrbBusy] = useState(false);
  const [expandedOrbSources, setExpandedOrbSources] = useState<string | null>(null);
  const [sentActions, setSentActions] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [actionCenter, setActionCenter] = useState<ActionCenterResponse | null>(
    () => (googleConnected ? null : getDemoActionCenter()),
  );
  const [actionCenterLoading, setActionCenterLoading] = useState(false);
  const [actionCenterError, setActionCenterError] = useState("");
  const [actionDecisionBusy, setActionDecisionBusy] = useState<string | null>(null);
  const [actionRevisionBusy, setActionRevisionBusy] = useState<string | null>(null);
  const [inboxData, setInboxData] = useState<InboxResponse | null>(
    () => (googleConnected ? null : getDemoInbox()),
  );
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [relationships, setRelationships] = useState<RelationshipsResponse | null>(
    () => (googleConnected ? null : getDemoRelationships()),
  );
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [relationshipsError, setRelationshipsError] = useState("");
  const [focusPlan, setFocusPlan] = useState<FocusPlanResponse | null>(
    () => (googleConnected ? null : getDemoFocusPlan()),
  );
  const [focusLoading, setFocusLoading] = useState(false);
  const [focusError, setFocusError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orbOpen) inputRef.current?.focus();
  }, [orbOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setOrbOpen(false);
        setReviewItem(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentDate = useMemo(() => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()), []);
  const displayName = viewer?.displayName ?? "Chidi Okoro";
  const firstName = displayName.split(" ")[0] || "there";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VX";

  function connectGoogle() {
    if (!googleConfigured) {
      setToast("Add Google OAuth credentials to .env.local before connecting.");
      return;
    }
    window.location.assign(new URL("/api/auth/google/start", window.location.origin).toString());
  }

  async function logout() {
    if (!viewer) {
      router.push("/");
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  async function synchronizeGoogle() {
    setSyncing(true);
    try {
      const response = await fetch("/api/v1/connectors/google/sync", { method: "POST" });
      const payload = (await response.json()) as { error?: string; status?: string };
      if (!response.ok && response.status !== 207) {
        throw new Error(payload.error ?? "Google Workspace sync failed.");
      }
      setToast(payload.status === "degraded" ? "Google synced with a partial connector failure." : "Google Workspace synced. Refreshing your briefing...");
      window.setTimeout(() => router.refresh(), 700);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Google Workspace sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function submitQuestion(question?: string) {
    const nextQuestion = (question ?? query).trim();
    if (!nextQuestion || orbBusy) return;
    const exchangeId = window.crypto.randomUUID();
    setOrbExchanges((current) => [
      ...current,
      { id: exchangeId, question: nextQuestion },
    ]);
    setQuery("");
    setOrbBusy(true);

    try {
      const response = await fetch("/api/v1/orb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuestion }),
      });
      const payload = (await response.json()) as OrbAnswer & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Vexa could not search your sources.");
      }
      setOrbExchanges((current) =>
        current.map((exchange) =>
          exchange.id === exchangeId
            ? { ...exchange, response: payload }
            : exchange,
        ),
      );
    } catch (error) {
      setOrbExchanges((current) =>
        current.map((exchange) =>
          exchange.id === exchangeId
            ? {
                ...exchange,
                error:
                  error instanceof Error
                    ? error.message
                    : "Vexa could not search your sources.",
              }
            : exchange,
        ),
      );
    } finally {
      setOrbBusy(false);
    }
  }

  function prepareOrbAction(answer: OrbAnswer) {
    const action = answer.suggestedAction;
    const citation = answer.citations.find(
      (candidate) => candidate.sourceRecordId === action?.sourceRecordId,
    );
    if (!action || !citation) return;

    const existing = briefingItems.find((item) => item.id === action.sourceRecordId);
    void openActionReview(
      existing ?? {
        id: action.sourceRecordId,
        category: "work",
        urgency: "normal",
        title: citation.sourceLabel,
        summary: citation.excerpt,
        rationale: "The Orb selected this authorized source as the strongest match.",
        dueLabel: "From grounded search",
        citations: [
          {
            id: citation.id,
            integration: citation.integration,
            sourceType: citation.sourceType,
            sourceLabel: citation.sourceLabel,
            sourceUrl: citation.sourceUrl,
            observedAt: citation.observedAt,
          },
        ],
        action: {
          id: `orb-action-${action.sourceRecordId}`,
          kind: "reply",
          label: action.label,
          destination: action.destination,
          status: "recommended",
        },
      },
    );
  }

  async function loadActionCenter() {
    if (!googleConnected) {
      setActionCenter(getDemoActionCenter());
      setActionCenterError("");
      return;
    }

    setActionCenterLoading(true);
    setActionCenterError("");
    try {
      const response = await fetch("/api/v1/actions", { cache: "no-store" });
      const payload = (await response.json()) as ActionCenterResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Vexa could not load your actions.");
      }
      setActionCenter(payload);
    } catch (error) {
      setActionCenterError(
        error instanceof Error ? error.message : "Vexa could not load your actions.",
      );
    } finally {
      setActionCenterLoading(false);
    }
  }

  async function loadInbox() {
    if (!googleConnected) {
      setInboxData(getDemoInbox());
      setInboxError("");
      return;
    }

    setInboxLoading(true);
    setInboxError("");
    try {
      const response = await fetch("/api/v1/inbox", { cache: "no-store" });
      const payload = (await response.json()) as InboxResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Vexa could not load your inbox.");
      }
      setInboxData(payload);
    } catch (error) {
      setInboxError(
        error instanceof Error ? error.message : "Vexa could not load your inbox.",
      );
    } finally {
      setInboxLoading(false);
    }
  }

  async function loadRelationships() {
    if (!googleConnected) {
      setRelationships(getDemoRelationships());
      setRelationshipsError("");
      return;
    }

    setRelationshipsLoading(true);
    setRelationshipsError("");
    try {
      const response = await fetch("/api/v1/relationships", { cache: "no-store" });
      const payload = (await response.json()) as RelationshipsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Vexa could not load relationship memory.");
      }
      setRelationships(payload);
    } catch (error) {
      setRelationshipsError(
        error instanceof Error ? error.message : "Vexa could not load relationship memory.",
      );
    } finally {
      setRelationshipsLoading(false);
    }
  }

  async function loadFocusPlan() {
    if (!googleConnected) {
      setFocusPlan(getDemoFocusPlan());
      setFocusError("");
      return;
    }

    setFocusLoading(true);
    setFocusError("");
    try {
      const response = await fetch("/api/v1/focus-plan", { cache: "no-store" });
      const payload = (await response.json()) as FocusPlanResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Vexa could not calculate your focus plan.");
      }
      setFocusPlan(payload);
    } catch (error) {
      setFocusError(
        error instanceof Error ? error.message : "Vexa could not calculate your focus plan.",
      );
    } finally {
      setFocusLoading(false);
    }
  }

  async function decideAction(actionId: string, command: "approve" | "reject") {
    if (!actionCenter) return;
    setActionDecisionBusy(actionId);

    if (actionCenter.mode === "fixture") {
      const decidedAt = new Date().toISOString();
      setActionCenter((current) => {
        if (!current) return current;
        const actions = current.actions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                status: command === "approve" ? "approved" as const : "rejected" as const,
                approvedPayloadVersion:
                  command === "approve" ? action.payloadVersion : null,
                updatedAt: decidedAt,
                approvals: action.approvals.map((approval) =>
                  approval.payloadVersion === action.payloadVersion
                    ? { ...approval, decision: command === "approve" ? "approved" : "rejected", decidedAt }
                    : approval,
                ),
                timeline: [
                  {
                    id: `demo-${command}-${actionId}-${decidedAt}`,
                    eventType: `action.${command}`,
                    label:
                      command === "approve"
                        ? "Exact payload approved in demonstration"
                        : "Draft rejected in demonstration",
                    at: decidedAt,
                    correlationId: `demo-${actionId}`,
                    details: {
                      previousStatus: action.status,
                      nextStatus: command === "approve" ? "approved" : "rejected",
                      payloadVersion: action.payloadVersion,
                    },
                  },
                  ...action.timeline,
                ],
              }
            : action,
        );
        return { ...current, generatedAt: decidedAt, actions, summary: summarizeActions(actions) };
      });
      setToast(
        command === "approve"
          ? "Approved in demonstration mode. Nothing was sent externally."
          : "Rejected in demonstration mode. Nothing was sent externally.",
      );
      setActionDecisionBusy(null);
      return;
    }

    try {
      const response = await fetch(`/api/v1/actions/${actionId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "The decision could not be recorded.");
      }
      await loadActionCenter();
      setToast(
        command === "approve"
          ? "Exact payload approved and audited. External sending remains disabled."
          : "Draft rejected and recorded in the audit trail.",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "The decision could not be recorded.");
    } finally {
      setActionDecisionBusy(null);
    }
  }

  async function reviseAction(
    actionId: string,
    revision: ReplyRevisionInput,
  ): Promise<boolean> {
    if (!actionCenter) return false;
    setActionRevisionBusy(actionId);

    if (actionCenter.mode === "fixture") {
      const revisedAt = new Date().toISOString();
      setActionCenter((current) => {
        if (!current) return current;
        const actions = current.actions.map((action) => {
          if (action.id !== actionId) return action;
          const nextVersion = action.payloadVersion + 1;
          const payload = {
            ...action.payload,
            ...(revision.subject !== undefined
              ? { subject: revision.subject.trim() }
              : {}),
            body: revision.body.trim(),
          };
          return {
            ...action,
            payload,
            payloadVersion: nextVersion,
            approvedPayloadVersion: null,
            status: "awaiting_approval" as const,
            updatedAt: revisedAt,
            versions: [
              {
                payloadVersion: nextVersion,
                payload,
                changeSummary: "User edited the reply and requested approval again",
                createdAt: revisedAt,
              },
              ...action.versions,
            ],
            approvals: [
              {
                id: `demo-approval-${actionId}-${nextVersion}`,
                payloadVersion: nextVersion,
                decision: null,
                createdAt: revisedAt,
              },
              ...action.approvals.map((approval) =>
                approval.decision === null
                  ? { ...approval, decision: "invalidated", decidedAt: revisedAt }
                  : approval,
              ),
            ],
            timeline: [
              {
                id: `demo-request-${actionId}-${nextVersion}`,
                eventType: "action.request_approval",
                label: `Approval requested for payload v${nextVersion}`,
                at: revisedAt,
                correlationId: `demo-revision-${actionId}`,
                details: { payloadVersion: nextVersion },
              },
              {
                id: `demo-edit-${actionId}-${nextVersion}`,
                eventType: "action.edit",
                label: "Payload edited; previous approval invalidated",
                at: revisedAt,
                correlationId: `demo-revision-${actionId}`,
                details: {
                  previousPayloadVersion: action.payloadVersion,
                  payloadVersion: nextVersion,
                },
              },
              ...action.timeline,
            ],
          };
        });
        return {
          ...current,
          generatedAt: revisedAt,
          actions,
          summary: summarizeActions(actions),
        };
      });
      setActionRevisionBusy(null);
      setToast("Draft revised in demonstration mode. The previous approval is invalid and version 2 now needs review.");
      return true;
    }

    try {
      const response = await fetch(`/api/v1/actions/${actionId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revision),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "The revised draft could not be saved.");
      }
      await loadActionCenter();
      setToast("New payload version saved. The previous approval is invalid and approval was requested again.");
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : "The revised draft could not be saved.");
      return false;
    } finally {
      setActionRevisionBusy(null);
    }
  }

  function chooseView(view: View) {
    setActiveView(view);
    setMobileNavOpen(false);
    if (view === "Actions") void loadActionCenter();
    if (view === "Inbox") void loadInbox();
    if (view === "People") void loadRelationships();
    if (view === "Focus") void loadFocusPlan();
  }

  async function openActionReview(item: BriefingItem, forceLive = false) {
    setReviewItem(item);
    setPreparedReply(null);

    if ((!forceLive && sourceMode !== "live") || item.action?.kind !== "reply") return;

    setPreparingReply(true);
    try {
      const response = await fetch("/api/v1/drafts/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceRecordIds: [item.id] }),
      });
      const payload = (await response.json()) as {
        error?: string;
        action?: {
          id: string;
          draft: {
            subject: string;
            body: string;
            destination: string;
            groundingMode: "deterministic" | "model";
          };
        };
      };
      if (!response.ok || !payload.action) {
        throw new Error(payload.error ?? "Vexa could not prepare this reply.");
      }
      setPreparedReply({
        actionId: payload.action.id,
        ...payload.action.draft,
      });
    } catch (error) {
      setReviewItem(null);
      setToast(error instanceof Error ? error.message : "Reply preparation failed.");
    } finally {
      setPreparingReply(false);
    }
  }

  function openInboxReply(item: InboxItem) {
    const inboxMode = inboxData?.mode ?? "fixture";
    void openActionReview(
      {
        id: item.id,
        category: "work",
        urgency: item.priorityScore >= 85 ? "high" : "normal",
        title: item.subject,
        summary: item.preview,
        rationale: item.reason,
        dueLabel: "From unified inbox",
        citations: [
          {
            id: `inbox-${item.id}`,
            integration: item.channel,
            sourceType: inboxMode === "live" ? "gmail-message" : "demo-message",
            sourceLabel: item.subject,
            sourceUrl: item.sourceUrl,
            observedAt: item.occurredAt,
          },
        ],
        action: {
          id: `inbox-action-${item.id}`,
          kind: "reply",
          label: "Prepare grounded reply",
          destination: item.senderEmail,
          status: "recommended",
        },
      },
      inboxMode === "live",
    );
  }

  function openRelationshipFollowup(person: RelationshipPerson) {
    const evidence = person.evidence[0];
    if (!evidence) {
      setToast("No Gmail evidence is available for this relationship yet.");
      return;
    }
    const relationshipMode = relationships?.mode ?? "fixture";
    void openActionReview(
      {
        id: evidence.sourceRecordId,
        category: "work",
        urgency: person.signal === "needs_reply" || person.signal === "opportunity" ? "high" : "normal",
        title: evidence.sourceLabel,
        summary: evidence.excerpt,
        rationale: person.detail,
        dueLabel: "From relationship memory",
        citations: [
          {
            id: `relationship-${evidence.sourceRecordId}`,
            integration: person.channel,
            sourceType: relationshipMode === "live" ? "gmail-message" : "demo-message",
            sourceLabel: evidence.sourceLabel,
            sourceUrl: evidence.sourceUrl,
            observedAt: evidence.occurredAt,
          },
        ],
        action: {
          id: `relationship-action-${person.id}`,
          kind: "reply",
          label: `Prepare follow-up for ${person.name}`,
          destination: person.email,
          status: "recommended",
        },
      },
      relationshipMode === "live",
    );
  }

  async function completeAction(item: BriefingItem) {
    if (preparedReply) {
      try {
        const response = await fetch(
          `/api/v1/actions/${preparedReply.actionId}/transition`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: "approve" }),
          },
        );
        const payload = (await response.json()) as { error?: string; message?: string };
        if (!response.ok) {
          throw new Error(payload.message ?? payload.error ?? "Approval failed.");
        }
        setSentActions((current) => [...current, item.id]);
        setReviewItem(null);
        setPreparedReply(null);
        setActionCenter(null);
        setToast("Grounded draft approved and recorded. Gmail sending stays disabled until its write scope is enabled.");
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Approval failed.");
      }
      return;
    }

    setSentActions((current) => [...current, item.id]);
    setReviewItem(null);
    setToast("Approved in demo mode. No external message was sent.");
  }

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span>V</span><i /></div>
          <div><span className="brand-name">vexa</span><span className="brand-beta">INTELLIGENCE OS</span></div>
          <button className="icon-button close-nav" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Command center</p>
          {primaryNavigation.map(({ label, icon: Icon, count }) => (
            <button className={`nav-item ${activeView === label ? "active" : ""}`} key={label} onClick={() => chooseView(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}
            </button>
          ))}
          <p className="nav-label spaces-label">Intelligence spaces</p>
          {spaces.map(({ label, icon: Icon, color }) => (
            <button className="nav-item" key={label} onClick={() => setToast(`${label} space is ready for live connectors.`)}>
              <span className={`space-icon ${color}`}><Icon size={15} /></span><span>{label}</span><ChevronRight className="nav-chevron" size={14} />
            </button>
          ))}
        </nav>
        <div className="trust-card"><div className="trust-card-icon"><ShieldCheck size={18} /></div><div><strong>Protection is on</strong><span>Every external action waits for you.</span></div><span className="trust-score">96</span></div>
        <div className="sidebar-footer"><button className="nav-item"><Settings size={18} /><span>Settings</span></button><button className="nav-item" onClick={() => void logout()}><LogOut size={18} /><span>{viewer ? "Log out" : "Exit demo"}</span></button><div className="profile-chip"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><span>{viewer?.organizationName ?? "Demo workspace"}</span></div><ChevronRight size={15} /></div></div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div><p>{currentDate}</p><strong>{activeView}</strong></div></div>
          <button className="search-shell" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Ask Vexa or search anything</span><kbd><Command size={11} /> K</kbd></button>
          <div className="top-actions"><button className={`connection-button ${googleConnected ? "connected" : ""}`} disabled={syncing} onClick={googleConnected ? synchronizeGoogle : connectGoogle}>{syncing ? <RefreshCw className="spin" size={14} /> : googleConnected ? <Cloud size={14} /> : <Link2 size={14} />}<span>{syncing ? "Syncing" : googleConnected ? "Sync Google" : "Connect Google"}</span></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button><button className="avatar avatar-button" aria-label="Open profile">{initials}</button></div>
        </header>
        <div className="page-content">
          <div className={`mode-banner ${sourceMode}`}><span><i />{sourceMode === "live" ? "LIVE GOOGLE EVIDENCE" : googleConnected ? "GOOGLE CONNECTED · SYNC NEEDED" : "DEMO WORKSPACE"}</span><p>{sourceMode === "live" ? "Today uses live Gmail and Calendar records. Social, market, voice, and generated actions remain demos." : googleConnected ? "Run Google sync to replace the attention queue with live evidence." : "Connect Google Workspace to activate the real briefing. Demo surfaces are clearly separated."}</p>{googleConnected ? <button disabled={syncing} onClick={synchronizeGoogle}>{syncing ? "Syncing..." : "Sync now"}</button> : <button onClick={connectGoogle}>Connect</button>}</div>
          {activeView === "Today" && <TodayView briefingItems={briefingItems} schedule={schedule} sentActions={sentActions} sourceMode={sourceMode} firstName={firstName} googleConnected={googleConnected} onSync={synchronizeGoogle} onOpenOrb={() => setOrbOpen(true)} onReview={openActionReview} onNavigate={chooseView} />}
          {activeView === "Inbox" && <InboxView data={inboxData} loading={inboxLoading} error={inboxError} onOpenOrb={() => setOrbOpen(true)} onReload={() => void loadInbox()} onReview={openInboxReply} />}
          {activeView === "People" && <PeopleView data={relationships} loading={relationshipsLoading} error={relationshipsError} onReload={() => void loadRelationships()} onReview={openRelationshipFollowup} />}
          {activeView === "Focus" && <FocusView data={focusPlan} loading={focusLoading} error={focusError} onReload={() => void loadFocusPlan()} onToast={setToast} />}
          {activeView === "Actions" && <ActionCenterView data={actionCenter} loading={actionCenterLoading} error={actionCenterError} decisionBusy={actionDecisionBusy} revisionBusy={actionRevisionBusy} onReload={() => void loadActionCenter()} onDecide={(actionId, command) => void decideAction(actionId, command)} onRevise={reviseAction} />}
        </div>
      </main>

      <button className="orb-launcher" onClick={() => setOrbOpen(true)} aria-label="Ask Vexa"><span className="orb-core"><Sparkles size={20} /></span><span><strong>Ask Vexa</strong><small>Across every source</small></span></button>

      {orbOpen && (
        <div className="orb-overlay" role="dialog" aria-modal="true" aria-labelledby="orb-title">
          <button className="orb-scrim" aria-label="Close Vexa" onClick={() => setOrbOpen(false)} />
          <section className="orb-panel">
            <header><div className="orb-title-row"><span className="orb-mini"><Sparkles size={17} /></span><div><p>Vexa intelligence</p><h2 id="orb-title">Ask across your world</h2></div></div><button className="icon-button" onClick={() => setOrbOpen(false)} aria-label="Close Vexa"><X size={20} /></button></header>
            <div className="orb-context-bar"><ShieldCheck size={14} /><span>Searching only sources you approved</span><strong>{sourceMode === "live" ? "GMAIL + CALENDAR" : "DEMO EVIDENCE"}</strong></div>
            <div className="orb-content">
              {orbExchanges.length === 0 ? (
                <><div className="orb-visual"><span /><div><Sparkles size={26} /></div></div><h3>What do you want to move forward?</h3><p className="orb-intro">I connect the dots, show my evidence, and prepare actions. Nothing leaves Vexa without your approval.</p><div className="prompt-grid">
                  <button onClick={() => submitQuestion("What is blocking today's launch review?")}><BriefcaseBusiness size={16} /><span><strong>Unblock the launch</strong>Find the decision and prepare the follow-up</span></button>
                  <button onClick={() => submitQuestion("Who needs a reply from me today?")}><MessageCircleMore size={16} /><span><strong>Close open loops</strong>Rank every unanswered conversation</span></button>
                  <button onClick={() => submitQuestion("Where is the biggest opportunity this week?")}><Radar size={16} /><span><strong>Find opportunities</strong>Connect market and relationship signals</span></button>
                  <button onClick={() => submitQuestion("Protect two hours of focus time today")}><Gauge size={16} /><span><strong>Protect my focus</strong>Build a realistic plan around meetings</span></button>
                </div></>
              ) : (
                <div className="conversation" aria-live="polite">{orbExchanges.map((exchange) => <div className="exchange" key={exchange.id}><p className="user-message">{exchange.question}</p><div className="orb-answer"><span className="orb-mini"><Sparkles className={!exchange.response && !exchange.error ? "spin" : ""} size={14} /></span><div>{exchange.response ? <><span className={`answer-label ${exchange.response.mode}`}>{exchange.response.mode === "live" ? "LIVE GROUNDED ANSWER" : "DEMO GROUNDED ANSWER"} · {exchange.response.citations.length} {exchange.response.citations.length === 1 ? "SOURCE" : "SOURCES"}</span><p>{exchange.response.answer}</p>{exchange.response.completenessWarning && <div className="answer-warning"><ShieldCheck size={13} /><span>{exchange.response.completenessWarning}</span></div>}<div className="answer-actions"><button className="source-button" onClick={() => setExpandedOrbSources((current) => current === exchange.id ? null : exchange.id)}><BookOpen size={14} />{expandedOrbSources === exchange.id ? "Hide evidence" : `Inspect ${exchange.response.citations.length} ${exchange.response.citations.length === 1 ? "source" : "sources"}`}</button>{exchange.response.suggestedAction && <button className="mini-action" onClick={() => prepareOrbAction(exchange.response!)}>{exchange.response.suggestedAction.label}<ArrowRight size={13} /></button>}</div>{expandedOrbSources === exchange.id && <div className="orb-sources">{exchange.response.citations.map((citation) => <article key={citation.id}><div><CircleCheck size={13} /><span><strong>{citation.integration}</strong><small>{citation.sourceLabel}</small></span></div><p>{citation.excerpt}</p>{citation.sourceUrl && <a href={citation.sourceUrl} target="_blank" rel="noreferrer">Open original <ArrowRight size={11} /></a>}</article>)}</div>}</> : exchange.error ? <><span className="answer-label error">SEARCH INCOMPLETE</span><p>{exchange.error}</p></> : <><span className="answer-label">SEARCHING APPROVED SOURCES</span><p>Connecting the closest evidence without inventing missing details…</p></>}</div></div></div>)}</div>
              )}
            </div>
            <footer><div className="orb-input"><button className="icon-button" disabled aria-label="Voice input coming later" title="Voice input coming later"><Mic size={18} /></button><input ref={inputRef} value={query} disabled={orbBusy} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void submitQuestion()} placeholder={orbBusy ? "Searching approved sources..." : "Ask, search, or tell Vexa what to prepare..."} aria-label="Ask Vexa"/><button className="send-button" disabled={orbBusy || query.trim().length < 2} onClick={() => void submitQuestion()} aria-label="Send question"><Send size={16} /></button></div><p><LockKeyhole size={11} />Evidence first · approval always · your data stays yours</p></footer>
          </section>
        </div>
      )}

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} onOpenOrb={() => { setSearchOpen(false); setOrbOpen(true); }} onNavigate={(view) => { setSearchOpen(false); chooseView(view); }} />}
      {reviewItem && <ActionReview item={reviewItem} preparedReply={preparedReply} loading={preparingReply} onClose={() => { setReviewItem(null); setPreparedReply(null); }} onConfirm={() => completeAction(reviewItem)} />}
      {toast && <div className="toast" role="status"><CircleCheck size={17} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}

function TodayView({ briefingItems, schedule, sentActions, sourceMode, firstName, googleConnected, onSync, onOpenOrb, onReview, onNavigate }: { briefingItems: BriefingItem[]; schedule: ScheduleItem[]; sentActions: string[]; sourceMode: "live" | "fixture"; firstName: string; googleConnected: boolean; onSync: () => void; onOpenOrb: () => void; onReview: (item: BriefingItem) => void; onNavigate: (view: View) => void }) {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy"><span className="hero-kicker"><i /> YOUR EXECUTIVE PULSE · {sourceMode === "live" ? "LIVE" : "DEMO"}</span><h1>Good morning, {firstName}.<br /><em>Your day is under control.</em></h1><p>{sourceMode === "live" ? <>Vexa ranked <strong>{briefingItems.length} live signals</strong> from your Gmail and Calendar evidence.</> : <>Vexa is showing a <strong>guided demonstration</strong>. Connect and sync Google to rank your real work.</>}</p><div className="hero-actions"><button className="primary-button" onClick={onOpenOrb}><Play size={15} fill="currentColor" />Play 62-sec briefing</button><button className="ghost-button" onClick={() => onNavigate("Focus")}>See my plan <ArrowRight size={14} /></button></div></div>
        <div className="pulse-visual" aria-hidden="true"><div className="pulse-orbit orbit-one"><i /></div><div className="pulse-orbit orbit-two"><i /></div><div className="pulse-core"><Sparkles size={26} /><span>19</span><small>signals<br />connected</small></div><span className="pulse-label label-work">WORK · 9</span><span className="pulse-label label-people">PEOPLE · 6</span><span className="pulse-label label-market">MARKET · 4</span></div>
        <div className="hero-proof"><ShieldCheck size={14} /><span>Evidence coverage</span><strong>96%</strong><i><b /></i></div>
      </section>

      <section className="signal-strip" aria-label="Daily status">
        <button onClick={() => onNavigate("Inbox")}><span className="signal-icon coral"><MessageCircleMore size={18} /></span><div><strong>7 open loops</strong><small>3 need you today</small></div><ChevronRight size={15} /></button>
        <button onClick={() => onNavigate("Focus")}><span className="signal-icon violet"><Gauge size={18} /></span><div><strong>2h 40m protected</strong><small>Best focus block at 10:35</small></div><ChevronRight size={15} /></button>
        <button onClick={() => onNavigate("People")}><span className="signal-icon mint"><Users size={18} /></span><div><strong>1 warm opportunity</strong><small>Atlas Labs replied 8m ago</small></div><ChevronRight size={15} /></button>
        <div className="energy-signal"><span><Activity size={17} /></span><div><strong>Calm load</strong><small>24% lighter than Tuesday</small></div></div>
      </section>

      <div className="command-grid">
        <section className="attention-section" aria-labelledby="attention-heading"><div className="section-heading"><div><p className="section-kicker">Ranked by impact, not recency</p><h2 id="attention-heading">Your attention queue <span>{briefingItems.length}</span></h2></div><button className="text-button" onClick={() => onNavigate("Inbox")}>See every open loop <ArrowRight size={14} /></button></div><div className="attention-list">
          {briefingItems.map((item, index) => { const Icon = categoryIcons[item.category]; const isDone = sentActions.includes(item.id); return <article className={`attention-card ${index === 0 ? "featured" : ""}`} key={item.id}><div className={`priority-rail ${item.category}`}><span>0{index + 1}</span><i /></div><div className="attention-body"><div className="attention-meta"><span className={`category-chip ${item.category}`}><Icon size={12} />{categoryLabels[item.category]}</span><span className="due-chip"><Clock3 size={12} />{item.dueLabel}</span>{index === 0 && <span className="impact-chip"><Zap size={11} fill="currentColor" />Highest leverage</span>}</div><h3>{item.title}</h3><p>{item.summary}</p><div className="reason-line"><span><Sparkles size={13} /></span><p><strong>Why now</strong>{item.rationale}</p></div><div className="attention-footer"><button className="source-button"><Link2 size={13} />{item.citations.length} verified {item.citations.length === 1 ? "source" : "sources"}<ChevronRight size={12} /></button>{item.action && <button className={`action-button ${isDone ? "completed" : ""}`} disabled={isDone} onClick={() => onReview(item)}>{isDone ? <><Check size={14} />Sent in demo</> : <>{item.action.label}<ArrowRight size={14} /></>}</button>}</div></div></article>; })}
        </div></section>

        <aside className="day-rail" aria-label="Today's plan"><section className="focus-card"><div className="focus-card-head"><div><p className="section-kicker">Next best move</p><h2>Protect the next 55 min</h2></div><span className="focus-live"><i />LIVE</span></div><div className="focus-task"><span className="focus-play"><Play size={15} fill="currentColor" /></span><div><strong>Resolve launch decisions</strong><small>10:35 – 11:30 · before stand-up notes</small></div></div><div className="focus-track"><span style={{ width: "32%" }} /></div><div className="focus-stats"><span><strong>0</strong> conflicts</span><span><strong>2</strong> blockers cleared</span><span><strong>55m</strong> protected</span></div><button className="rail-primary" onClick={() => onNavigate("Focus")}>Open focus plan <ArrowRight size={14} /></button></section>
          <section className="schedule-card"><div className="rail-heading"><div><p className="section-kicker">Your runway</p><h2>Coming up</h2></div><CalendarDays size={18} /></div><div className="timeline">{schedule.map((item, index) => <div className="timeline-item" key={item.time}><div className="timeline-marker"><span />{index < schedule.length - 1 && <i />}</div><time>{item.time}</time><div><strong>{item.title}</strong><span>{item.meta}</span></div></div>)}</div><button className="rail-link" onClick={() => onNavigate("Focus")}>Rebalance my day <WandSparkles size={14} /></button></section>
          <section className="source-health-card"><div><span className="health-icon"><ShieldCheck size={16} /></span><p><strong>{sourceMode === "live" ? "Google evidence is live" : "Demo evidence is active"}</strong><small>{sourceMode === "live" ? "Gmail + Calendar fresh · other sources demo" : googleConnected ? "Google connected · sync required" : "Connect Google for live evidence"}</small></p></div><button aria-label="Synchronize sources" onClick={onSync} disabled={!googleConnected}><RefreshCw size={14} /></button></section>
        </aside>
      </div>

      <section className="opportunity-section" aria-labelledby="opportunity-heading"><div className="section-heading"><div><p className="section-kicker">Signals others miss</p><h2 id="opportunity-heading">Opportunity radar</h2></div><span className="radar-status"><i />Scanning 12 topics</span></div><div className="opportunity-grid">{opportunities.map(({ icon: Icon, type, title, detail, sources, tone }) => <article className="opportunity-card" key={title}><div className={`opportunity-icon ${tone}`}><Icon size={19} /></div><span className="opportunity-type">{type}</span><h3>{title}</h3><p>{detail}</p><div><span><Link2 size={12} />{sources}</span><button onClick={onOpenOrb}>Explore <ArrowRight size={13} /></button></div></article>)}</div></section>
    </>
  );
}

type InboxFilter = "all" | InboxCategory;

const inboxCategoryCopy: Record<InboxCategory, { label: string; tone: string }> = {
  priority: { label: "Priority", tone: "coral" },
  waiting: { label: "Waiting", tone: "blue" },
  opportunity: { label: "Opportunity", tone: "violet" },
  fyi: { label: "FYI", tone: "mint" },
};

function inboxRelativeTime(value: string): string {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (elapsedMinutes < 1) return "now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
  if (elapsedMinutes < 1_440) return `${Math.floor(elapsedMinutes / 60)}h`;
  return `${Math.floor(elapsedMinutes / 1_440)}d`;
}

function InboxView({ data, loading, error, onOpenOrb, onReload, onReview }: { data: InboxResponse | null; loading: boolean; error: string; onOpenOrb: () => void; onReload: () => void; onReview: (item: InboxItem) => void }) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesFilter = filter === "all" || item.category === filter;
    const matchesSearch = !normalizedSearch || [item.senderName, item.senderEmail, item.subject, item.preview]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesFilter && matchesSearch;
  });
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  if (loading && !data) {
    return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon coral"><Inbox size={20} /></span><div><p className="section-kicker">Unified inbox intelligence</p><h1>Ranking the messages that move work forward…</h1></div></div></div><div className="inbox-loading"><RefreshCw className="spin" size={20} />Reading authorized Gmail evidence</div></section>;
  }

  return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon coral"><Inbox size={20} /></span><div><p className="section-kicker">One inbox · ranked by consequence</p><h1>Only the messages that move work forward.</h1></div></div><div className="inbox-heading-actions"><button className="secondary-button" disabled={loading} onClick={onReload}><RefreshCw className={loading ? "spin" : ""} size={14} />Refresh</button><button className="primary-button" onClick={onOpenOrb}><Sparkles size={15} />Triage with Vexa</button></div></div>
    <div className={`inbox-mode ${data?.mode ?? "fixture"}`}><ShieldCheck size={15} /><div><strong>{data?.mode === "live" ? "LIVE GMAIL INBOX" : "DEMONSTRATION INBOX"}</strong><span>{data?.completenessWarning ?? "Messages are ranked from the sources authorized in this workspace."}</span></div></div>
    {error && <div className="action-error"><span>{error}</span><button onClick={onReload}>Try again</button></div>}
    <div className="inbox-toolbar"><label><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sender, subject, or message" aria-label="Search inbox" /></label><span><Radar size={13} />Deterministic ranking · no paid AI required</span></div>
    <div className="inbox-layout"><div className="message-list-panel"><div className="filter-row">{(["all", "priority", "waiting", "opportunity", "fyi"] as InboxFilter[]).map((value) => <button className={filter === value ? "filter-active" : ""} key={value} onClick={() => { setFilter(value); setSelectedId(null); }}>{value === "all" ? "All" : value === "opportunity" ? "Opportunities" : inboxCategoryCopy[value].label}<span>{value === "all" ? data?.summary.total ?? 0 : data?.summary[value] ?? 0}</span></button>)}</div><div className="message-list">{filtered.map((message) => { const category = inboxCategoryCopy[message.category]; return <button className={`message-row ${selected?.id === message.id ? "selected" : ""} ${message.unread ? "unread" : ""}`} onClick={() => setSelectedId(message.id)} key={message.id}><span className={`person-avatar ${category.tone}`}>{message.initials}</span><span className="message-copy"><span><strong>{message.senderName}</strong><time>{inboxRelativeTime(message.occurredAt)}</time></span><b>{message.subject}</b><small>{message.preview}</small><i>{message.channel}{message.unread ? " · unread" : ""}</i></span><span className={`priority-tag ${category.tone}`}>{category.label}</span></button>; })}{filtered.length === 0 && <div className="inbox-empty"><Search size={24} /><strong>No messages match this view</strong><span>Try another category or a broader search.</span></div>}</div></div>{selected ? <article className="message-detail"><header><div><span className={`person-avatar large ${inboxCategoryCopy[selected.category].tone}`}>{selected.initials}</span><div><h2>{selected.senderName}</h2><p>{selected.senderEmail} · {selected.channel} · {inboxRelativeTime(selected.occurredAt)} ago</p></div></div><span className={`priority-tag ${inboxCategoryCopy[selected.category].tone}`}>{inboxCategoryCopy[selected.category].label} · {selected.priorityScore}</span></header><div className={`thread-context ${data?.mode ?? "fixture"}`}><Sparkles size={15} /><p><strong>Why Vexa ranked this here</strong> {selected.reason}</p></div><div className="message-content"><span>{selected.subject}</span><p>{selected.preview}</p>{selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open original evidence <ArrowRight size={12} /></a>}</div><div className="draft-box"><div><span><WandSparkles size={15} />GROUNDED REPLY AVAILABLE</span><span className={`inbox-mode-pill ${data?.mode ?? "fixture"}`}>{data?.mode === "live" ? "LIVE EVIDENCE" : "SAFE DEMO"}</span></div><p>{data?.mode === "live" ? "Vexa can prepare a deterministic reply from this exact Gmail record, preserve its evidence lineage, and place the payload behind approval." : "Explore the reply-review experience safely. Demo mode never contacts this person or sends anything externally."}</p><div><span><ShieldCheck size={13} />Nothing sends without approval</span><button className="action-button" onClick={() => onReview(selected)}>Prepare reply <ArrowRight size={13} /></button></div></div></article> : <article className="message-detail inbox-detail-empty"><Inbox size={28} /><h2>Select a message</h2><p>Its ranking reason and approval-safe reply handoff will appear here.</p></article>}</div>
  </section>;
}

type RelationshipFilter = "all" | RelationshipSignal;

const relationshipSignalCopy: Record<RelationshipSignal, { label: string; tone: string }> = {
  needs_reply: { label: "Needs reply", tone: "coral" },
  waiting: { label: "Waiting", tone: "blue" },
  opportunity: { label: "Opportunity", tone: "violet" },
  active: { label: "Active", tone: "mint" },
};

function PeopleView({ data, loading, error, onReload, onReview }: { data: RelationshipsResponse | null; loading: boolean; error: string; onReload: () => void; onReview: (person: RelationshipPerson) => void }) {
  const [filter, setFilter] = useState<RelationshipFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const normalizedSearch = search.trim().toLowerCase();
  const people = (data?.people ?? []).filter((person) => {
    const matchesFilter = filter === "all" || person.signal === filter;
    const matchesSearch = !normalizedSearch || [person.name, person.email, person.detail]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesFilter && matchesSearch;
  });
  const commitments = (data?.people ?? []).flatMap((person) =>
    person.commitments.map((commitment) => ({ person, commitment })),
  ).sort((left, right) =>
    new Date(right.commitment.occurredAt).getTime() - new Date(left.commitment.occurredAt).getTime(),
  );

  if (loading && !data) {
    return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon mint"><Users size={20} /></span><div><p className="section-kicker">Evidence-backed relationship intelligence</p><h1>Connecting people, conversations, and commitments…</h1></div></div></div><div className="inbox-loading"><RefreshCw className="spin" size={20} />Building authorized Gmail relationship memory</div></section>;
  }

  return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon mint"><Users size={20} /></span><div><p className="section-kicker">Evidence-backed relationship intelligence</p><h1>Remember the promise, not just the person.</h1></div></div><button className="secondary-button" disabled={loading} onClick={onReload}><RefreshCw className={loading ? "spin" : ""} size={14} />Refresh memory</button></div>
    <div className={`inbox-mode ${data?.mode ?? "fixture"}`}><ShieldCheck size={15} /><div><strong>{data?.mode === "live" ? "LIVE GMAIL RELATIONSHIP MEMORY" : "DEMONSTRATION RELATIONSHIP MEMORY"}</strong><span>{data?.completenessWarning ?? "People and commitments are derived only from sources authorized in this workspace."}</span></div></div>
    {error && <div className="action-error"><span>{error}</span><button onClick={onReload}>Try again</button></div>}
    <div className="people-summary"><div><strong>{data?.summary.total ?? 0}</strong><span>recent relationships</span></div><div><strong>{data?.summary.followUps ?? 0}</strong><span>follow-ups surfaced</span></div><div><strong>{data?.summary.opportunities ?? 0}</strong><span>warm opportunities</span></div><div><strong>{data?.summary.commitments ?? 0}</strong><span>evidence-linked commitments</span></div></div>
    <div className="people-toolbar"><label><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a person or relationship signal" aria-label="Search relationships" /></label><div>{(["all", "needs_reply", "waiting", "opportunity", "active"] as RelationshipFilter[]).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{value === "all" ? "All" : relationshipSignalCopy[value].label}</button>)}</div></div>
    {people.length ? <div className="people-grid relationship-grid">{people.map((person) => { const signal = relationshipSignalCopy[person.signal]; const expanded = expandedId === person.id; return <article className={`person-card ${expanded ? "expanded" : ""}`} key={person.id}><div className="person-card-top"><span className={`person-avatar xl ${signal.tone}`}>{person.initials}</span><span className="relationship-score">{person.score}<small>signal</small></span></div><span className={`relationship-signal ${signal.tone}`}><i />{signal.label}</span><h2>{person.name}</h2><p className="person-role">{person.email} · {person.channel}</p><div className="memory-note"><Sparkles size={14} /><p>{person.detail}</p></div><div className="relationship-metrics"><span><strong>{person.messageCount}</strong>messages</span><span><strong>{person.inboundCount}</strong>inbound</span><span><strong>{person.outboundCount}</strong>outbound</span></div>{expanded && <div className="relationship-evidence"><span>RECENT EVIDENCE</span>{person.evidence.map((evidence) => <article key={evidence.sourceRecordId}><div><i className={evidence.direction} /> <strong>{evidence.sourceLabel}</strong><small>{evidence.direction} · {inboxRelativeTime(evidence.occurredAt)} ago</small></div><p>{evidence.excerpt}</p>{evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open source <ArrowRight size={11} /></a>}</article>)}</div>}<div className="person-card-footer"><span>Last contact {inboxRelativeTime(person.lastContactAt)} ago</span><div><button onClick={() => setExpandedId(expanded ? null : person.id)}>{expanded ? "Close memory" : "Inspect memory"}</button><button className="person-followup" onClick={() => onReview(person)}>Prepare follow-up <ArrowRight size={13} /></button></div></div></article>; })}</div> : <div className="people-empty"><UserRoundSearch size={28} /><h2>No relationships match this view</h2><p>Try another signal or a broader search.</p></div>}
    <section className="commitment-ledger"><div><p className="section-kicker">Vexa memory</p><h2>Promises and open loops worth keeping</h2></div>{commitments.length ? commitments.slice(0, 6).map(({ person, commitment }) => <div className="commitment-row" key={commitment.id}><span className={`commitment-check ${commitment.status}`}><Clock3 size={16} /></span><div><strong>{commitment.title}</strong><small>{person.name} · {commitment.summary}</small></div><span className="evidence-pill"><Link2 size={12} />Gmail evidence</span><span className={`commitment-status ${commitment.status}`}>{commitment.status}</span><button onClick={() => onReview(person)}>Prepare follow-up <ArrowRight size={13} /></button></div>) : <div className="commitment-empty"><CircleCheck size={22} /><span>No open commitments detected in this view.</span></div>}</section>
  </section>;
}

function focusTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(value));
}

function focusDay(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(value));
}

function focusDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function FocusView({ data, loading, error, onReload, onToast }: { data: FocusPlanResponse | null; loading: boolean; error: string; onReload: () => void; onToast: (message: string) => void }) {
  const [staged, setStaged] = useState<string[]>([]);
  const timeZone = data?.timeZone ?? "Africa/Lagos";
  const timeline = data
    ? [
        ...data.events.map((event) => ({ kind: "event" as const, at: event.startAt, event })),
        ...data.proposals.map((proposal) => ({ kind: "proposal" as const, at: proposal.startAt, proposal })),
      ].sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime())
    : [];

  function stageProposal(proposal: FocusProposal) {
    setStaged((current) => current.includes(proposal.id) ? current : [...current, proposal.id]);
    onToast("Focus block staged for approval. No Google Calendar change was made.");
  }

  if (loading && !data) {
    return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon violet"><Gauge size={20} /></span><div><p className="section-kicker">Evidence-backed adaptive planning</p><h1>Calculating protected time from your calendar…</h1></div></div></div><div className="inbox-loading"><RefreshCw className="spin" size={20} />Checking availability, buffers, and conflicts</div></section>;
  }

  return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon violet"><Gauge size={20} /></span><div><p className="section-kicker">Evidence-backed adaptive planning</p><h1>Make room for the work that actually matters.</h1></div></div><button className="secondary-button" disabled={loading} onClick={onReload}><RefreshCw className={loading ? "spin" : ""} size={14} />Recalculate</button></div>
    <div className={`inbox-mode ${data?.mode ?? "fixture"}`}><ShieldCheck size={15} /><div><strong>{data?.mode === "live" ? "LIVE GOOGLE CALENDAR PLAN" : "DEMONSTRATION FOCUS PLAN"}</strong><span>{data?.completenessWarning ?? "Focus windows are calculated only from calendar evidence authorized in this workspace."}</span></div></div>
    {error && <div className="action-error"><span>{error}</span><button onClick={onReload}>Try again</button></div>}
    {data && <><div className="focus-summary"><article><span>Meetings</span><strong>{data.summary.meetings}</strong><small>{focusDuration(data.summary.busyMinutes)} occupied</small></article><article><span>Available</span><strong>{focusDuration(data.summary.freeMinutes)}</strong><small>After 10-minute buffers</small></article><article><span>Focus blocks</span><strong>{data.summary.focusBlocks}</strong><small>Long enough for real progress</small></article><article className={data.summary.conflicts ? "conflict" : "clear"}><span>Conflicts</span><strong>{data.summary.conflicts}</strong><small>{data.summary.conflicts ? "Calendar overlaps detected" : "No overlapping events"}</small></article></div>
      <div className="focus-dashboard"><section className="focus-score-card"><div className="score-ring" style={{ background: `conic-gradient(#7257ff 0 ${data.score}%,rgba(255,255,255,.08) ${data.score}% 100%)` }}><span>{data.score}</span><small>FOCUS<br />SCORE</small></div><div><span className={`hero-kicker ${data.health}`}><i /> {data.health.toUpperCase()} PLAN</span><h2>{data.health === "healthy" ? "Your day has room for meaningful progress." : data.health === "tight" ? "Your day needs careful protection." : "Your calendar needs attention before deep work."}</h2><p>{data.explanation}</p><div><span><Check size={13} />{focusDuration(data.summary.freeMinutes)} available</span><span><ShieldCheck size={13} />{data.summary.focusBlocks} protected proposals</span><span><CalendarDays size={13} />{data.summary.meetings} live events</span></div></div></section><section className="day-plan-card"><header><div><p className="section-kicker">{focusDay(data.dayStart, timeZone)} · calculated plan</p><h2>Your time, defended</h2></div><span>{focusTime(data.dayStart, timeZone)} — {focusTime(data.dayEnd, timeZone)}</span></header><div className="day-plan">{timeline.length ? timeline.map((item) => item.kind === "proposal" ? <div className="plan-row focus" key={item.proposal.id}><time>{focusTime(item.proposal.startAt, timeZone)}</time><span /><div><strong>{item.proposal.title}</strong><small>Proposed focus · {focusDuration(item.proposal.durationMinutes)} · approval required</small></div><ShieldCheck size={15} /></div> : <div className={`plan-row ${item.event.conflict ? "conflict" : ""}`} key={item.event.id}><time>{focusTime(item.event.startAt, timeZone)}</time><span /><div><strong>{item.event.title}</strong><small>{item.event.location ?? "Google Calendar"} · {focusDuration(item.event.durationMinutes)}{item.event.conflict ? " · conflict" : ""}</small></div>{item.event.sourceUrl ? <a href={item.event.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.event.title}`}><CalendarDays size={15} /></a> : <CalendarDays size={15} />}</div>) : <div className="focus-empty"><CalendarDays size={24} /><strong>No calendar events in this workday</strong><span>The full day is available for protected work.</span></div>}</div></section></div>
      <section className="focus-proposals"><div className="section-heading"><div><p className="section-kicker">Approval-gated calendar protection</p><h2>Recommended focus blocks <span>{data.proposals.length}</span></h2></div><span className="focus-write-status"><LockKeyhole size={12} />Calendar writes disabled</span></div><div className="focus-proposal-grid">{data.proposals.length ? data.proposals.map((proposal) => { const isStaged = staged.includes(proposal.id); return <article key={proposal.id}><div><span className="focus-proposal-icon"><Zap size={17} /></span><span className="proposal-time">{focusTime(proposal.startAt, timeZone)} — {focusTime(proposal.endAt, timeZone)}</span></div><h3>{proposal.title}</h3><p>{proposal.reason}</p><footer><span><ShieldCheck size={12} />{focusDuration(proposal.durationMinutes)} protected</span><button disabled={isStaged} onClick={() => stageProposal(proposal)}>{isStaged ? <><Check size={13} />Staged</> : <>Stage for approval <ArrowRight size={13} /></>}</button></footer></article>; }) : <div className="focus-empty"><Clock3 size={24} /><strong>No safe focus block found</strong><span>Resolve a conflict or free at least 45 uninterrupted minutes.</span></div>}</div><div className="focus-safety-note"><ShieldCheck size={15} /><p><strong>Vexa is proposing, not editing.</strong> Staging a block does not modify Google Calendar. External calendar writes remain disabled until write scope, exact-payload approval, and idempotent execution are enabled.</p></div></section>
      <section className="free-window-section"><div><p className="section-kicker">Availability evidence</p><h2>Every remaining window</h2></div><div>{data.freeWindows.map((window) => <article className={window.recommended ? "recommended" : ""} key={window.id}><span>{focusTime(window.startAt, timeZone)} — {focusTime(window.endAt, timeZone)}</span><strong>{focusDuration(window.durationMinutes)}</strong><small>{window.recommended ? "Recommended" : "Available"}</small></article>)}</div></section></>}
  </section>;
}

type ActionFilter = "all" | "awaiting_approval" | "approved" | "rejected";

function actionStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function actionDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function payloadText(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function ActionCenterView({ data, loading, error, decisionBusy, revisionBusy, onReload, onDecide, onRevise }: { data: ActionCenterResponse | null; loading: boolean; error: string; decisionBusy: string | null; revisionBusy: string | null; onReload: () => void; onDecide: (actionId: string, command: "approve" | "reject") => void; onRevise: (actionId: string, revision: ReplyRevisionInput) => Promise<boolean> }) {
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [inspectedVersion, setInspectedVersion] = useState<number | null>(null);
  const actions = data?.actions ?? [];
  const filtered = filter === "all" ? actions : actions.filter((action) => action.status === filter);
  const selected = filtered.find((action) => action.id === selectedId) ?? filtered[0];
  const historical = selected?.versions.find((version) => version.payloadVersion === inspectedVersion);
  const visiblePayload = historical?.payload ?? selected?.payload;
  const visibleVersion = historical?.payloadVersion ?? selected?.payloadVersion;
  const isEditing = selected?.id === editingId;

  function selectAction(actionId: string) {
    setSelectedId(actionId);
    setEditingId(null);
    setInspectedVersion(null);
  }

  function beginRevision() {
    if (!selected) return;
    setEditSubject(payloadText(selected.payload, "subject") ?? "");
    setEditBody(payloadText(selected.payload, "body") ?? "");
    setInspectedVersion(null);
    setEditingId(selected.id);
  }

  async function saveRevision() {
    if (!selected || editBody.trim().length === 0) return;
    const saved = await onRevise(selected.id, {
      ...(editSubject.trim() ? { subject: editSubject } : {}),
      body: editBody,
    });
    if (saved) {
      setEditingId(null);
      setInspectedVersion(null);
    }
  }

  if (loading && !data) {
    return <section className="workspace-view"><div className="view-heading"><div><span className="view-icon mint"><ListChecks size={20} /></span><div><p className="section-kicker">Approval control center</p><h1>Loading your action ledger…</h1></div></div></div><div className="action-loading"><RefreshCw className="spin" size={20} />Retrieving exact payloads and audit records</div></section>;
  }

  return <section className="workspace-view action-center"><div className="view-heading"><div><span className="view-icon mint"><ListChecks size={20} /></span><div><p className="section-kicker">Approval control center</p><h1>Every proposed move. Nothing hidden.</h1></div></div><button className="secondary-button" disabled={loading} onClick={onReload}><RefreshCw className={loading ? "spin" : ""} size={14} />Refresh ledger</button></div>
    <div className={`action-mode ${data?.mode ?? "fixture"}`}><ShieldCheck size={15} /><div><strong>{data?.mode === "live" ? "LIVE AUDIT LEDGER" : "DEMONSTRATION LEDGER"}</strong><span>{data?.mode === "live" ? "These actions, versions, sources, and decisions are persisted in your workspace." : "Explore editing and approval safely. Decisions here do not execute or contact anyone."}</span></div></div>
    {error && <div className="action-error"><span>{error}</span><button onClick={onReload}>Try again</button></div>}
    <div className="action-summary"><article><span>All actions</span><strong>{data?.summary.total ?? 0}</strong><small>Exact payloads tracked</small></article><article className="pending"><span>Needs approval</span><strong>{data?.summary.awaitingApproval ?? 0}</strong><small>Waiting for your decision</small></article><article className="approved"><span>Approved</span><strong>{data?.summary.approved ?? 0}</strong><small>Recorded, not sent</small></article><article className="rejected"><span>Rejected</span><strong>{data?.summary.rejected ?? 0}</strong><small>Blocked from execution</small></article></div>
    <div className="action-filters" role="group" aria-label="Filter actions">{(["all", "awaiting_approval", "approved", "rejected"] as ActionFilter[]).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => { setFilter(value); setEditingId(null); setInspectedVersion(null); }}>{value === "all" ? "All" : actionStatusLabel(value)}<span>{value === "all" ? actions.length : actions.filter((action) => action.status === value).length}</span></button>)}</div>
    {filtered.length === 0 ? <div className="action-empty"><CircleCheck size={28} /><h2>No actions in this view</h2><p>When Vexa prepares something for review, its payload, evidence, and complete decision history will appear here.</p></div> : <div className="action-center-grid"><div className="action-list" aria-label="Action ledger">{filtered.map((action) => <button className={selected?.id === action.id ? "selected" : ""} key={action.id} onClick={() => selectAction(action.id)}><span className={`action-kind ${action.status}`}><Send size={15} /></span><span className="action-list-copy"><span><strong>{action.label}</strong><time>{actionDate(action.updatedAt)}</time></span><small>{action.destination}</small><span className={`action-status ${action.status}`}><i />{actionStatusLabel(action.status)}</span></span><ChevronRight size={15} /></button>)}</div>{selected && visiblePayload && <article className="action-detail"><header><div><span className={`action-status ${selected.status}`}><i />{actionStatusLabel(selected.status)}</span><h2>{selected.label}</h2><p>Prepared for <strong>{selected.destination}</strong></p></div><span className="payload-version">PAYLOAD V{selected.payloadVersion}</span></header>
      <div className="action-safety-note"><ShieldCheck size={17} /><p><strong>Approval is payload-scoped.</strong>{isEditing ? "Saving creates a new immutable version and invalidates every prior approval." : selected.status === "approved" ? "This exact version is approved, but external execution is still disabled." : selected.status === "rejected" ? "This proposal is blocked and cannot execute." : "Any edit creates a new version and requires a new approval."}</p></div>
      <section className={`payload-card ${isEditing ? "editing" : ""}`}><div><span>{historical ? "HISTORICAL PAYLOAD" : "EXACT PAYLOAD"}</span><small>{payloadText(visiblePayload, "groundingMode") ?? "prepared"} · version {visibleVersion}</small></div>{isEditing ? <div className="payload-edit-form"><label>Subject<input value={editSubject} maxLength={300} onChange={(event) => setEditSubject(event.target.value)} /></label><label>Message<textarea value={editBody} maxLength={10_000} onChange={(event) => setEditBody(event.target.value)} /></label><div className="revision-warning"><LockKeyhole size={13} /><span>Destination and evidence lineage stay locked. This becomes payload v{selected.payloadVersion + 1}.</span></div><div className="payload-edit-actions"><button onClick={() => setEditingId(null)}>Cancel</button><button disabled={revisionBusy === selected.id || editBody.trim().length === 0} onClick={() => void saveRevision()}>{revisionBusy === selected.id ? <RefreshCw className="spin" size={13} /> : <Check size={13} />}Save & request approval</button></div></div> : <>{payloadText(visiblePayload, "subject") && <label>Subject<strong>{payloadText(visiblePayload, "subject")}</strong></label>}<label>Message<pre>{payloadText(visiblePayload, "body") ?? JSON.stringify(visiblePayload, null, 2)}</pre></label></>}</section>
      <section className="version-history"><div className="action-section-title"><History size={15} /><div><strong>Payload versions</strong><span>Immutable snapshots · newest first</span></div></div><div>{selected.versions.map((version) => <button className={(inspectedVersion ?? selected.payloadVersion) === version.payloadVersion ? "active" : ""} key={version.payloadVersion} onClick={() => { setEditingId(null); setInspectedVersion(version.payloadVersion === selected.payloadVersion ? null : version.payloadVersion); }}><strong>v{version.payloadVersion}{version.payloadVersion === selected.payloadVersion ? " · current" : ""}</strong><span>{version.changeSummary}</span><small>{actionDate(version.createdAt)}</small></button>)}</div></section>
      <section className="action-evidence"><div className="action-section-title"><BookOpen size={15} /><div><strong>Evidence lineage</strong><span>{selected.evidence.length} verified {selected.evidence.length === 1 ? "record" : "records"} · locked across edits</span></div></div>{selected.evidence.length ? selected.evidence.map((evidence) => <div className="action-evidence-row" key={evidence.sourceRecordId}><CircleCheck size={14} /><div><strong>{evidence.integration} · {evidence.sourceLabel}</strong><p>{evidence.excerpt}</p><small>Observed {actionDate(evidence.observedAt)}</small></div>{evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${evidence.sourceLabel}`}><ArrowRight size={13} /></a>}</div>) : <p className="action-muted">No evidence rows were attached to this historical action.</p>}</section>
      <section className="action-timeline"><div className="action-section-title"><History size={15} /><div><strong>Audit timeline</strong><span>Immutable decision history</span></div></div>{selected.timeline.length ? selected.timeline.map((event) => <div className="timeline-audit-row" key={event.id}><span><i /></span><div><strong>{event.label}</strong><small>{actionDate(event.at)} · {event.correlationId.slice(0, 12)}</small></div></div>) : <p className="action-muted">Created {actionDate(selected.createdAt)}. No later audit events are recorded.</p>}</section>
      {!isEditing && <footer>{isActionRevisable(selected) && <button className="revision-action" disabled={revisionBusy === selected.id || decisionBusy === selected.id} onClick={beginRevision}><WandSparkles size={14} />Edit as new version</button>}{isActionReviewable(selected) ? <><button className="reject-action" disabled={decisionBusy === selected.id} onClick={() => onDecide(selected.id, "reject")}><X size={14} />Reject draft</button><button className="approve-action" disabled={decisionBusy === selected.id} onClick={() => onDecide(selected.id, "approve")}>{decisionBusy === selected.id ? <RefreshCw className="spin" size={14} /> : <ShieldCheck size={14} />}Approve exact payload</button></> : <div className={`decision-locked ${selected.status}`}><LockKeyhole size={14} />Decision recorded: {actionStatusLabel(selected.status)}</div>}</footer>}
    </article>}</div>}
  </section>;
}

function SearchPalette({ onClose, onOpenOrb, onNavigate }: { onClose: () => void; onOpenOrb: () => void; onNavigate: (view: View) => void }) {
  return <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search Vexa"><button className="search-scrim" aria-label="Close search" onClick={onClose} /><section className="search-palette"><div className="palette-input"><Search size={20} /><input autoFocus placeholder="Search people, promises, messages, meetings..." aria-label="Search all sources"/><kbd>ESC</kbd></div><div className="palette-body"><p>QUICK MOVES</p><button onClick={onOpenOrb}><span className="palette-icon violet"><Sparkles size={16} /></span><span><strong>Ask Vexa anything</strong><small>Reason across all approved sources</small></span><ChevronRight size={14} /></button><button onClick={() => onNavigate("Inbox")}><span className="palette-icon coral"><Inbox size={16} /></span><span><strong>Open priority inbox</strong><small>7 open loops · 3 need you today</small></span><ChevronRight size={14} /></button><button onClick={() => onNavigate("People")}><span className="palette-icon mint"><Users size={16} /></span><span><strong>Find a person or promise</strong><small>Cross-channel relationship memory</small></span><ChevronRight size={14} /></button></div><footer><span><ShieldCheck size={12} />Vexa searches only what you connected</span><span>↑↓ Navigate · ↵ Open</span></footer></section></div>;
}

function ActionReview({ item, preparedReply, loading, onClose, onConfirm }: { item: BriefingItem; preparedReply: PreparedReply | null; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  const fallbackDraft = "Hi team — to unblock today's review, I propose David owns the API handoff through Friday while Maya closes the demo scope. Please reply by 12:30 if this creates a conflict.";
  return <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="review-title"><button className="orb-scrim" aria-label="Close action review" onClick={onClose} /><section className="review-panel"><header><div><span className="review-icon"><ShieldCheck size={18} /></span><div><p>APPROVAL REQUIRED</p><h2 id="review-title">Review before Vexa acts</h2></div></div><button className="icon-button" onClick={onClose} aria-label="Close action review"><X size={20} /></button></header><div className="review-body"><div className="review-summary"><span className={`category-chip ${item.category}`}>{categoryLabels[item.category]}</span><h3>{loading ? "Grounding your reply..." : item.action?.label}</h3><p>{preparedReply ? `Vexa prepared this ${preparedReply.groundingMode} draft from ${item.citations.length} verified source. Approval records the exact payload; sending remains disabled.` : `Vexa prepared this demonstration from ${item.citations.length} verified sources. No external action will occur.`}</p></div><div className="destination-row"><span><Send size={15} /></span><div><small>DESTINATION</small><strong>{preparedReply?.destination ?? item.action?.destination}</strong></div><span className="permission-pill"><LockKeyhole size={11} />{preparedReply ? "Approve only" : "Demo only"}</span></div><div className="draft-editor"><div><span>{preparedReply ? `${preparedReply.groundingMode.toUpperCase()} · GROUNDED DRAFT` : "DEMO DRAFT"}</span><button disabled>Edit later</button></div><textarea key={preparedReply?.body ?? "demo"} defaultValue={loading ? "Preparing a source-grounded draft..." : preparedReply?.body ?? fallbackDraft} readOnly={loading} aria-label="Prepared action draft" /></div><div className="evidence-box"><div><BookOpen size={15} /><strong>Evidence used</strong><span>{preparedReply ? "Persisted lineage" : "Demo citations"}</span></div>{item.citations.map((citation) => <p key={citation.id}><CircleCheck size={13} /><span><strong>{citation.integration}</strong>{citation.sourceLabel}</span></p>)}</div><div className="approval-notice"><ShieldCheck size={17} /><p><strong>You are in control.</strong>This approval applies only to the exact draft and destination above. Any future edit invalidates the approval.</p></div></div><footer><button className="secondary-button" onClick={onClose}>Keep as draft</button><button className="confirm-button" disabled={loading} onClick={onConfirm}>{preparedReply ? "Approve grounded draft" : "Approve demo only"} <Send size={14} /></button></footer></section></div>;
}
