import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgeItem } from '../../../core/models/metrics.model';

@Component({
  selector: 'app-age-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-ranking.component.html',
  styleUrl: './age-ranking.component.scss'
})
export class AgeRankingComponent implements OnChanges {
  @Input() items: AgeItem[] = [];

  maxAge = 1;

  ngOnChanges(): void {
    this.maxAge = this.items.length > 0
      ? Math.max(...this.items.map(i => i.ageDays), 1)
      : 1;
  }

  barWidth(ageDays: number): string {
    return `${Math.round((ageDays / this.maxAge) * 100)}%`;
  }

  isStale(ageDays: number): boolean {
    return ageDays > 14;
  }
}
