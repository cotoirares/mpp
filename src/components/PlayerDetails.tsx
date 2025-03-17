"use client";

import { useState } from "react";
import { usePlayerContext } from "~/context/PlayerContext";
import type { Player } from "~/types/player";
import PlayerForm from "./PlayerForm";

type PlayerDetailsProps = {
  player: Player;
  onClose: () => void;
};

export default function PlayerDetails({ player, onClose }: PlayerDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { deletePlayer } = usePlayerContext();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      deletePlayer(player.id);
      onClose();
    }
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-2xl">
          <PlayerForm
            player={player}
            onClose={() => {
              setIsEditing(false);
              onClose();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">{player.name}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-gray-600">Age</p>
            <p>{player.age} years</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Rank</p>
            <p>#{player.rank}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Country</p>
            <p>{player.country}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Grand Slams</p>
            <p>{player.grandSlams}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Hand</p>
            <p>{player.hand}-handed</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Height</p>
            <p>{player.height} cm</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleDelete}
            className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 