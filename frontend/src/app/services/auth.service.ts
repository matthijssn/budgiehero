import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiAuth;

  constructor(private http: HttpClient) {}

  /** Login gebruiker */
  login(data: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, data);
  }

  /** Registreer nieuwe gebruiker */
  register(data: { email: string; password: string; name: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }
}