import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardApiService {
  constructor(private http: HttpClient) {}

  getPage(_page: number): Observable<any[]> {
    return this.http
      .get<any>('assets/leaderboard.json')
      .pipe(map((d) => d.entries));
  }
}
