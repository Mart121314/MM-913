import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Injectable({
    providedIn: 'root'
})
export class ArchivesApiService {
    constructor(private wow: WowApiService) { }

    /** Fetch season details for the given IDs */
    getSeasons(ids: number[]): Observable<any[]> {
        return forkJoin(ids.map(id => this.wow.getSeason(id)));
    }
}