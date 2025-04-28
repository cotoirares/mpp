import { type Player, type PlayerFilter } from '~/types/player';

const API_URL = 'http://localhost:3001/api';

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

      const response = await fetch(`${API_URL}/players?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
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
        throw new Error('Failed to get server status');
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get server status');
    }
  }
}; 