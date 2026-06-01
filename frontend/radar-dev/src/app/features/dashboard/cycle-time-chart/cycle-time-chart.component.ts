import { Component, Input, OnChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { CycleTimePoint, CyclePercentiles } from '../../../core/models/metrics.model';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-cycle-time-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './cycle-time-chart.component.html',
  styleUrl: './cycle-time-chart.component.scss'
})
export class CycleTimeChartComponent implements OnChanges {
  @Input() points: CycleTimePoint[] = [];
  @Input() percentiles: CyclePercentiles = { p85: 0, p90: 0 };

  chartData: { datasets: any[] } = { datasets: [] };
  chartOptions: ChartOptions<'scatter'> = {};
  hasData = false;

  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      this.theme.effectiveTheme();
      this.buildChart();
    });
  }

  ngOnChanges(): void {
    this.hasData = this.points.length > 0;
    this.buildChart();
  }

  private buildChart(): void {
    const c = this.theme.chartPalette();

    if (!this.hasData) {
      this.chartData = { datasets: [] };
      return;
    }

    const scatterData = this.points.map(p => ({
      x: new Date(p.deliveredDate).getTime(),
      y: p.cycleTimeDays
    }));

    const xValues = scatterData.map(d => d.x);
    const xSpan = Math.max(...xValues) - Math.min(...xValues);
    const pad = xSpan > 0 ? xSpan * 0.05 : 86_400_000 * 3;
    const minX = Math.min(...xValues) - pad;
    const maxX = Math.max(...xValues) + pad;

    this.chartData = {
      datasets: [
        {
          type: 'line' as const,
          label: `P85`,
          data: [{ x: minX, y: this.percentiles.p85 }, { x: maxX, y: this.percentiles.p85 }],
          borderColor: c.p85,
          borderWidth: 1.5,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 1,
        },
        {
          type: 'line' as const,
          label: `P90`,
          data: [{ x: minX, y: this.percentiles.p90 }, { x: maxX, y: this.percentiles.p90 }],
          borderColor: c.p90,
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 2,
        },
        {
          type: 'scatter' as const,
          label: 'Cards',
          data: scatterData,
          backgroundColor: c.accent,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBorderWidth: 0,
          order: 3,
        },
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 320 },
      scales: {
        x: {
          type: 'linear',
          min: minX,
          max: maxX,
          ticks: {
            color: c.tick,
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            maxTicksLimit: 8,
            callback: (value) => {
              const d = new Date(value as number);
              return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            },
          },
          grid: { color: c.grid },
          border: { color: c.axisBorder },
        },
        y: {
          ticks: {
            color: c.tick,
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            callback: (v) => `${v}d`,
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
            title: () => '',
            label: (ctx) => {
              if (ctx.datasetIndex === 2) {
                const pt = this.points[ctx.dataIndex];
                return [`${pt.title}`, `${pt.cycleTimeDays.toFixed(1)} dias`];
              }
              return ctx.dataset.label ?? '';
            },
          },
        },
      },
    } as ChartOptions<'scatter'>;
  }
}
