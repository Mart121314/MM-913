import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PvpBracket, Region } from '../wow-api.service';

export interface PlayerHistoryEvent {
  bracket: PvpBracket;
  rating: number | null;
  ratingChange: number;
  winsChange: number;
  lossesChange: number;
  trackedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerHistoryService {
  constructor(private http: HttpClient) {}

  getRecentHistory(
    region: Region,
    characterId?: number | null,
    realmSlug?: string | null,
    name?: string | null,
    limit = 25
  ): Observable<PlayerHistoryEvent[]> {
    const params = new HttpParams().set('region', region);
    return this.http.get<any>('/api/tracker', { params }).pipe(
      map(response => {
        const events: any[] = response?.events ?? [];
        if (!events.length) {
          return [];
        }
        const realm = realmSlug?.toLowerCase();
        const playerName = name?.toLowerCase();

        const filtered = events.filter(event => {
          if (characterId && event?.characterId === characterId) {
            return true;
          }
          if (realm && playerName) {
            return (
              String(event?.realm ?? '').toLowerCase() === realm &&
              String(event?.name ?? '').toLowerCase() === playerName
            );
          }
          return false;
        });

        return filtered
          .slice(0, limit)
          .map<PlayerHistoryEvent>(event => ({
            bracket: this.normalizeBracket(event?.bracket) ?? '3v3',
            rating: Number.isFinite(event?.rating) ? Number(event.rating) : null,
            ratingChange: Number.isFinite(event?.ratingChange) ? Number(event.ratingChange) : 0,
            winsChange: Number.isFinite(event?.winsChange) ? Number(event.winsChange) : 0,
            lossesChange: Number.isFinite(event?.lossesChange) ? Number(event.lossesChange) : 0,
            trackedAt: event?.trackedAt ?? new Date().toISOString(),
          }));
      }),
      catchError(() => of([]))
    );
  }

  private normalizeBracket(value: string | null | undefined): PvpBracket | null {
    if (!value) {
      return null;
    }
    const lower = value.toLowerCase();
    return lower === '2v2' || lower === '3v3' || lower === '5v5' ? (lower as PvpBracket) : null;
  }
}

