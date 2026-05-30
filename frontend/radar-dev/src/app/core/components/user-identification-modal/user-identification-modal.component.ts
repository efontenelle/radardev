import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-identification-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user-identification-modal.component.html',
  styleUrl: './user-identification-modal.component.scss'
})
export class UserIdentificationModalComponent {
  @Output() confirmed = new EventEmitter<string>();
  userName = '';

  confirm(): void {
    if (this.userName.trim()) {
      this.confirmed.emit(this.userName.trim());
    }
  }
}
