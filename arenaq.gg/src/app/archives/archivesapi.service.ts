import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { WowApiService, Region, PvpBracket } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class ArchivesApiService {
  private static readonly STANDINGS_LIMIT = 500;

  constructor(private wow: WowApiService) {}

  getSeasons(ids: number[], region: Region = 'eu'): Observable<any[]> {
    if (!ids?.length) {
      return of([]);
    }
    return forkJoin(ids.map(id => this.wow.getSeason(id, region))).pipe(
      map(seasons => seasons.filter((season): season is any => season != null))
    );
  }

  // Blizzard's Classic PvP season endpoint only serves a rolling window of
  // recent seasons - hardcoding IDs goes stale every time a new season
  // starts, so derive the most recent ones from the season index instead.
  getRecentSeasons(count = 4, region: Region = 'eu'): Observable<any[]> {
    return this.wow.getClassicSeasonIndex(region).pipe(
      map(seasons =>
        (seasons ?? [])
          .map((season: any) => season?.id)
          .filter((id: any): id is number => typeof id === 'number')
          .sort((a: number, b: number) => b - a)
          .slice(0, count)
      ),
      switchMap(ids => this.getSeasons(ids, region))
    );
  }

  // The point of an archive is showing how players actually finished a
  // season, not just its date range - fetch one season's standings at a
  // time (rather than all candidate seasons up front) so switching tabs
  // stays cheap.
  getSeasonStandings(seasonId: number, bracket: PvpBracket, region: Region = 'eu'): Observable<any[]> {
    return this.wow
      .getLeaderboardEntries(seasonId, region, bracket)
      .pipe(map(entries => (entries ?? []).slice(0, ArchivesApiService.STANDINGS_LIMIT)));
  }
}
