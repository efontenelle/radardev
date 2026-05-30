import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../core/services/user.service';
import { UserIdentificationModalComponent } from '../core/components/user-identification-modal/user-identification-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UserIdentificationModalComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent implements OnInit {
  showModal = false;
  userName = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.showModal = !this.userService.hasUser();
    this.userName = this.userService.getUserName() ?? '';
  }

  onUserConfirmed(name: string): void {
    this.userService.setUserName(name);
    this.userName = name;
    this.showModal = false;
  }
}
