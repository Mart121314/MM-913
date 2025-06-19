import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WowApiService } from '../wow-api.service';

export interface CutoffData {
  totalPlayers: number;
  gladiatorCutoff: number;
  rank1Cutoff: number;
}

@Injectable({
  providedIn: 'root'
})
export class CutoffApiService {
  constructor(private wow: WowApiService) {}

  /**
   * Compute gladiator and rank 1 cutoffs from the full ladder.
   */
  getCutoffs(seasonId = 11): Observable<CutoffData> {
    return this.wow.getFull3v3Ladder(40, seasonId).pipe(
      map((entries) => {
        const totalPlayers = entries.length;
        const sorted = [...entries].sort((a, b) => b.rating - a.rating);
        const r1Index = Math.floor(totalPlayers * 0.005);
        const gladIndex = Math.floor(totalPlayers * 0.05);
        return {
          totalPlayers,
          rank1Cutoff: sorted[r1Index]?.rating || 0,
          gladiatorCutoff: sorted[gladIndex]?.rating || 0,
        } as CutoffData;
      })
    );
  }
}
