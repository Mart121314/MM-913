import { Injectable } from '@angular/core';
import { WowApiService } from '../wow-api.service';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BisGearService {
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
