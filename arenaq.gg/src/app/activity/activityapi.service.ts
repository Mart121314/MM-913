import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ActivityApiService {
    private apiUrl = 'https://api.example.com/wow/cataclysm'; // Replace with the actual API URL

    constructor(private http: HttpClient) { }

    getActivities(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/activities`);
    }

    getActivityById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/activities/${id}`);
    }

    createActivity(activity: any): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<any>(`${this.apiUrl}/activities`, activity, { headers });
    }

    updateActivity(id: string, activity: any): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.put<any>(`${this.apiUrl}/activities/${id}`, activity, { headers });
    }

    deleteActivity(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/activities/${id}`);
    }
}