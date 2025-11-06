import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export interface TopByClass {
  classId: number;
  className: string;
  players: any[];
}

export interface TopPlayersOptions {
  seasonId?: number;
  region?: Region;
  maxPages?: number;
  topNPerClass?: number;
  classSlug?: string;
}

@Injectable({ providedIn: 'root' })
export class BisPlayerApiService {
  constructor(private wow: WowApiService) {}

  getTopPlayersByClass(options: TopPlayersOptions = {}): Observable<TopByClass[]> {
    const {
      seasonId,
      region = 'eu',
      maxPages = 10,
      topNPerClass = 5,
      classSlug,
    } = options;

    const normalizedClass = classSlug?.toLowerCase() ?? null;

    return this.wow.resolveClassicSeasonId(seasonId, region).pipe(
      switchMap(resolvedSeason =>
        this.wow.getFull3v3LadderAuto(resolvedSeason, region, maxPages)
      ),
      map(entries => {
        if (!entries?.length) {
          return [];
        }

        const sorted = [...entries].sort(
          (a, b) => (b?.rating ?? 0) - (a?.rating ?? 0)
        );

        const grouped = new Map<number, { className: string; classSlug: string; players: any[] }>();

        for (const player of sorted) {
          const classId = player?.character?.playable_class?.id;
          const className = String(player?.character?.playable_class?.name ?? 'Unknown');
          if (!classId) {
            continue;
          }

          const classSlugValue = className.toLowerCase();

          if (normalizedClass && classSlugValue !== normalizedClass) {
            continue;
          }

          if (!grouped.has(classId)) {
            grouped.set(classId, { className, classSlug: classSlugValue, players: [] });
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
