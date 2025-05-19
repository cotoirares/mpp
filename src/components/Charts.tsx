"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Player } from "@/types/player";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

type ChartProps = {
  data: Player[];
};

export function BarChart({ data }: ChartProps) {
  const chartData = data.map((player) => ({
    name: player.name,
    height: player.height,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="height" fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChart({ data }: ChartProps) {
  const chartData = data.map((player) => ({
    name: player.name,
    age: player.age,
    grandSlams: player.grandSlams,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="age"
            stroke="#8884d8"
            name="Age"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="grandSlams"
            stroke="#82ca9d"
            name="Grand Slams"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChart({ data }: ChartProps) {
  const chartData = data.reduce((acc, player) => {
    const hand = player.hand;
    const existing = acc.find((item) => item.name === hand);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: hand, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
} 