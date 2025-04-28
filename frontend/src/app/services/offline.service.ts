import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private apiUrl = 'http://localhost:3001/api';

  generatePlayers(count: number): Observable<Player[]> {
    return from(this.generatePlayersAsync(count));
  }

  private async generatePlayersAsync(count: number): Promise<Player[]> {
    try {
      const response = await fetch(`${this.apiUrl}/players/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate players');
      }

      const data = await response.json();
      return data.players;
    } catch (error) {
      console.error('Error generating players:', error);
      throw error;
    }
  }
} 