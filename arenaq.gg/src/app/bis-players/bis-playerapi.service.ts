import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export interface TopByClass {
  classId: number;
  className: string;
  players: any[];
}

@Injectable({ providedIn: 'root' })
export class BisPlayerApiService {
  constructor(private wow: WowApiService) {}

  getTopPlayersByClass(
    seasonId = 13,
    region: Region = 'eu',
    maxPages = 10,
    topNPerClass = 5
  ): Observable<TopByClass[]> {
    return this.wow.getFull3v3LadderAuto(seasonId, region, maxPages).pipe(
      map(entries => {
        if (!entries?.length) {
          return [];
        }

        const sorted = [...entries].sort(
          (a, b) => (b?.rating ?? 0) - (a?.rating ?? 0)
        );

        const grouped = new Map<number, { className: string; players: any[] }>();

        for (const player of sorted) {
          const classId = player?.character?.playable_class?.id;
          const className = player?.character?.playable_class?.name ?? 'Unknown';
          if (!classId) {
            continue;
          }
          if (!grouped.has(classId)) {
            grouped.set(classId, { className, players: [] });
          }
          const bucket = grouped.get(classId)!;
          if (bucket.players.length < topNPerClass) {
            bucket.players.push(player);
          }
        }

        return Array.from(grouped.entries())
          .map(([classId, { className, players }]) => ({
            classId,
            className,
            players,
          }))
          .sort((a, b) => a.classId - b.classId);
      })
    );
  }
}
