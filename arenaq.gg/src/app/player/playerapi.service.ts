import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerApiService {
  constructor(private http: HttpClient) {}

  getEquipment(name: string): Observable<string[]> {
    return this.http.get<Record<string, any[]>>('assets/bis-players.json').pipe(
      map((groups) => {
        for (const players of Object.values(groups)) {
          const found = players.find(
            (p: any) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (found) {
            return found.gear || [];
          }
        }
        return [] as string[];
      })
    );
  }
}
