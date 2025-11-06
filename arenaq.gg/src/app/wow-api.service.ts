import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, takeWhile, toArray } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { AuthenticationService } from './authentication.service';

export type Region = 'eu' | 'us';

@Injectable({ providedIn: 'root' })
export class WowApiService extends BaseApiService {
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

  getLeaderboardPage(seasonId: number, page: number, region: Region = 'eu'): Observable<any[]> {
    return this.getAuthenticatedHeaders().pipe(
      switchMap(headers => {
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3` +
          `?page=${page}&namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers }).pipe(
          map(res => res?.entries ?? []),
          catchError(() => of<any[]>([]))
        );
      })
    );
  }

  getFull3v3Ladder(pages = 5, seasonId = 13, region: Region = 'eu'): Observable<any[]> {
    const pageNumbers = Array.from({ length: Math.max(1, pages) }, (_, i) => i + 1);
    return this.getAuthenticatedHeaders().pipe(
      switchMap(headers =>
        from(pageNumbers).pipe(
          concatMap(page => {
            const url =
              `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3` +
              `?page=${page}&namespace=${this.nsDynamic(region)}&locale=en_GB`;
            return this.http.get<any>(url, { headers }).pipe(
              map(res => res?.entries ?? []),
              catchError(() => of<any[]>([]))
            );
          }),
          toArray(),
          map(chunks => this.dedupeEntries(chunks.flat()))
        )
      )
    );
  }

  getFull3v3LadderAuto(
    seasonId: number,
    region: Region = 'eu',
    maxPages = 20
  ): Observable<any[]> {
    const pages = Array.from({ length: Math.max(1, maxPages) }, (_, i) => i + 1);
    return from(pages).pipe(
      concatMap(page => this.getLeaderboardPage(seasonId, page, region)),
      takeWhile(entries => entries.length > 0, true),
      toArray(),
      map(chunks => this.dedupeEntries(chunks.flat()))
    );
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
