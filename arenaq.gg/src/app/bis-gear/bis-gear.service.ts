import { Injectable } from '@angular/core';
import { map, Observable, switchMap, mergeMap, toArray, of, from, catchError } from 'rxjs';
import { WowApiService } from '../wow-api.service';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BisGearService {

  constructor(private wow: WowApiService) {}

  getMostPopularGear(seasonId = 11): Observable<{ item: string; count: number }[]> {
    return this.wow.getFull3v3Ladder(5, seasonId).pipe(
      switchMap((players) =>
        from(players).pipe(
          mergeMap((p) =>
            this.wow
              .getCharacterEquipment(p.character.realm.slug, p.character.name)
              .pipe(
                map((equip) =>
                  (equip.equipped_items || []).map((i: any) => i.item.name)
                ),
                catchError(() => of([]))
              )
          ),
          toArray(),
          map((allGear) => {
            const counts: Record<string, number> = {};
            allGear.forEach((items: string[]) => {
              items.forEach((item) => {
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

  }}