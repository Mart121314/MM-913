import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Region, PvpBracket } from '../wow-api.service';

export interface LeaderboardEntry {
  characterId: number | null;
  name: string;
  routeName: string;
  realmSlug: string;
  realmName: string;
  faction: string | null;
  classId: number | null;
  className: string;
  classSlug: string | null;
  specName: string | null;
  specSlug: string | null;
  race: string | null;
  rank: number | null;
  rating: number | null;
  wins: number | null;
  losses: number | null;
}

export interface LeaderboardCutoffs {
  rank1: number | null;
  gladiator: number | null;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  totalEntries: number;
  totalPages: number;
  page: number;
  pageSize: number;
  seasonId: number | null;
  generatedAt?: string;
  cutoffs: LeaderboardCutoffs | null;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private static readonly PAGE_SIZE = 100;

  constructor(private http: HttpClient) {}

  getPage(
    page: number,
    seasonId?: number,
    region: Region = 'eu',
    bracket: PvpBracket = '3v3'
  ): Observable<LeaderboardPage> {
    const params = new HttpParams()
      .set('region', region)
      .set('bracket', bracket)
      .set('page', String(page))
      .set('pageSize', String(LeaderboardApiService.PAGE_SIZE));

    return this.http.get<any>('/api/leaderboard', { params }).pipe(
      map(response => ({
        entries: response?.entries ?? [],
        totalEntries: response?.totalEntries ?? 0,
        totalPages: response?.totalPages ?? 1,
        page: response?.page ?? page,
        pageSize: response?.pageSize ?? LeaderboardApiService.PAGE_SIZE,
        seasonId: response?.seasonId ?? null,
        generatedAt: response?.generatedAt,
        cutoffs: response?.cutoffs ?? null,
      }))
    );
  }

  getCutoffs(region: Region, bracket: PvpBracket): Observable<LeaderboardCutoffs | null> {
    const params = new HttpParams()
      .set('region', region)
      .set('bracket', bracket)
      .set('page', '1')
      .set('pageSize', '1');

    return this.http.get<any>('/api/leaderboard', { params }).pipe(
      map(res => res?.cutoffs ?? null)
    );
  }
}
