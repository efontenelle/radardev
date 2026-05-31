import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { CycleTimePoint, CyclePercentiles } from '../../../core/models/metrics.model';

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

  ngOnChanges(): void {
    this.hasData = this.points.length > 0;
    this.buildChart();
  }

  private buildChart(): void {
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
          borderColor: 'rgba(52, 160, 107, 0.7)',
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
          borderColor: 'rgba(196, 120, 40, 0.7)',
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
          backgroundColor: 'rgba(61, 90, 224, 0.65)',
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
            color: '#6b7494',
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            maxTicksLimit: 8,
            callback: (value) => {
              const d = new Date(value as number);
              return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            },
          },
          grid: { color: 'rgba(100, 116, 139, 0.1)' },
          border: { color: 'rgba(100, 116, 139, 0.2)' },
        },
        y: {
          ticks: {
            color: '#6b7494',
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            callback: (v) => `${v}d`,
          },
          grid: { color: 'rgba(100, 116, 139, 0.1)' },
          border: { color: 'rgba(100, 116, 139, 0.2)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#d4d8e6',
          borderWidth: 1,
          titleColor: '#6b7494',
          bodyColor: '#1e2340',
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
