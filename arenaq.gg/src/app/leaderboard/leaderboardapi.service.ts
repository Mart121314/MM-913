import { Injectable } from '@angular/core';
import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardApiService {
  constructor(private wowApi: WowApiService) {}

  getPage(page: number): Observable<any[]> {
    return this.wowApi.getLeaderboardPage(11, page);
  }
}
