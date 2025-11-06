import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WowApiService, Region, PvpBracket } from '../wow-api.service';

export interface LeaderboardPage {
  entries: any[];
  totalEntries: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private static readonly PAGE_SIZE = 100;

  constructor(private wow: WowApiService) {}

  getPage(
    page: number,
    seasonId?: number,
    region: Region = 'eu',
    bracket: PvpBracket = '3v3'
  ): Observable<LeaderboardPage> {
    return this.wow.resolveClassicSeasonId(seasonId, region).pipe(
      switchMap(resolvedSeason =>
        this.wow.getLeaderboardEntries(resolvedSeason, region, bracket).pipe(
          map(entries => {
            const pageSize = LeaderboardApiService.PAGE_SIZE;
            const totalEntries = entries.length;
            const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
            const safePage = Math.min(Math.max(page, 1), totalPages);
            const start = (safePage - 1) * pageSize;
            const pagedEntries = entries.slice(start, start + pageSize);

            return {
              entries: pagedEntries,
              totalEntries,
              totalPages,
              page: safePage,
              pageSize,
            };
          })
        )
      )
    );
  }
}
