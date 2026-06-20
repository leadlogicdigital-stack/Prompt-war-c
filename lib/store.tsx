"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type {
  CareProfile,
  ChatMessage,
  JournalEntry,
  MoodCheckin,
  ProactiveEvent,
  ProactiveType,
  SliderSnapshot,
  SukoonState,
} from "@/lib/types";
import { wellnessIndex } from "@/lib/care/scoring";
import { fallbackOpener } from "@/lib/ai/fallback";
import { uid, todayKey } from "@/lib/utils";

const KEY = "sukoon.v1";

function emptyState(): SukoonState {
  return {
    careProfile: null,
    checkins: [],
    conversation: {
      id: uid("conv"),
      initiatedBy: "user",
      startedAt: new Date().toISOString(),
      messages: [],
    },
    proactive: [],
    journal: [],
    coping: [],
    lastActiveDay: null,
  };
}

type Action =
  | { type: "HYDRATE"; state: SukoonState }
  | { type: "SET_PROFILE"; profile: CareProfile }
  | { type: "ADD_CHECKIN"; checkin: MoodCheckin }
  | { type: "PUSH_MSG"; msg: ChatMessage }
  | { type: "PATCH_MSG"; id: string; patch: Partial<ChatMessage> }
  | { type: "ADD_PROACTIVE"; ev: ProactiveEvent }
  | { type: "SET_PROACTIVE_STATUS"; id: string; status: ProactiveEvent["status"] }
  | { type: "ADD_JOURNAL"; entry: JournalEntry }
  | { type: "LOG_COPING"; tool: string }
  | { type: "TOUCH" }
  | { type: "RESET" };

function reducer(state: SukoonState, action: Action): SukoonState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "SET_PROFILE":
      return { ...state, careProfile: action.profile };
    case "ADD_CHECKIN":
      return { ...state, checkins: [action.checkin, ...state.checkins] };
    case "PUSH_MSG":
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, action.msg],
        },
      };
    case "PATCH_MSG":
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: state.conversation.messages.map((m) =>
            m.id === action.id ? { ...m, ...action.patch } : m,
          ),
        },
      };
    case "ADD_PROACTIVE":
      return { ...state, proactive: [action.ev, ...state.proactive] };
    case "SET_PROACTIVE_STATUS":
      return {
        ...state,
        proactive: state.proactive.map((e) =>
          e.id === action.id ? { ...e, status: action.status } : e,
        ),
      };
    case "ADD_JOURNAL":
      return { ...state, journal: [action.entry, ...state.journal] };
    case "LOG_COPING":
      return {
        ...state,
        coping: [{ id: uid("cope"), tool: action.tool, ts: new Date().toISOString() }, ...state.coping],
      };
    case "TOUCH":
      return { ...state, lastActiveDay: todayKey() };
    case "RESET":
      return emptyState();
    default:
      return state;
  }
}

interface StoreCtx {
  state: SukoonState;
  ready: boolean;
  setProfile: (p: CareProfile) => void;
  addCheckin: (
    snapshot: SliderSnapshot,
    note: string | undefined,
    source: MoodCheckin["source"],
  ) => MoodCheckin;
  pushMessage: (msg: ChatMessage) => void;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;
  addJournal: (content: string, moodTag?: string) => void;
  logCoping: (tool: string) => void;
  pendingProactive: () => ProactiveEvent | undefined;
  markProactiveSeen: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function SukoonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, emptyState);
  const ready = useRef(false);
  const hydrated = useRef(false);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch {
      /* ignore corrupt state */
    }
    hydrated.current = true;
    ready.current = true;
    // force a re-render so `ready` flips
    dispatch({ type: "TOUCH" });
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [state]);

  // client-side proactive engine: evaluate rules when profile + data exist
  useEffect(() => {
    if (!hydrated.current || !state.careProfile) return;
    const hasPending = state.proactive.some((e) => e.status !== "seen");
    if (hasPending) return;

    const decided = decideProactive(state);
    if (!decided) return;

    let cancelled = false;
    (async () => {
      const opener = await fetchOpener(state.careProfile!, decided.type);
      if (cancelled) return;
      dispatch({
        type: "ADD_PROACTIVE",
        ev: {
          id: uid("pro"),
          createdAt: new Date().toISOString(),
          type: decided.type,
          status: "pending",
          opener,
          reason: decided.reason,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.careProfile?.id, state.checkins.length]);

  const api = useMemo<StoreCtx>(
    () => ({
      state,
      ready: ready.current,
      setProfile: (p) => dispatch({ type: "SET_PROFILE", profile: p }),
      addCheckin: (snapshot, note, source) => {
        const checkin: MoodCheckin = {
          ...snapshot,
          id: uid("chk"),
          ts: new Date().toISOString(),
          note,
          source,
          wellnessIndex: wellnessIndex(snapshot),
        };
        dispatch({ type: "ADD_CHECKIN", checkin });
        return checkin;
      },
      pushMessage: (msg) => dispatch({ type: "PUSH_MSG", msg }),
      patchMessage: (id, patch) => dispatch({ type: "PATCH_MSG", id, patch }),
      addJournal: (content, moodTag) =>
        dispatch({
          type: "ADD_JOURNAL",
          entry: { id: uid("jrn"), ts: new Date().toISOString(), content, moodTag },
        }),
      logCoping: (tool) => dispatch({ type: "LOG_COPING", tool }),
      pendingProactive: () =>
        state.proactive.find((e) => e.status === "pending" || e.status === "delivered"),
      markProactiveSeen: (id) => dispatch({ type: "SET_PROACTIVE_STATUS", id, status: "seen" }),
      reset: () => dispatch({ type: "RESET" }),
    }),
    [state],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSukoon(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSukoon must be used inside <SukoonProvider>");
  return ctx;
}

// ── proactive decision rules (client-side preview engine) ────────────
function decideProactive(
  state: SukoonState,
): { type: ProactiveType; reason: string } | null {
  const { careProfile, checkins, conversation } = state;
  if (!careProfile) return null;

  // 1) First-ever: warm welcome if no messages yet
  if (conversation.messages.length === 0 && state.proactive.length === 0) {
    return { type: "welcome", reason: "first session" };
  }

  if (careProfile.preferences.proactivity === "minimal") return null;

  // 2) Trend dip: wellness fell meaningfully across recent check-ins
  if (checkins.length >= 3) {
    const recent = checkins.slice(0, 3);
    const older = checkins.slice(3, 6);
    if (older.length) {
      const avg = (a: MoodCheckin[]) =>
        a.reduce((s, c) => s + c.wellnessIndex, 0) / a.length;
      if (avg(recent) < avg(older) - 8) {
        return { type: "trend_dip", reason: "wellness trend declining" };
      }
    }
  }

  // 3) At-risk users get gentler, more frequent touch
  if (
    (careProfile.riskTier === "strained" || careProfile.riskTier === "crisis") &&
    checkins.length >= 1
  ) {
    const lastMsg = conversation.messages.at(-1);
    const quiet =
      !lastMsg ||
      Date.now() - new Date(lastMsg.ts).getTime() > 1000 * 60 * 60 * 18;
    if (quiet) return { type: "missed_checkin", reason: "watchful cadence" };
  }

  return null;
}

async function fetchOpener(
  careProfile: CareProfile,
  type: ProactiveType,
): Promise<string> {
  try {
    const res = await fetch("/api/proactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careProfile, type }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.opener) return data.opener as string;
    }
  } catch {
    /* fall through */
  }
  return fallbackOpener(careProfile, type);
}
