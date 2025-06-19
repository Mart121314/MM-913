import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, mergeMap, toArray, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class WowApiService extends BaseApiService {
  private baseUrl = 'https://eu.api.blizzard.com';

  /** Fetch a single leaderboard page for a given season. */
  getLeaderboardPage(
    seasonId: number,
    page: number,
    region: string = 'eu'
  ): Observable<any[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token.access_token}`,
        });
        const url =
          `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}` +
          `/pvp-leaderboard/3v3?page=${page}&namespace=dynamic-classic-${region}` +
          `&locale=en_GB`;
        return this.http
          .get<any>(url, { headers })
          .pipe(catchError(() => of({ entries: [] })));
      }),
      map((res) => res.entries || [])
    );
  }

  /**
   * Fetch the 3v3 ladder for the given season. By default this grabs
   * the first five pages which roughly equals the top 1000 players.
   */
  getFull3v3Ladder(
    pages: number = 5,
    seasonId: number = 11,
    region: string = 'eu'
  ): Observable<any[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token.access_token}`,
        });
        const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);
        return from(pageNumbers).pipe(
          mergeMap((page) =>
            this.http
              .get<any>(
                `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3?page=${page}&namespace=dynamic-classic-${region}&locale=en_GB`,
                { headers }
              )
              .pipe(catchError(() => of({ entries: [] })))
          ),
          toArray(),
          map((responses) => {
            const all = responses.flatMap((res) => res.entries || []);
            const unique = all.filter(
              (v, i, a) =>
                a.findIndex((t) => t.character?.id === v.character?.id) === i
            );
            return unique;
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
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token.access_token}`,
        });
        const url =
          `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}` +
          `/${characterName}/equipment?namespace=profile-classic-${region}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }

  /** Fetch basic season information. */
  getSeason(seasonId: number, region: string = 'eu'): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token.access_token}`,
        });
        return this.http.get<any>(
          `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}?namespace=dynamic-classic-${region}&locale=en_GB`,
          { headers }
        );
      })
    );
  }
}
