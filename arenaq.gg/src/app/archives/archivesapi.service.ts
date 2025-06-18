import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ArchivesApiService {

    private apiUrl = 'https://api.example.com/archives'; // Replace with the actual API URL

    constructor(private http: HttpClient) { }

    getPreviousSeasons(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/previous-seasons`);
    }

    getSeasonDetails(seasonId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/season-details/${seasonId}`);
    }
}