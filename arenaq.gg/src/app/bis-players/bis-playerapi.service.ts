import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Injectable({
  providedIn: 'root',
})
export class BisPlayerApiService {
  constructor(private wow: WowApiService) {}

  /** Retrieve top 5 players per class from the Blizzard ladder */
  getTopPlayersByClass(seasonId = 11): Observable<Record<string, any[]>> {
    return this.wow.getFull3v3Ladder(5, seasonId).pipe(
      map((entries) => {
        const byClass = new Map<string, any[]>();
        entries.forEach((e) => {
          const cls = e.character.playable_class.name;
          if (!byClass.has(cls)) {
            byClass.set(cls, []);
          }
          byClass.get(cls)!.push(e);
        });
        const result: Record<string, any[]> = {};
        byClass.forEach((players, cls) => {
          players.sort((a, b) => b.rating - a.rating);
          result[cls] = players.slice(0, 5);
        });
        return result;
      })
    );
  }
}