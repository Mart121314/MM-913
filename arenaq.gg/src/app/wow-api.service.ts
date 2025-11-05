import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, mergeMap, toArray, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { AuthenticationService } from './authentication.service';

// If you might target Era/Hardcore later, use: type ClassicFamily = 'classic' | 'classic1x';
type ClassicFamily = 'classic';

@Injectable({ providedIn: 'root' })
export class WowApiService extends BaseApiService {
  private classicFamily: ClassicFamily = 'classic';

  constructor(http: HttpClient, authService: AuthenticationService) {
    super(http, authService); // ✅ pass concrete class to BaseApiService
  }

  /** Namespace helpers (return strings, not booleans) */
  private nsDynamic(region: string): string {
    return this.classicFamily === 'classic'
      ? `dynamic-classic-${region}`
      : `dynamic-classic1x-${region}`;
  }

  private nsProfile(region: string): string {
    return this.classicFamily === 'classic'
      ? `profile-classic-${region}`
      : `profile-classic1x-${region}`;
  }

  /** Fetch a single leaderboard page for a given season. */
  getLeaderboardPage(
    seasonId: number,
    page: number,
    region: string = 'eu'
  ): Observable<any[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}` +
          `/pvp-leaderboard/3v3?page=${page}&namespace=${this.nsDynamic(region)}` +
          `&locale=en_GB`;
        return this.http.get<any>(url, { headers }).pipe(catchError(() => of({ entries: [] })));
      }),
      map((res) => res.entries || [])
    );
  }

  /** Fetch the 3v3 ladder for the given season. */
  getFull3v3Ladder(
    pages: number = 5,
    seasonId: number = 11,
    region: string = 'eu'
  ): Observable<any[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);

        return from(pageNumbers).pipe(
          mergeMap((page) =>
            this.http
              .get<any>(
                `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3?page=${page}&namespace=${this.nsDynamic(region)}&locale=en_GB`,
                { headers }
              )
              .pipe(catchError(() => of({ entries: [] })))
          ),
          toArray(),
          map((responses) => {
            const all = responses.flatMap((res) => res.entries || []);
            // de-dupe by character id
            return all.filter(
              (v, i, a) => a.findIndex((t) => t.character?.id === v.character?.id) === i
            );
          })
        );
      })
    );
  }

  /** Fetch equipment for a specific character. */
  getCharacterEquipment(
    realmSlug: string,
    characterName: string,
    region: string = 'eu'
  ): Observable<any> {
    const realm = encodeURIComponent(realmSlug.toLowerCase());
    const name = encodeURIComponent(characterName.toLowerCase());

    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${region}.api.blizzard.com/profile/wow/character/${realm}/${name}/equipment` +
          `?namespace=${this.nsProfile(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      }),
      // Optional fallback to Era/Hardcore namespace if you later switch classicFamily logic.
      catchError((err) => {
        if (this.classicFamily === 'classic') {
          const altNs = `profile-classic1x-${region}`;
          return this.authService.getAccessToken().pipe(
            switchMap((token) => {
              const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
              const url =
                `https://${region}.api.blizzard.com/profile/wow/character/${realm}/${name}/equipment` +
                `?namespace=${altNs}&locale=en_GB`;
              return this.http.get<any>(url, { headers });
            })
          );
        }
        throw err;
      })
    );
  }

  /** Fetch basic season information. */
  getSeason(seasonId: number, region: string = 'eu'): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}` +
          `?namespace=${this.nsDynamic(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }
}
