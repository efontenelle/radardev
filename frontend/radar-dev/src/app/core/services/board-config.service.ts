import { Injectable } from '@angular/core';
import { BoardConfig } from '../models/board-config.model';
import { UserService } from './user.service';

const CONFIG_KEY_PREFIX = 'radardev_config_';

@Injectable({
  providedIn: 'root'
})
export class BoardConfigService {
  constructor(private userService: UserService) {}

  private getKey(): string {
    return `${CONFIG_KEY_PREFIX}${this.userService.getUserName() ?? ''}`;
  }

  hasConfig(): boolean {
    const config = this.getConfig();
    return config !== null;
  }

  getConfig(): BoardConfig | null {
    try {
      const raw = localStorage.getItem(this.getKey());
      if (!raw) return null;
      return JSON.parse(raw) as BoardConfig;
    } catch {
      return null;
    }
  }

  saveConfig(config: BoardConfig): void {
    try {
      localStorage.setItem(this.getKey(), JSON.stringify(config));
    } catch {
      // localStorage inacessível (modo privado restrito)
    }
  }

  clearConfig(): void {
    try {
      localStorage.removeItem(this.getKey());
    } catch {
      // localStorage inacessível
    }
  }

  isStale(currentColumns: string[]): boolean {
    const config = this.getConfig();
    if (!config) return false;
    const saved = config.boardColumnsSnapshot;
    if (saved.length !== currentColumns.length) return true;
    return saved.some(col => !currentColumns.includes(col));
  }
}
