"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayerContext } from "~/context/PlayerContext";
import type { Player, PlayerFilter } from "~/types/player";
import PlayerDetails from "~/components/PlayerDetails";
import { BarChart, LineChart, PieChart } from "~/components/Charts";
import { websocket } from "~/services/websocket";
import toast from "react-hot-toast";

export default function PlayerList() {
  const {
    players,
    loading,
    error,
    hasMore,
    loadMore,
    isInfiniteMode,
    toggleInfiniteMode,
    currentSort,
    sortPlayers,
    filterPlayers,
    resetFilters
  } = usePlayerContext();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    country: "",
    minAge: "",
    maxAge: "",
    minRank: "",
    maxRank: "",
  });

  const observer = useRef<IntersectionObserver>();
  const lastPlayerRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore) {
        void loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const handleSort = (key: keyof Player) => {
    if (isInfiniteMode) return;
    void sortPlayers(key);
  };

  const handleFilter = async () => {
    const criteria: PlayerFilter = {};
    if (filters.name) criteria.name = filters.name;
    if (filters.country) criteria.country = filters.country;
    if (filters.minAge) criteria.minAge = parseInt(filters.minAge);
    if (filters.maxAge) criteria.maxAge = parseInt(filters.maxAge);
    if (filters.minRank) criteria.minRank = parseInt(filters.minRank);
    if (filters.maxRank) criteria.maxRank = parseInt(filters.maxRank);
    
    await filterPlayers(criteria);
  };

  const handleReset = async () => {
    setFilters({
      name: "",
      country: "",
      minAge: "",
      maxAge: "",
      minRank: "",
      maxRank: "",
    });
    await resetFilters();
  };

  const getHighlightClass = (key: keyof Player, value: number | string) => {
    if (typeof value === "number") {
      const values = players.map(p => p[key] as number);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      if (value === max) return "bg-green-100";
      if (value === min) return "bg-red-100";
      if (Math.abs(value - avg) < 0.1) return "bg-yellow-100";
    }
    return "";
  };

  const columns: { key: keyof Player; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "age", label: "Age" },
    { key: "rank", label: "Rank" },
    { key: "country", label: "Country" },
    { key: "grandSlams", label: "Grand Slams" },
    { key: "hand", label: "Hand" },
    { key: "height", label: "Height (cm)" },
  ];

  const stats = players.length > 0 ? {
    totalPlayers: players.length,
    averageAge: Math.round(
      players.reduce((acc, player) => acc + player.age, 0) / players.length
    ),
    averageGrandSlams: Math.round(
      players.reduce((acc, player) => acc + player.grandSlams, 0) / players.length
    ),
  } : {
    totalPlayers: 0,
    averageAge: 0,
    averageGrandSlams: 0
  };

  useEffect(() => {
    // Subscribe to WebSocket updates
    websocket.subscribe({
      onNewPlayer: (player) => {
        toast.success(`New player added: ${player.name}`, {
          duration: 3000,
          position: 'bottom-right',
          icon: '🎾',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
      },
      onStatsUpdate: (stats) => {
        // Update stats if needed
      }
    });

    // Cleanup subscription
    return () => websocket.unsubscribe();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loading && (
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tennis Players</h2>
        <button
          onClick={() => void toggleInfiniteMode()}
          className="rounded bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-700 disabled:opacity-50"
          disabled={loading}
        >
          {isInfiniteMode ? "Switch to Standard Mode" : "View All Players"}
        </button>
      </div>

      {!isInfiniteMode && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>Showing {players.length} players in standard mode with full CRUD functionality</p>
          <p>Sort and filter operations are available</p>
        </div>
      )}

      {isInfiniteMode && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>Infinite scrolling mode - CRUD operations disabled</p>
          <p>Keep scrolling to load more players</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Player Statistics</h3>
          <div className="mt-2 space-y-2">
            <p>Total Players: {stats.totalPlayers}</p>
            <p>Average Age: {stats.averageAge}</p>
            <p>Average Grand Slams: {stats.averageGrandSlams}</p>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Ranking Distribution</h3>
          <PieChart data={players} />
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Age vs Grand Slams</h3>
          <LineChart data={players} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="text-lg font-semibold">Height Distribution</h3>
        <BarChart data={players} />
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-100 p-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="mt-1 w-full rounded-md border p-2"
            placeholder="Filter by name"
            disabled={loading || isInfiniteMode}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            className="mt-1 w-full rounded-md border p-2"
            placeholder="Filter by country"
            disabled={loading || isInfiniteMode}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.minAge}
              onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
              className="mt-1 w-full rounded-md border p-2"
              placeholder="Min age"
              disabled={loading || isInfiniteMode}
            />
            <input
              type="number"
              value={filters.maxAge}
              onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
              className="mt-1 w-full rounded-md border p-2"
              placeholder="Max age"
              disabled={loading || isInfiniteMode}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rank Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.minRank}
              onChange={(e) => setFilters({ ...filters, minRank: e.target.value })}
              className="mt-1 w-full rounded-md border p-2"
              placeholder="Min rank"
              disabled={loading || isInfiniteMode}
            />
            <input
              type="number"
              value={filters.maxRank}
              onChange={(e) => setFilters({ ...filters, maxRank: e.target.value })}
              className="mt-1 w-full rounded-md border p-2"
              placeholder="Max rank"
              disabled={loading || isInfiniteMode}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => void handleFilter()}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || isInfiniteMode}
          >
            Apply Filters
          </button>
          <button
            onClick={() => void handleReset()}
            className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700 disabled:opacity-50"
            disabled={loading || isInfiniteMode}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    !isInfiniteMode ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => !isInfiniteMode && void handleSort(column.key)}
                >
                  {column.label}
                  {!isInfiniteMode && currentSort?.key === column.key && (
                    <span className="ml-2">
                      {currentSort.sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {players.map((player, index) => (
              <tr 
                key={`${player.id}-${index}`} 
                ref={isInfiniteMode && index === players.length - 1 ? lastPlayerRef : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={`${player.id}-${column.key}-${index}`}
                    className={`whitespace-nowrap px-6 py-4 ${getHighlightClass(
                      column.key,
                      player[column.key]
                    )}`}
                  >
                    {player[column.key].toString()}
                  </td>
                ))}
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className="text-blue-600 hover:text-blue-900"
                    disabled={loading || isInfiniteMode}
                  >
                    {isInfiniteMode ? "View" : "View/Edit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isInfiniteMode && hasMore && !loading && (
        <div className="flex justify-center">
          <button
            onClick={() => void loadMore()}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}

      {selectedPlayer && !isInfiniteMode && (
        <PlayerDetails
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {selectedPlayer && isInfiniteMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Player Details</h3>
            <div className="space-y-2">
              {Object.entries(selectedPlayer).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium">{key}: </span>
                  {value.toString()}
                </p>
              ))}
            </div>
            <button
              onClick={() => setSelectedPlayer(null)}
              className="mt-4 rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 