import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WowApiService } from '../wow-api.service';




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


  }}