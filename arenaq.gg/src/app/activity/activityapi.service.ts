import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ActivityApiService {
    constructor(private http: HttpClient) { }

    /** Fetch information about Cataclysm Classic seasons from local data. */
    getArchives(): Observable<any[]> {
        return this.http.get<any[]>('assets/seasons.json');
    }
}