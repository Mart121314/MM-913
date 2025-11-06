import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export interface PlayerProfile {
  summary: any | null;
  equipment: any | null;
  specializations: any | null;
}

@Injectable({ providedIn: 'root' })
export class PlayerApiService {
  constructor(private wow: WowApiService) {}

  getProfile(region: Region, realm: string, name: string): Observable<PlayerProfile> {
    const normalizedName = name.toLowerCase();
    return forkJoin({
      summary: this.wow.getCharacterSummary(realm, normalizedName, region).pipe(
        catchError(() => of(null))
      ),
      equipment: this.wow.getCharacterEquipment(realm, normalizedName, region).pipe(
        catchError(() => of(null))
      ),
      specializations: this.wow.getCharacterSpecializations(realm, normalizedName, region).pipe(
        catchError(() => of(null))
      ),
    });
  }
}
