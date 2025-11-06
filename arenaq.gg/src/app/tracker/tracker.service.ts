import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PvpBracket, Region } from '../wow-api.service';

export type TrackerEvent = {
  id: string;
  bracket: PvpBracket;
  characterId: number;
  name: string;
  realm: string;
  race: string;
  className: string;
  spec: string;
  rank: number | null;
  rankChange: number;
  rating: number | null;
  ratingChange: number;
  wins: number | null;
  winsChange: number;
  losses: number | null;
  lossesChange: number;
  trackedAt: string;
};

export type TrackerResponse = {
  region: Region;
  generatedAt: string;
  events: TrackerEvent[];
};

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  constructor(private http: HttpClient) {}

  getActivity(region: Region): Observable<TrackerResponse> {
    const params = new HttpParams().set('region', region);
    return this.http.get<TrackerResponse>('/api/tracker', { params });
  }
}
