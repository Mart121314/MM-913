import { Injectable } from '@angular/core';
import { from, of, Observable } from 'rxjs';
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class BisGearService {
  constructor(private wow: WowApiService) {}

  getMostPopularGear(
    seasonId = 13,
    region: Region = 'eu',
    maxPages = 10,
    concurrency = 5
  ): Observable<{ item: string; count: number }[]> {
    return this.wow.getFull3v3LadderAuto(seasonId, region, maxPages).pipe(
      switchMap(players =>
        from(players).pipe(
          mergeMap(player => {
            const realm = player?.character?.realm?.slug ?? player?.realm?.slug;
            const name = player?.character?.name ?? player?.name;
            if (!realm || !name) {
              return of<string[]>([]);
            }
            return this.wow.getCharacterEquipment(realm, name, region).pipe(
              map(response =>
                (response?.equipped_items ?? []).map(
                  (item: any) => item?.item?.name ?? item?.name?.display_string ?? ''
                )
              ),
              catchError(() => of<string[]>([]))
            );
          }, Math.max(1, concurrency)),
          toArray(),
          map(allItems => {
            const counts: Record<string, number> = {};
            allItems.forEach(items => {
              items.forEach((item: string | number) => {
                if (!item) {
                  return;
                }
                counts[item] = (counts[item] || 0) + 1;
              });
            });
            return Object.entries(counts)
              .map(([item, count]) => ({ item, count }))
              .sort((a, b) => b.count - a.count);
          })
        )
      )
    );
  }
}
