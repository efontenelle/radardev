import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AzureDevOpsApiService } from '../../core/services/azure-devops-api.service';
import { BoardConfigService } from '../../core/services/board-config.service';
import { Board, BoardColumn } from '../../core/models/board.model';
import { BoardConfig } from '../../core/models/board-config.model';

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-settings.component.html',
  styleUrl: './board-settings.component.scss'
})
export class BoardSettingsComponent implements OnInit {
  board: Board | null = null;
  loading = true;
  loadError = false;
  staleWarning = false;
  validationError = '';

  startColumn = '';
  endColumn = '';
  selectedLanes: Set<string> = new Set();

  constructor(
    private api: AzureDevOpsApiService,
    private boardConfigService: BoardConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoard();
  }

  loadBoard(): void {
    this.loading = true;
    this.loadError = false;
    this.api.getBoardColumns().subscribe({
      next: (board) => {
        this.board = { ...board, columns: [...board.columns].sort((a, b) => a.order - b.order) };
        this.loading = false;
        const currentColumns = this.board.columns.map(c => c.name);

        if (this.boardConfigService.isStale(currentColumns)) {
          this.boardConfigService.clearConfig();
          this.staleWarning = true;
        } else {
          const saved = this.boardConfigService.getConfig();
          if (saved) {
            this.startColumn = saved.startColumn;
            this.endColumn = saved.endColumn;
            this.selectedLanes = new Set(saved.selectedLanes);
          }
        }

        if (this.board.lanes.length > 0 && this.selectedLanes.size === 0) {
          this.board.lanes.forEach(l => this.selectedLanes.add(l));
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  get availableEndColumns(): BoardColumn[] {
    if (!this.board || !this.startColumn) return this.board?.columns ?? [];
    const startOrder = this.board.columns.find(c => c.name === this.startColumn)?.order ?? -1;
    return this.board.columns.filter(c => c.order > startOrder);
  }

  toggleLane(lane: string): void {
    if (this.selectedLanes.has(lane)) {
      this.selectedLanes.delete(lane);
    } else {
      this.selectedLanes.add(lane);
    }
  }

  isLaneSelected(lane: string): boolean {
    return this.selectedLanes.has(lane);
  }

  onSave(): void {
    this.validationError = '';

    if (!this.startColumn || !this.endColumn) {
      this.validationError = 'Selecione a coluna de início e a coluna de fim.';
      return;
    }

    if (this.startColumn === this.endColumn) {
      this.validationError = 'A coluna de início e fim não podem ser iguais.';
      return;
    }

    if (this.board && this.board.lanes.length > 0 && this.selectedLanes.size === 0) {
      this.validationError = 'Selecione pelo menos uma lane.';
      return;
    }

    const config: BoardConfig = {
      startColumn: this.startColumn,
      endColumn: this.endColumn,
      selectedLanes: Array.from(this.selectedLanes),
      boardColumnsSnapshot: this.board!.columns.map(c => c.name),
      configuredAt: new Date().toISOString()
    };

    this.boardConfigService.saveConfig(config);
    this.router.navigate(['/']);
  }
}
