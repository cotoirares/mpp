"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { websocket } from "~/services/websocket";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#A833FF"];

type StatsData = {
  totalPlayers: number;
  averageAge: number;
  averageRank: number;
  averageHeight: number;
  totalGrandSlams: number;
  rightHanded: number;
  leftHanded: number;
  countryStats: Record<string, number>;
  ageStats: Array<{ range: string; count: number }>;
  grandSlamStats: Array<{ range: string; count: number }>;
  handStats: Record<string, number>;
};

export default function RealTimeCharts() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [generationRate, setGenerationRate] = useState(5000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a more resilient approach for handling stats updates
  const handleStatsUpdate = useCallback((newStats: StatsData | undefined) => {
    if (newStats) {
      console.log("Received new stats data:", Object.keys(newStats));
      setStats(newStats);
      setIsLoading(false);
    }
  }, []);

  // Force reconnection if needed
  const handleReconnect = useCallback(() => {
    setIsLoading(true);
    setError(null);
    console.log("Forcing WebSocket reconnection...");
    websocket.forceReconnect();
  }, []);

  useEffect(() => {
    console.log("Setting up WebSocket subscription for charts");
    
    // Add timeout for initial connection
    const connectionTimeout = setTimeout(() => {
      if (!isConnected && isLoading) {
        setError("Connection timeout. WebSocket server might be unavailable.");
      }
    }, 10000);
    
    const unsubscribe = websocket.subscribe({
      onInitialData: (data) => {
        console.log("Received initial data with stats");
        if (data.stats) {
          setStats(data.stats);
          setIsLoading(false);
        }
      },
      onStatsUpdate: handleStatsUpdate,
      onRateChanged: (rate) => {
        console.log("Generation rate changed:", rate);
        setGenerationRate(rate);
      },
      onConnectionChange: (connected) => {
        console.log("WebSocket connection state:", connected ? "connected" : "disconnected");
        setIsConnected(connected);
        
        // If we've just connected, clear error state
        if (connected && error) {
          setError(null);
        }
        
        // If we've just disconnected, start loading state
        if (!connected && !isLoading) {
          setIsLoading(true);
        }
      }
    });

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribe();
    };
  }, [handleStatsUpdate, isConnected, isLoading, error]);

  const handleGenerationRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseInt(e.target.value, 10);
    websocket.setGenerationRate(newRate);
    setGenerationRate(newRate);
  };

  const handleGeneratePlayers = () => {
    websocket.generatePlayers(5);
  };

  // Show loading or error states
  if (isLoading) {
    return (
      <div className="mb-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Real-Time Tennis Player Statistics</h2>
          <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-orange-500 animate-pulse"}`}></span>
            <span className="text-sm">{isConnected ? "Connected" : "Connecting..."}</span>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-xl font-semibold">Loading chart data...</div>
            {error && (
              <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
                {error}
                <button 
                  onClick={handleReconnect}
                  className="ml-4 rounded bg-blue-500 px-4 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mb-8 p-4 text-center">
        <div className="text-xl font-semibold">No data available</div>
        {error && (
          <div className="mt-4 rounded bg-red-100 p-4 text-red-700">
            {error}
            <button 
              onClick={handleReconnect}
              className="ml-4 rounded bg-blue-500 px-4 py-1 text-sm text-white hover:bg-blue-700"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  // Convert country stats to array for charting
  const countryData = Object.entries(stats.countryStats || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Hand distribution data
  const handData = [
    { name: "Right", value: stats.handStats?.Right || 0 },
    { name: "Left", value: stats.handStats?.Left || 0 },
  ];

  return (
    <div className="mb-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Tennis Player Statistics</h2>
        <div className="flex items-center space-x-2">
          <span className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
          {!isConnected && (
            <button 
              onClick={handleReconnect}
              className="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-700"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Player Count</h3>
          <p className="text-3xl font-bold">{stats.totalPlayers}</p>
          <div className="mt-2 text-sm text-gray-600">
            <p>Average Age: {stats.averageAge.toFixed(1)}</p>
            <p>Average Height: {stats.averageHeight.toFixed(1)} cm</p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Grand Slams</h3>
          <p className="text-3xl font-bold">{stats.totalGrandSlams}</p>
          <p className="text-sm text-gray-600">Total Grand Slam titles</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Controls</h3>
          <div className="flex flex-col space-y-2">
            <div>
              <label className="mb-1 block text-sm">Generation Rate:</label>
              <select 
                value={generationRate} 
                onChange={handleGenerationRateChange}
                className="w-full rounded border border-gray-300 p-2"
              >
                <option value="1000">Fast (1 second)</option>
                <option value="5000">Normal (5 seconds)</option>
                <option value="10000">Slow (10 seconds)</option>
                <option value="30000">Very Slow (30 seconds)</option>
              </select>
            </div>
            <button 
              onClick={handleGeneratePlayers}
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Generate 5 Players
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Country Distribution Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Country Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {countryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hand Distribution Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Hand Preference</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={handData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {handData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Age Distribution Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Age Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ageStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d">
                  {(stats.ageStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grand Slam Distribution Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Grand Slam Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.grandSlamStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {(stats.grandSlamStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 