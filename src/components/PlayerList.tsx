"use client";

import { useState } from "react";
import { usePlayerContext } from "~/context/PlayerContext";
import type { Player } from "~/types/player";
import PlayerDetails from "~/components/PlayerDetails";
import { BarChart, LineChart, PieChart } from "~/components/Charts";

export default function PlayerList() {
  const { players, sortPlayers, filterPlayers, resetFilters, deletePlayer } = usePlayerContext();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    name: "",
    country: "",
    minAge: "",
    maxAge: "",
    minRank: "",
    maxRank: "",
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(players.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlayers = players.slice(startIndex, endIndex);

  const handleSort = (key: keyof Player) => {
    sortPlayers(key);
  };

  const handleFilter = () => {
    const criteria: Partial<Player> = {};
    if (filters.name) criteria.name = filters.name;
    if (filters.country) criteria.country = filters.country;
    
    filterPlayers(criteria);
  };

  const handleReset = () => {
    setFilters({
      name: "",
      country: "",
      minAge: "",
      maxAge: "",
      minRank: "",
      maxRank: "",
    });
    resetFilters();
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

  const stats = {
    totalPlayers: players.length,
    averageAge: Math.round(
      players.reduce((acc, player) => acc + player.age, 0) / players.length
    ),
    averageGrandSlams: Math.round(
      players.reduce((acc, player) => acc + player.grandSlams, 0) / players.length
    ),
  };

  return (
    <div className="space-y-8">
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
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
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
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {currentPlayers.map((player) => (
              <tr key={player.id}>
                {columns.map((column) => (
                  <td
                    key={column.key}
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
                  >
                    View/Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="flex items-center px-4 py-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {selectedPlayer && (
        <PlayerDetails
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
} 