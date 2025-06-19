import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Injectable({
    providedIn: 'root'
})
export class ActivityApiService {
    constructor(private wow: WowApiService) { }

    /** Fetch information for Cataclysm Classic seasons 9–11 */
    getArchives(): Observable<any[]> {
        const seasons = [9, 10, 11];
        return forkJoin(seasons.map(id => this.wow.getSeason(id)));
    }
}