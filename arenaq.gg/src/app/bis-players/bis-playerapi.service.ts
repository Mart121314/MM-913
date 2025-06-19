import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BisPlayerApiService {
  constructor(private http: HttpClient) {}

  /**
   * Retrieve the best players grouped by class from a local JSON file.
   */
  getTopPlayersByClass(): Observable<Record<string, any[]>> {
    return this.http.get<Record<string, any[]>>('assets/bis-players.json');
  }
}