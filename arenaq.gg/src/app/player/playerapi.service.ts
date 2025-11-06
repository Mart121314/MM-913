import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WowApiService, Region } from '../wow-api.service';

@Injectable({ providedIn: 'root' })
export class PlayerApiService {
  constructor(private wow: WowApiService) {}

  getEquipment(region: Region, realm: string, name: string): Observable<any> {
    return this.wow.getCharacterEquipment(realm, name, region);
  }
}
