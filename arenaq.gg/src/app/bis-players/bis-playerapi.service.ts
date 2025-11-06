import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, mergeMap, switchMap, catchError, toArray } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';


export interface TopByClass {
  classId: number;
  className: string;
  players: any[];
}

// Static Blizzard class ID map for MoP Classic
const CLASS_NAMES: Record<number, string> = {
  1: 'Warrior',
  2: 'Paladin',
  3: 'Hunter',
  4: 'Rogue',
  5: 'Priest',
  6: 'Death Knight',
  7: 'Shaman',
  8: 'Mage',
  9: 'Warlock',
  10: 'Monk',
  11: 'Druid',
};

@Injectable({ providedIn: 'root' })
export class BisPlayerApiService {
  constructor(private wow: WowApiService) {}

 getTopPlayersByClass(
  seasonId = 12,
  region: Region = 'eu',
  maxPages = 10,
  topNPerClass = 5
): Observable<any[]> {
  return this.wow.getFull3v3LadderAuto(seasonId, region, maxPages).pipe(
    switchMap((entries: any[]) => {
      if (!entries?.length) return of([]);

      // sort by rating descending just in case API returns unordered pages
      const sorted = [...entries].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

      // track how many players we’ve collected per class
      const collected: Record<number, any[]> = {};
      const selected: any[] = [];

      for (const e of sorted) {
        const classId = e?.character?.playable_class?.id ?? e?.class?.id ?? null;
        if (!classId) continue;
        if (!collected[classId]) collected[classId] = [];
        if (collected[classId].length < topNPerClass) {
          collected[classId].push(e);
          selected.push(e);
        }
        // stop early if all 11 classic classes are filled
        if (Object.keys(collected).length >= 11 && Object.values(collected).every(p => p.length >= topNPerClass)) {
          break;
        }
      }

      // Build grouped result
      const results = Object.entries(collected).map(([classId, players]) => ({
        classId: Number(classId),
        players,
      }));

      // sort ascending by classId
      results.sort((a, b) => a.classId - b.classId);

      console.log('✅ Final grouped data (Top 5 per classId adaptive):', results);
      return of(results);
    })
  );
}
}