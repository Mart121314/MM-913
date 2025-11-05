import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Injectable({
    providedIn: 'root'
})
export class ActivityApiService {
    constructor(private wowApi: WowApiService) { }
    getArchives(): Observable<any[]> {
        const seasons = [9, 10, 11, 12];
        return forkJoin(seasons.map(id => this.wowApi.getSeason(id)));

    }};