import { Injectable } from '@angular/core';

import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LeaderboardApiService {


  constructor(private wow: WowApiService) {}

  /** Retrieve a page of the 3v3 leaderboard from Blizzard's API */
  getPage(page: number, seasonId = 11): Observable<any[]> {
    return this.wow.getLeaderboardPage(seasonId, page);

  }
}
