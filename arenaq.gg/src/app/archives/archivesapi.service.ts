import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ArchivesApiService {
    constructor(private http: HttpClient) { }

    getSeasons(ids: number[]): Observable<any[]> {
        return this.http.get<any[]>('assets/seasons.json').pipe(
            map(all => all.filter(s => ids.includes(s.id)))
        );
    }
}