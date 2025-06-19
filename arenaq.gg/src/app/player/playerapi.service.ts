import { Injectable } from '@angular/core';
import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerApiService {
  constructor(private wowApi: WowApiService) {}

  getEquipment(realm: string, name: string): Observable<any> {
    return this.wowApi.getCharacterEquipment(realm, name);
  }
}
