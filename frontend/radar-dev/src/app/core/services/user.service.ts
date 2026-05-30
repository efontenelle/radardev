import { Injectable } from '@angular/core';

const USER_NAME_KEY = 'radardev_user_name';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY);
  }

  setUserName(name: string): void {
    localStorage.setItem(USER_NAME_KEY, name);
  }

  hasUser(): boolean {
    const name = this.getUserName();
    return name !== null && name.trim().length > 0;
  }
}
