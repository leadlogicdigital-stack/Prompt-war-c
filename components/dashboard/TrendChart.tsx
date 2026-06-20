"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MoodCheckin } from "@/lib/types";

interface Props {
  checkins: MoodCheckin[];
}

export function TrendChart({ checkins }: Props) {
  // oldest → newest, last 14 points
  const data = [...checkins]
    .reverse()
    .slice(-14)
    .map((c) => ({
      date: new Date(c.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      wellness: c.wellnessIndex,
      mood: c.mood,
      stress: c.stress,
    }));

  if (data.length < 2) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line text-center">
        <p className="text-sm font-medium text-muted">Your trend will bloom here 🌱</p>
        <p className="mt-1 text-xs text-faint">Check in a few times to see how you're moving.</p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="gWell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99 76 196)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(99 76 196)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gStress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(230 108 108)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="rgb(230 108 108)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "rgb(146 142 172)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "rgb(146 142 172)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgb(230 226 243)",
              boxShadow: "0 10px 30px -12px rgb(40 30 80 / 0.3)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="wellness"
            name="Wellness"
            stroke="rgb(99 76 196)"
            strokeWidth={2.5}
            fill="url(#gWell)"
          />
          <Area
            type="monotone"
            dataKey="stress"
            name="Stress"
            stroke="rgb(230 108 108)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gStress)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
