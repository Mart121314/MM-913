import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, concatMap, map, switchMap, takeWhile, toArray } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { AuthenticationService } from './authentication.service';

export type Region = 'eu' | 'us';

@Injectable({ providedIn: 'root' })
export class WowApiService extends BaseApiService {
  constructor(http: HttpClient, authService: AuthenticationService) {
    super(http, authService);
  }

  /** Helpers */
private host = (r: Region) => `${r}.api.blizzard.com`;
private nsDyn = (r: Region) => `dynamic-classic-${r}`;
private nsProfile(region: Region) { return `profile-classic-${region}`; }  // MoP/Cata Classic

  /** Season index (source of truth; avoids 404 guessing) */
getClassicSeasonIndex(region: Region) {
  return this.authService.getAccessToken().pipe(
    switchMap(t => {
      const headers = new HttpHeaders({ Authorization: `Bearer ${t.access_token}` });
      const url = `https://${this.host(region)}/data/wow/pvp-season/index?namespace=${this.nsDyn(region)}&locale=en_GB`;
      return this.http.get<any>(url, { headers });
    }),
    map(idx => idx?.seasons ?? [])
  );
}

  /** One leaderboard page (returns [] on error) */
  getLeaderboardPage(
    seasonId: number,
    page: number,
    region: Region = 'eu'
  ): Observable<any[]> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3` +
          `?page=${page}&namespace=${this.nsDyn(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers }).pipe(
          map(res => res?.entries ?? []),
          catchError(() => of([]))
        );
      })
    );
  }

  /** Walk pages until empty (caps at maxPages) */
getFull3v3LadderAuto(seasonId: number, region: Region, maxPages = 20) {
  const pages = Array.from({ length: maxPages }, (_, i) => i + 1);
  return from(pages).pipe(
    concatMap(p => this.get3v3Page(seasonId, p, region)),
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

  /** Legacy: fixed number of pages (kept, but typed consistently) */
 private get3v3Page(seasonId: number, page: number, region: Region) {
  return this.authService.getAccessToken().pipe(
    switchMap(t => {
      const headers = new HttpHeaders({ Authorization: `Bearer ${t.access_token}` });
      const url =
        `https://${this.host(region)}/data/wow/pvp-season/${seasonId}/pvp-leaderboard/3v3` +
        `?page=${page}&namespace=${this.nsDyn(region)}&locale=en_GB`;
      return this.http.get<any>(url, { headers }).pipe(
        map(r => r?.entries ?? []),
        catchError(() => of([]))
      );
    })
  );
}

  /** Character equipment (MoP Classic only) */
  getCharacterEquipment(
    realmSlug: string,
    characterName: string,
    region: Region = 'eu'
  ): Observable<any> {
    const realm = encodeURIComponent(realmSlug.toLowerCase());
    const name  = encodeURIComponent(characterName.toLowerCase());

    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${this.host(region)}/profile/wow/character/${realm}/${name}/equipment` +
          `?namespace=${this.nsProfile(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }

  /** Season metadata */
  getSeason(seasonId: number, region: Region = 'eu'): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.access_token}` });
        const url =
          `https://${this.host(region)}/data/wow/pvp-season/${seasonId}` +
          `?namespace=${this.nsDyn(region)}&locale=en_GB`;
        return this.http.get<any>(url, { headers });
      })
    );
  }
}
