import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { map, Observable } from 'rxjs';

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

  constructor(private wowApi: WowApiService) {}

  /**
   * Return the top players for each class based on the 3v3 ladder.
   */
  getTopPlayersByClass(limit: number = 5): Observable<Record<string, any[]>> {
    return this.wowApi.getFull3v3Ladder(5).pipe(
      map((players) => {
        const byClass: Record<string, any[]> = {};
        players.forEach((p) => {
          const cls = p.character.playable_class.name;
          if (!byClass[cls]) {
            byClass[cls] = [];
          }
          byClass[cls].push(p);
        });
        Object.keys(byClass).forEach((cls) => {
          byClass[cls].sort((a, b) => b.rating - a.rating);
          byClass[cls] = byClass[cls].slice(0, limit);
        });
        return byClass;

      })
    );
  }
}