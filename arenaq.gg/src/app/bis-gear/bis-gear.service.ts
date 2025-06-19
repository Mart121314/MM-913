import { Injectable } from '@angular/core';

import { WowApiService } from '../wow-api.service';
import { forkJoin, map, Observable } from 'rxjs';


import { map, Observable, switchMap, mergeMap, toArray, of, from, catchError } from 'rxjs';
import { WowApiService } from '../wow-api.service';

import { WowApiService } from '../wow-api.service';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BisGearService {

  constructor(private wow: WowApiService) {}

  /**
   * Determine the most common gear items from the top 1000 players.
   */
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


  constructor(private wowApi: WowApiService) {}

  getMostPopularGear(players: any[]): Observable<{ itemId: number; count: number }[]> {
    const requests = players.map(p =>
      this.wowApi.getCharacterEquipment(
        p.character.realm.slug,
        p.character.name.toLowerCase()
      )
    );

    return forkJoin(requests).pipe(
      map(equipments => {
        const counts: Record<number, number> = {};
        equipments.forEach(eq => {
          eq.equipped_items?.forEach((item: any) => {
            const id = item.item.id;
            counts[id] = (counts[id] || 0) + 1;
          });
        });
        return Object.entries(counts)
          .map(([id, cnt]) => ({ itemId: Number(id), count: cnt }))
          .sort((a, b) => b.count - a.count);
      })
    );

  }
}
