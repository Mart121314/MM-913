import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { WowApiService, Region } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class ArchivesApiService {
  constructor(private wow: WowApiService) {}

  getSeasons(ids: number[], region: Region = 'eu'): Observable<any[]> {
    if (!ids?.length) {
      return of([]);
    }
    return forkJoin(ids.map(id => this.wow.getSeason(id, region)));
  }
}
