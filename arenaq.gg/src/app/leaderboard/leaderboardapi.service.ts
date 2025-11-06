import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WowApiService, Region } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  constructor(private wow: WowApiService) {}

  getPage(page: number, seasonId = 13, region: Region = 'eu'): Observable<any[]> {
    return this.wow.getLeaderboardPage(seasonId, page, region);
  }
}
