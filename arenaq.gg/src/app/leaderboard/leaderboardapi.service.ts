import { Injectable } from '@angular/core';
import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';

// Define the allowed regions
export type Region = 'eu' | 'us';

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  constructor(private wow: WowApiService) {}

  // Correct: region is 'eu' or 'us'
  getPage(page: number, seasonId = 13, region: Region = 'eu'): Observable<any[]> {
    return this.wow.getLeaderboardPage(seasonId, page, region);
  }
}