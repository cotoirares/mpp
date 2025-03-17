"use client";

import { useState } from "react";
import { usePlayerContext } from "~/context/PlayerContext";
import type { Player } from "~/types/player";
import toast from "react-hot-toast";

type PlayerFormProps = {
  onClose: () => void;
  player?: Player;
};

export default function PlayerForm({ onClose, player }: PlayerFormProps) {
  const { addPlayer, updatePlayer } = usePlayerContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Player, string>>>({});
  const [formData, setFormData] = useState<Omit<Player, "id">>({
    name: player?.name ?? "",
    age: player?.age ?? 18,
    rank: player?.rank ?? 1,
    country: player?.country ?? "",
    grandSlams: player?.grandSlams ?? 0,
    hand: player?.hand ?? "Right",
    height: player?.height ?? 170,
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Player, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.age < 16 || formData.age > 45) {
      newErrors.age = "Age must be between 16 and 45";
    }

    if (formData.rank < 1) {
      newErrors.rank = "Rank must be a positive number";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (formData.grandSlams < 0) {
      newErrors.grandSlams = "Grand Slams cannot be negative";
    }

    if (formData.height < 150 || formData.height > 220) {
      newErrors.height = "Height must be between 150cm and 220cm";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors");
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (player) {
        updatePlayer({ ...formData, id: player.id });
      } else {
        addPlayer(formData);
      }
      onClose();
    } catch (error) {
      toast.error("An error occurred while saving the player");
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">
        {player ? "Edit Player" : "Add New Player"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) })
            }
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rank</label>
          <input
            type="number"
            value={formData.rank}
            onChange={(e) =>
              setFormData({ ...formData, rank: parseInt(e.target.value) })
            }
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.rank && (
            <p className="mt-1 text-sm text-red-600">{errors.rank}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Grand Slams
          </label>
          <input
            type="number"
            value={formData.grandSlams}
            onChange={(e) =>
              setFormData({ ...formData, grandSlams: parseInt(e.target.value) })
            }
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.grandSlams && (
            <p className="mt-1 text-sm text-red-600">{errors.grandSlams}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hand</label>
          <select
            value={formData.hand}
            onChange={(e) =>
              setFormData({
                ...formData,
                hand: e.target.value as "Right" | "Left",
              })
            }
            className="mt-1 w-full rounded-md border p-2"
          >
            <option value="Right">Right</option>
            <option value="Left">Left</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Height (cm)
          </label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) =>
              setFormData({ ...formData, height: parseInt(e.target.value) })
            }
            className="mt-1 w-full rounded-md border p-2"
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            {player ? "Update" : "Add"} Player
          </button>
        </div>
      </form>
    </div>
  );
} 