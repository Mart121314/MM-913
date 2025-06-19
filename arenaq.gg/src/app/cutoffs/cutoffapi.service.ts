import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CutoffData {
  totalPlayers: number;
  gladiatorCutoff: number;
  rank1Cutoff: number;
}

@Injectable({
  providedIn: 'root'
})
export class CutoffApiService {
  constructor(private http: HttpClient) {}

  getCutoffs(): Observable<CutoffData> {
    return this.http.get<CutoffData>('assets/cutoffs.json');
  }
}
