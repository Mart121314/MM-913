import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  getAccessToken(): Observable<{ access_token: string }> {
    return this.http.get<{ access_token: string }>('https://arenaq-api.onrender.com/api/token');
  }
}