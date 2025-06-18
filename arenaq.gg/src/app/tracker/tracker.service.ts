import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from '../authentication.service';
import { TrackedGames } from './tracker.model';

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  private apiUrl = 'https://us.api.blizzard.com/data/wow/pvp-season'; // Base API URL

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  // Fetch tracked games data
  getTrackedGames(seasonId: number, bracket: string): Observable<TrackedGames[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${token.access_token}`
        );

        const params = new HttpParams().set('locale', 'en_US');
        return this.http.get<TrackedGames[]>(
          `${this.apiUrl}/${seasonId}/pvp-leaderboard/${bracket}`,
          { headers, params }
        );
      })
    );
  }
}