"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive area chart"

const chartData = [
  { date: "Runde 1", spieler: 64, aktive_spiele: 32, durchschnitt_score: 42.5 },
  { date: "Runde 2", spieler: 32, aktive_spiele: 16, durchschnitt_score: 45.2 },
  { date: "Runde 3", spieler: 16, aktive_spiele: 8, durchschnitt_score: 47.8 },
  { date: "Viertelfinale", spieler: 8, aktive_spiele: 4, durchschnitt_score: 49.3 },
  { date: "Halbfinale", spieler: 4, aktive_spiele: 2, durchschnitt_score: 51.1 },
  { date: "Finale", spieler: 2, aktive_spiele: 1, durchschnitt_score: 53.7 },
]

const chartConfig = {
  spieler: {
    label: "Spieler",
    color: "#6b7280",
  },
  aktive_spiele: {
    label: "Aktive Spiele",
    color: "#9ca3af",
  },
  durchschnitt_score: {
    label: "Ø Score",
    color: "#d1d5db",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [data, setData] = React.useState<any[]>([]);
  const [currentRound, setCurrentRound] = React.useState("Start");
  const [loading, setLoading] = React.useState(true);
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        if (result.success && result.chartData) {
          setData(result.chartData);
          setCurrentRound(result.stats.tournamentStatus || "Start");
        }
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 h-[350px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-gray-200 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="text-gray-900">Turnier-Fortschritt</CardTitle>
          <CardDescription className="text-gray-600">
            Spielerzahl, aktive Spiele und Durchschnitts-Score pro Runde
          </CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-gray-200 px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-gray-500">
              Aktuelle Runde
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl text-gray-900">
              {currentRound}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillSpieler" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#6b7280"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#6b7280"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAktiveSpiele" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#9ca3af"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#9ca3af"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => value}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="aktive_spiele"
              type="natural"
              fill="url(#fillAktiveSpiele)"
              fillOpacity={0.4}
              stroke="#9ca3af"
              stackId="a"
            />
            <Area
              dataKey="spieler"
              type="natural"
              fill="url(#fillSpieler)"
              fillOpacity={0.4}
              stroke="#6b7280"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
