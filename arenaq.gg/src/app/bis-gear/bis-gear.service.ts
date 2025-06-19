import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BisGearService {
  constructor(private http: HttpClient) {}

  /**
   * Determine the most common gear items from the local BIS players dataset.
   */
  getMostPopularGear(): Observable<{ item: string; count: number }[]> {
    return this.http.get<Record<string, any[]>>('assets/bis-players.json').pipe(
      map((groups) => {
        const counts: Record<string, number> = {};
        Object.values(groups).forEach((players) => {
          players.forEach((p: any) => {
            (p.gear || []).forEach((item: string) => {
              counts[item] = (counts[item] || 0) + 1;
            });
          });
        });
        return Object.entries(counts)
          .map(([item, count]) => ({ item, count }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }
}
