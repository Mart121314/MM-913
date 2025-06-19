import { Injectable } from '@angular/core';

import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';



import { Observable, map } from 'rxjs';
import { WowApiService } from '../wow-api.service';

import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class PlayerApiService {


  constructor(private wow: WowApiService) {}

  /** Fetch a character's equipment from Blizzard API */
  getEquipment(realm: string, name: string): Observable<string[]> {
    return this.wow
      .getCharacterEquipment(realm, name)
      .pipe(map((res) => (res.equipped_items || []).map((i: any) => i.item.name)));


  constructor(private wowApi: WowApiService) {}

  getEquipment(realm: string, name: string): Observable<any> {
    return this.wowApi.getCharacterEquipment(realm, name);

  }
}
