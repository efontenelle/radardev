import { Component, Input, OnChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { ThroughputWeek } from '../../../core/models/metrics.model';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './throughput-chart.component.html',
  styleUrl: './throughput-chart.component.scss'
})
export class ThroughputChartComponent implements OnChanges {
  @Input() weeks: ThroughputWeek[] = [];

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {};
  hasData = false;
  totalDeliveries = 0;

  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      this.theme.effectiveTheme();
      this.buildChart();
    });
  }

  ngOnChanges(): void {
    this.hasData = this.weeks.some(w => w.count > 0);
    this.totalDeliveries = this.weeks.reduce((sum, w) => sum + w.count, 0);
    this.buildChart();
  }

  private buildChart(): void {
    const c = this.theme.chartPalette();
    const labels = this.weeks.map(w => `Sem ${w.isoWeek}\n${w.isoYear}`);
    const data = this.weeks.map(w => w.count);
    const maxCount = Math.max(...data, 1);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Entregas',
          data,
          backgroundColor: data.map(v => v === 0 ? c.accentSoft : c.accent),
          borderColor: data.map(v => v === 0 ? c.axisBorder : c.accent),
          borderWidth: 1,
          borderRadius: 3,
          borderSkipped: false,
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 320 },
      scales: {
        x: {
          ticks: {
            color: c.tick,
            font: { family: "'DM Sans', system-ui, sans-serif", size: 10 },
            maxRotation: 0,
          },
          grid: { display: false },
          border: { color: c.axisBorder },
        },
        y: {
          min: 0,
          max: Math.ceil(maxCount * 1.2) || 5,
          ticks: {
            color: c.tick,
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            stepSize: 1,
            precision: 0,
          },
          grid: { color: c.grid },
          border: { color: c.axisBorder },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltipBg,
          borderColor: c.tooltipBorder,
          borderWidth: 1,
          titleColor: c.tooltipTitle,
          bodyColor: c.tooltipBody,
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            title: (items) => {
              const w = this.weeks[items[0].dataIndex];
              return `Semana ${w.isoWeek} / ${w.isoYear}`;
            },
            label: (ctx) => {
              const v = ctx.parsed.y;
              return `${v} ${v === 1 ? 'entrega' : 'entregas'}`;
            },
          },
        },
      },
    };
  }
}
