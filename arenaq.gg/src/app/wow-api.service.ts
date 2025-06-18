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

  getFull3v3Ladder(): Observable<any[]> {
  const region = 'eu'; // or 'us'
  const seasonId = 11;

  return this.authService.getAccessToken().pipe(
    switchMap((token) => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token.access_token}`,
      });

      const maxPages = 5;
      const pages = Array.from({ length: maxPages }, (_, i) => i + 1);

      return from(pages).pipe(
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
            (v, i, a) => a.findIndex((t) => t.character?.id === v.character?.id) === i
          );
          return unique;
        })
      );
    })
  );
}
}
