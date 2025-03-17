"use client";

import { useState } from "react";
import { usePlayerContext } from "~/context/PlayerContext";
import type { Player } from "~/types/player";
import PlayerDetails from "~/components/PlayerDetails";

export default function PlayerList() {
  const { players, sortPlayers, filterPlayers, resetFilters } = usePlayerContext();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    country: "",
    minAge: "",
    maxAge: "",
    minRank: "",
    maxRank: "",
  });

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

  const columns: { key: keyof Player; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "age", label: "Age" },
    { key: "rank", label: "Rank" },
    { key: "country", label: "Country" },
    { key: "grandSlams", label: "Grand Slams" },
    { key: "hand", label: "Hand" },
    { key: "height", label: "Height (cm)" },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-100 p-4 md:grid-cols-3">
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

      <div className="overflow-x-auto">
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
            {players.map((player) => (
              <tr key={player.id}>
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-6 py-4">
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

      {selectedPlayer && (
        <PlayerDetails
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
} 