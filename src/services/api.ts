import { type Player, type PlayerFilter } from '~/types/player';
import { type Tournament, type TournamentFilter } from '~/types/tournament';
import { type Match, type MatchFilter } from '~/types/match';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennis-app-backend-1o0q.onrender.com/api';

console.log('API_URL configured as:', API_URL);

export type GetPlayersParams = {
  cursor?: number;
  limit?: number;
  sortBy?: keyof Player;
  sortOrder?: 'asc' | 'desc';
  filters?: PlayerFilter;
  infinite?: boolean;
};

export const api = {
  // Get all players with optional filtering, sorting, and pagination
  async getPlayers({
    cursor = 0,
    limit = 20,
    sortBy,
    sortOrder,
    filters,
    infinite = false
  }: GetPlayersParams = {}): Promise<{
    players: Player[];
    nextCursor?: number;
    hasMore: boolean;
  }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('cursor', cursor.toString());
      queryParams.append('limit', limit.toString());
      if (sortBy) {
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortOrder', sortOrder || 'asc');
      }
      if (filters && Object.keys(filters).length > 0) {
        queryParams.append('filters', JSON.stringify(filters));
      }
      if (infinite) {
        queryParams.append('infinite', 'true');
      }

      const url = `${API_URL}/players?${queryParams.toString()}`;
      console.log('Fetching players from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      console.log('Players data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },

  // Create a new player
  async createPlayer(player: Omit<Player, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      });
      if (!response.ok) {
        throw new Error('Failed to create player');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create player');
    }
  },

  // Update a player
  async updatePlayer(id: string, player: Omit<Player, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/players/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      });
      if (!response.ok) {
        throw new Error('Failed to update player');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update player');
    }
  },

  // Delete a player
  async deletePlayer(id: string) {
    try {
      const response = await fetch(`${API_URL}/players/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete player');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete player');
    }
  },

  // TOURNAMENT API
  
  // Get all tournaments with optional filtering
  async getTournaments(filters: TournamentFilter = {}): Promise<Tournament[]> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_URL}/tournaments?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  },
  
  // Get tournament by ID
  async getTournamentById(id: string): Promise<Tournament> {
    try {
      const response = await fetch(`${API_URL}/tournaments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tournament');
    }
  },
  
  // Create a new tournament
  async createTournament(tournament: Omit<Tournament, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournament),
      });
      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create tournament');
    }
  },
  
  // Update a tournament
  async updateTournament(id: string, tournament: Partial<Tournament>) {
    try {
      const response = await fetch(`${API_URL}/tournaments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournament),
      });
      if (!response.ok) {
        throw new Error('Failed to update tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update tournament');
    }
  },
  
  // Delete a tournament
  async deleteTournament(id: string) {
    try {
      const response = await fetch(`${API_URL}/tournaments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete tournament');
    }
  },
  
  // Add a player to a tournament
  async addPlayerToTournament(tournamentId: string, playerId: string) {
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/players/${playerId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to add player to tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add player to tournament');
    }
  },
  
  // Remove a player from a tournament
  async removePlayerFromTournament(tournamentId: string, playerId: string) {
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/players/${playerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove player from tournament');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove player from tournament');
    }
  },
  
  // MATCH API
  
  // Get all matches with optional filtering
  async getMatches(filters: MatchFilter = {}): Promise<Match[]> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_URL}/matches?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },
  
  // Get match by ID
  async getMatchById(id: string): Promise<Match> {
    try {
      const response = await fetch(`${API_URL}/matches/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch match');
    }
  },
  
  // Create a new match
  async createMatch(match: Omit<Match, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(match),
      });
      if (!response.ok) {
        throw new Error('Failed to create match');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create match');
    }
  },
  
  // Update a match
  async updateMatch(id: string, match: Partial<Match>) {
    try {
      const response = await fetch(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(match),
      });
      if (!response.ok) {
        throw new Error('Failed to update match');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update match');
    }
  },
  
  // Delete a match
  async deleteMatch(id: string) {
    try {
      const response = await fetch(`${API_URL}/matches/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete match');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete match');
    }
  },
  
  // Get matches by tournament
  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/matches`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament matches');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tournament matches');
    }
  },
  
  // Get matches by player
  async getMatchesByPlayer(playerId: string): Promise<Match[]> {
    try {
      const response = await fetch(`${API_URL}/players/${playerId}/matches`);
      if (!response.ok) {
        throw new Error('Failed to fetch player matches');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch player matches');
    }
  },
  
  // Update match score and stats
  async updateMatchScore(id: string, data: { score: string, winner: string, duration: number, stats: Match['stats'] }) {
    try {
      const response = await fetch(`${API_URL}/matches/${id}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update match score');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update match score');
    }
  },

  // Enhanced video upload with progress tracking
  async uploadVideo(id: string, file: File, onProgress?: (progress: number) => void): Promise<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('video', file);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });
        }
        
        // Make sure to use the correct endpoint
        xhr.open('POST', `${API_URL}/players/${id}/upload`);
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error(`Failed to parse response: ${xhr.responseText}`));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function() {
          console.error('Network error during upload:', xhr.status, xhr.statusText);
          reject(new Error('Upload failed due to a network error. Please check your connection and try again.'));
        };
        
        // Add timeout handler
        xhr.ontimeout = function() {
          reject(new Error('Upload timed out. Please try again.'));
        };
        
        // Set longer timeout for large files (2 minutes)
        xhr.timeout = 120000;
        
        // Send the form data
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error in uploadVideo:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload video');
    }
  },

  // Get videos for a player
  async getPlayerVideos(id: string): Promise<Array<{
    url: string;
    size: number;
    type: string;
  }>> {
    try {
      const response = await fetch(`${API_URL}/players/${id}/videos`);
      if (!response.ok) {
        throw new Error('Failed to fetch player videos');
      }
      const data = await response.json();
      return data.videos;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch player videos');
    }
  },

  // Check upload status
  async checkUploadStatus(filename: string): Promise<{
    filename: string;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress?: number;
  }> {
    try {
      const response = await fetch(`${API_URL}/upload-status/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to check upload status');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to check upload status');
    }
  },

  // Get server status
  async getStatus() {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch server status');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch server status');
    }
  }
}; 