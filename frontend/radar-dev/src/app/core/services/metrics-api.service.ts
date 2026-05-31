import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetricsRequest, MetricsResponse } from '../models/metrics.model';

@Injectable({
  providedIn: 'root'
})
export class MetricsApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(userName?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (userName) {
      headers = headers.set('X-User-Name', userName);
    }
    return headers;
  }

  getMetrics(request: MetricsRequest, userName?: string): Observable<MetricsResponse> {
    return this.http.post<MetricsResponse>(
      `${this.apiUrl}/api/metrics`,
      request,
      { headers: this.getHeaders(userName) }
    );
  }
}
