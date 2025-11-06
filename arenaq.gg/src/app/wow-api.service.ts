import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { AuthenticationService } from './authentication.service';

export type Region = 'eu' | 'us';
export type PvpBracket = '2v2' | '3v3' | '5v5';

type RewardEntry = {
  bracket?: { type?: string | null };
  achievement?: { name?: string | null };
  rating_cutoff?: number | null;
};

@Injectable({ providedIn: 'root' })
export class WowApiService extends BaseApiService {
  private static readonly CLASSIC_PAGE_SIZE = 25;

  private readonly leaderboardCache = new Map<string, Observable<any[]>>();
  private readonly rewardCache = new Map<string, Observable<RewardEntry[]>>();

  constructor(http: HttpClient, authService: AuthenticationService) {
    super(http, authService);
  }

  private host(region: Region): string {
    return `${region}.api.blizzard.com`;
  }

  private nsDynamic(region: Region): string {
    return `dynamic-classic-${region}`;
  }

  private nsProfile(region: Region): string {
    return `profile-classic-${region}`;
  }

  getClassicSeasonIndex(region: Region = 'eu'): Observable<any[]> {
    return this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url = `https://${this.host(region)}/data/wow/pvp-season/index?namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers }).pipe(
          map(res => res?.seasons ?? []),
          catchError(() => of<any[]>([]))
        );
      })
    );
  }

  getLatestClassicSeasonId(region: Region = 'eu'): Observable<number> {
    return this.getClassicSeasonIndex(region).pipe(
      map(seasons => {
        const ids = (seasons ?? [])
          .map((season: any) => season?.id)
          .filter((id: any): id is number => typeof id === 'number');
        if (!ids.length) {
          throw new Error('No Classic PvP seasons found');
        }
        return Math.max(...ids);
      }),
      catchError(err =>
        throwError(() => (err instanceof Error ? err : new Error('Failed to determine Classic PvP season')))
      )
    );
  }

  resolveClassicSeasonId(seasonId?: number | null, region: Region = 'eu'): Observable<number> {
    if (seasonId != null) {
      return of(seasonId);
    }
    return this.getLatestClassicSeasonId(region);
  }

  getLeaderboardEntries(
    seasonId: number,
    region: Region = 'eu',
    bracket: PvpBracket = '3v3'
  ): Observable<any[]> {
    const cacheKey = `${region}:${seasonId}:${bracket}`;
    const cached = this.leaderboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-leaderboard/${bracket}` +
          `?namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      }),
      map(res => res?.entries ?? []),
      catchError(() => of<any[]>([])),
      shareReplay(1)
    );

    this.leaderboardCache.set(cacheKey, request$);
    return request$;
  }

  getSeasonRewards(seasonId: number, region: Region = 'eu'): Observable<RewardEntry[]> {
    const cacheKey = `${region}:${seasonId}:rewards`;
    const cached = this.rewardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-reward/` +
          `?namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      }),
      map(res => res?.rewards ?? []),
      catchError(() => of<RewardEntry[]>([])),
      shareReplay(1)
    );

    this.rewardCache.set(cacheKey, request$);
    return request$;
  }

  getLeaderboardPage(
    seasonId: number,
    page: number,
    region: Region = 'eu',
    bracket: PvpBracket = '3v3',
    pageSize = WowApiService.CLASSIC_PAGE_SIZE
  ): Observable<any[]> {
    return this.getLeaderboardEntries(seasonId, region, bracket).pipe(
      map(entries => {
        const safePageSize = Math.max(1, Math.floor(pageSize));
        const totalPages = Math.max(1, Math.ceil(entries.length / safePageSize));
        const safePage = Math.min(Math.max(page, 1), totalPages);
        const start = (safePage - 1) * safePageSize;
        return entries.slice(start, start + safePageSize);
      })
    );
  }

  getFull3v3Ladder(pages = 5, seasonId = 13, region: Region = 'eu'): Observable<any[]> {
    return this.getFullLadderAuto(seasonId, '3v3', region, pages);
  }

  getFullLadderAuto(
    seasonId: number,
    bracket: PvpBracket,
    region: Region = 'eu',
    maxPages = 200
  ): Observable<any[]> {
    return this.getLeaderboardEntries(seasonId, region, bracket).pipe(
      map(entries => {
        const finitePages = Number.isFinite(maxPages) ? Math.max(1, Math.trunc(maxPages)) : Infinity;
        const entryLimit =
          finitePages === Infinity
            ? entries.length
            : Math.min(entries.length, finitePages * WowApiService.CLASSIC_PAGE_SIZE);
        const limited = entryLimit < entries.length ? entries.slice(0, entryLimit) : entries;
        return this.dedupeEntries(limited);
      })
    );
  }

  getFull3v3LadderAuto(
    seasonId: number,
    region: Region = 'eu',
    maxPages = 20
  ): Observable<any[]> {
    return this.getFullLadderAuto(seasonId, '3v3', region, maxPages);
  }

  getCharacterEquipment(
    realmSlug: string,
    characterName: string,
    region: Region = 'eu'
  ): Observable<any> {
    const realm = encodeURIComponent(realmSlug.toLowerCase());
    const name = encodeURIComponent(characterName.toLowerCase());
    return this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url =
          `https://${this.host(region)}/profile/wow/character/${realm}/${name}/equipment` +
          `?namespace=${this.nsProfile(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }

  getSeason(seasonId: number, region: Region = 'eu'): Observable<any> {
    return this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}` +
          `?namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }

  private dedupeEntries(entries: any[]): any[] {
    const seen = new Set<number>();
    const result: any[] = [];
    for (const entry of entries) {
      const id = entry?.character?.id;
      if (typeof id !== 'number') {
        continue;
      }
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      result.push(entry);
    }
    return result;
  }
}
