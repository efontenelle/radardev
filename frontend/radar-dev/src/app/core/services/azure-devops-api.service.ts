import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkItem } from '../models/work-item.model';
import { StateTransition } from '../models/state-transition.model';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class AzureDevOpsApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(userName?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (userName) {
      headers = headers.set('X-User-Name', userName);
    }
    return headers;
  }

  getWorkItems(from: Date, to: Date, userName?: string): Observable<WorkItem[]> {
    const params = {
      from: from.toISOString(),
      to: to.toISOString()
    };
    return this.http.get<WorkItem[]>(`${this.apiUrl}/api/workitems`, {
      params,
      headers: this.getHeaders(userName)
    });
  }

  getWorkItemHistory(id: number, userName?: string): Observable<StateTransition[]> {
    return this.http.get<StateTransition[]>(`${this.apiUrl}/api/workitems/${id}/history`, {
      headers: this.getHeaders(userName)
    });
  }

  getBoardColumns(): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/api/board/columns`);
  }
}
