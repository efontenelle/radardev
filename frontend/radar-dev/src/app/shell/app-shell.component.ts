import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../core/services/user.service';
import { BoardConfigService } from '../core/services/board-config.service';
import { UserIdentificationModalComponent } from '../core/components/user-identification-modal/user-identification-modal.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, UserIdentificationModalComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent implements OnInit {
  showModal = false;
  userName = '';
  connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'connecting';
  isBoardConfigured = false;

  constructor(
    private userService: UserService,
    private boardConfigService: BoardConfigService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.showModal = !this.userService.hasUser();
    this.userName = this.userService.getUserName() ?? '';
    this.isBoardConfigured = this.boardConfigService.hasConfig();
    this.http.get(`${environment.apiUrl}/health`).subscribe({
      next: () => this.connectionStatus = 'connected',
      error: () => this.connectionStatus = 'disconnected'
    });
  }

  onUserConfirmed(name: string): void {
    this.userService.setUserName(name);
    this.userName = name;
    this.showModal = false;
  }
}
