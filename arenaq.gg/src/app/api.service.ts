import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  constructor(
    protected http: HttpClient,
    protected authService: AuthenticationService
  ) {}

  protected getAuthenticatedHeaders(): Observable<HttpHeaders> {
    return this.authService.getAccessToken().pipe(
      switchMap((token: { access_token: string }) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token.access_token}`,
        });
        return new Observable<HttpHeaders>((observer) => {
          observer.next(headers);
          observer.complete();
        });
      })
    );
  }
}