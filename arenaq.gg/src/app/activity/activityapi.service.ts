import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { WowApiService, Region } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  constructor(private wow: WowApiService) {}

  getArchives(region: Region = 'eu'): Observable<any[]> {
    const seasonIds = [9, 10, 11];
    if (!seasonIds.length) {
      return of([]);
    }
    return forkJoin(seasonIds.map(id => this.wow.getSeason(id, region)));
  }
}
