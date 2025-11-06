import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { WowApiService, Region, PvpBracket } from '../wow-api.service';

export interface CutoffData {
  totalPlayers: number;
  gladiatorCutoff: number;
  rank1Cutoff: number;
  gladiatorSpots: number;
  rank1Spots: number;
  bracket: PvpBracket;
  seasonStart?: string;
  fetchedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CutoffApiService {
  constructor(private wow: WowApiService) {}

  getCutoffs(
    region: Region = 'eu',
    seasonId?: number,
    bracket: PvpBracket = '3v3'
  ): Observable<CutoffData> {
    return this.wow.resolveClassicSeasonId(seasonId, region).pipe(
      switchMap(resolvedSeason =>
        forkJoin({
          entries: this.wow.getLeaderboardEntries(resolvedSeason, region, bracket),
          rewards: this.wow.getSeasonRewards(resolvedSeason, region),
          season: this.wow.getSeason(resolvedSeason, region),
        })
      ),
      map(({ entries, rewards, season }) => {
        const ratedEntries = (entries ?? []).filter(entry => typeof entry?.rating === 'number');
        const bracketType = this.bracketType(bracket);

        const bracketRewards = (rewards ?? [])
          .filter(reward => reward?.bracket?.type === bracketType)
          .filter(reward => typeof reward?.rating_cutoff === 'number') as Array<{
            rating_cutoff: number;
          }>;

        const sortedRewards = [...bracketRewards].sort(
          (a, b) => (b.rating_cutoff ?? 0) - (a.rating_cutoff ?? 0)
        );

        const rank1Cutoff = sortedRewards[0]?.rating_cutoff ?? 0;
        const gladiatorCutoff = sortedRewards[1]?.rating_cutoff ?? 0;

        const rank1Spots =
          rank1Cutoff > 0
            ? ratedEntries.filter(entry => (entry?.rating ?? 0) >= rank1Cutoff).length
            : 0;
        const gladiatorSpots =
          gladiatorCutoff > 0
            ? ratedEntries.filter(entry => (entry?.rating ?? 0) >= gladiatorCutoff).length
            : 0;

        const estimatedFromGladiator =
          gladiatorSpots > 0 ? Math.round(gladiatorSpots / 0.05) : 0;
        const estimatedFromRank1 = rank1Spots > 0 ? Math.round(rank1Spots / 0.01) : 0;
        const totalPlayers = Math.max(
          ratedEntries.length,
          estimatedFromGladiator,
          estimatedFromRank1
        );

        const seasonStartTimestamp = Number(season?.season_start_timestamp);
        const seasonStart =
          Number.isFinite(seasonStartTimestamp) && seasonStartTimestamp > 0
            ? new Date(seasonStartTimestamp).toISOString()
            : undefined;

        return {
          totalPlayers,
          rank1Cutoff,
          gladiatorCutoff,
          rank1Spots,
          gladiatorSpots,
          bracket,
          seasonStart,
          fetchedAt: new Date().toISOString(),
        } as CutoffData;
      }),
      catchError(() =>
        of({
          totalPlayers: 0,
          rank1Cutoff: 0,
          gladiatorCutoff: 0,
          rank1Spots: 0,
          gladiatorSpots: 0,
          bracket,
          fetchedAt: new Date().toISOString(),
        })
      )
    );
  }

  private bracketType(bracket: PvpBracket): string {
    switch (bracket) {
      case '2v2':
        return 'ARENA_2v2';
      case '5v5':
        return 'ARENA_5v5';
      default:
        return 'ARENA_3v3';
    }
  }
}
