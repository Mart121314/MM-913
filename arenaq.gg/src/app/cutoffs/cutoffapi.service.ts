import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { catchError, concatMap, map, switchMap, takeWhile, toArray } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export type CutoffData = {
  totalPlayers: number;
  rank1Cutoff: number | null;
  gladiatorCutoff: number | null;
};

@Injectable({ providedIn: 'root' })
export class CutoffApiService {
  constructor(private wow: WowApiService) {}

  getCutoffs(
    region: Region = 'eu',
    seasonNumber: number = 13
  ): Observable<CutoffData> {
    return this.resolveSeasonId(region, seasonNumber).pipe(
      switchMap(seasonId => this.fetchFullLadder(seasonId, region)),
      map(entries => {
        const sorted = this.sortByRatingDesc(entries);
        const total = sorted.length;

        // compute dynamic cutoff positions
        const r1Rank = Math.max(1, Math.floor(total * 0.001));  // top 0.1%
        const gladRank = Math.max(1, Math.floor(total * 0.005)); // top 0.5%

        return {
          totalPlayers: total,
          rank1Cutoff: this.ratingAtRank(sorted, r1Rank),
          gladiatorCutoff: this.ratingAtRank(sorted, gladRank),
        };
      }),
      catchError(() => of({ totalPlayers: 0, rank1Cutoff: null, gladiatorCutoff: null }))
    );
  }

  /* ---------------- internal helpers ---------------- */

 private resolveSeasonId(region: Region, seasonNumber: number): Observable<number> {
  return this.wow.getClassicSeasonIndex(region).pipe(
    map((seasons: { id: number }[]) => {
      const s = seasons.find((x: { id: number }) => x.id === seasonNumber);
      if (s) return s.id;

      // fallback to highest season id (latest)
      if (seasons.length) {
        return seasons
          .map((s: { id: number }) => s.id)
          .sort((a, b) => b - a)[0];
      }

      throw new Error('No Classic PvP seasons found');
    })
  );
}

  private fetchFullLadder(seasonId: number, region: Region, maxPages = 20): Observable<any[]> {
    const pages = Array.from({ length: maxPages }, (_, i) => i + 1);
    return from(pages).pipe(
      concatMap(p => this.wow.getLeaderboardPage(seasonId, p, region)),
      takeWhile(list => list.length > 0, true),
      toArray(),
      map(chunks => {
        const all = chunks.flat();
        const seen = new Set<number>();
        return all.filter(e => {
          const id = e?.character?.id;
          if (typeof id !== 'number') return false;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      })
    );
  }

  private sortByRatingDesc<T extends { rating?: number; rank?: number }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => {
      const ar = a.rating ?? 0, br = b.rating ?? 0;
      if (br !== ar) return br - ar;
      return (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);
    });
  }

  private ratingAtRank<T extends { rating?: number }>(arr: T[], rank: number): number | null {
    const i = Math.max(0, rank - 1);
    if (i >= arr.length) return null;
    const r = arr[i]?.rating;
    return typeof r === 'number' ? r : null;
  }
}