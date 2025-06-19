import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Injectable({
    providedIn: 'root'
})
export class ActivityApiService {
    constructor(private wowApi: WowApiService) { }

    /** Fetch information about Cataclysm Classic seasons. */
    getArchives(): Observable<any[]> {
        return forkJoin([
            this.wowApi.getSeason(9),
            this.wowApi.getSeason(10)
        ]);
    }
}