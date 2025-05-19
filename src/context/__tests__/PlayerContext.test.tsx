import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayerProvider, usePlayerContext } from "../PlayerContext";
import type { Player } from "@/types/player";
import type { PlayerContextType } from "../PlayerContext";

// Mock the initialPlayers to be empty
jest.mock("~/types/player", () => ({
  initialPlayers: [],
}));

// Test component to access context
function TestComponent() {
  const { players, addPlayer, updatePlayer, deletePlayer } = usePlayerContext();
  return (
    <div>
      <div data-testid="players-count">{players.length}</div>
      <button
        onClick={() =>
          addPlayer({
            name: "Test Player",
            age: 25,
            height: 180,
            hand: "Right",
            grandSlams: 1,
            rank: 1,
            country: "USA",
          })
        }
      >
        Add Player
      </button>
      <button
        onClick={() => {
          if (players[0]) {
            updatePlayer({
              ...players[0],
              name: "Updated Player",
              age: 26,
              height: 181,
              hand: "Left",
              grandSlams: 2,
              rank: 2,
              country: "ESP",
            });
          }
        }}
      >
        Update Player
      </button>
      <button onClick={() => deletePlayer(players[0]?.id ?? "")}>
        Delete Player
      </button>
    </div>
  );
}

// Wrapper component to access context values
function ContextReader({ onContext }: { onContext: (context: ReturnType<typeof usePlayerContext>) => void }) {
  const context = usePlayerContext();
  React.useEffect(() => {
    onContext(context);
  }, [context, onContext]);
  return null;
}

describe("PlayerContext", () => {
  it("should initialize with empty players array", () => {
    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>
    );

    expect(screen.getByTestId("players-count")).toHaveTextContent("0");
  });

  it("should add a new player", () => {
    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>
    );

    act(() => {
      screen.getByText("Add Player").click();
    });

    expect(screen.getByTestId("players-count")).toHaveTextContent("1");
  });

  it("should update an existing player", () => {
    let contextValue: PlayerContextType | null = null;

    render(
      <PlayerProvider>
        <TestComponent />
        <ContextReader
          onContext={(context) => {
            contextValue = context;
          }}
        />
      </PlayerProvider>
    );

    // First add a player
    act(() => {
      screen.getByText("Add Player").click();
    });

    // Then update the player
    act(() => {
      screen.getByText("Update Player").click();
    });

    expect(contextValue?.players[0]).toMatchObject({
      name: "Updated Player",
      age: 26,
      height: 181,
      hand: "Left",
      grandSlams: 2,
      rank: 2,
      country: "ESP",
    });
  });

  it("should delete a player", () => {
    render(
      <PlayerProvider>
        <TestComponent />
      </PlayerProvider>
    );

    // First add a player
    act(() => {
      screen.getByText("Add Player").click();
    });

    expect(screen.getByTestId("players-count")).toHaveTextContent("1");

    // Then delete the player
    act(() => {
      screen.getByText("Delete Player").click();
    });

    expect(screen.getByTestId("players-count")).toHaveTextContent("0");
  });

  it("should generate unique IDs for new players", () => {
    let contextValue: PlayerContextType | null = null;

    render(
      <PlayerProvider>
        <TestComponent />
        <ContextReader
          onContext={(context) => {
            contextValue = context;
          }}
        />
      </PlayerProvider>
    );

    // Add two players
    act(() => {
      screen.getByText("Add Player").click();
      screen.getByText("Add Player").click();
    });

    expect(contextValue?.players[0]?.id).not.toBe(contextValue?.players[1]?.id);
  });

  it("should maintain player order after updates", () => {
    let contextValue: PlayerContextType | null = null;

    render(
      <PlayerProvider>
        <TestComponent />
        <ContextReader
          onContext={(context) => {
            contextValue = context;
          }}
        />
      </PlayerProvider>
    );

    // Add two players
    act(() => {
      screen.getByText("Add Player").click();
      screen.getByText("Add Player").click();
    });

    const firstPlayerId = contextValue?.players[0]?.id;

    // Update the first player
    act(() => {
      screen.getByText("Update Player").click();
    });

    expect(contextValue?.players[0]?.id).toBe(firstPlayerId);
  });
}); 