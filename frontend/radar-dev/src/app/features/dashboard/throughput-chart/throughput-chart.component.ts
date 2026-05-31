import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { ThroughputWeek } from '../../../core/models/metrics.model';

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

  ngOnChanges(): void {
    this.hasData = this.weeks.some(w => w.count > 0);
    this.totalDeliveries = this.weeks.reduce((sum, w) => sum + w.count, 0);
    this.buildChart();
  }

  private buildChart(): void {
    const labels = this.weeks.map(w => `Sem ${w.isoWeek}\n${w.isoYear}`);
    const data = this.weeks.map(w => w.count);
    const maxCount = Math.max(...data, 1);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Entregas',
          data,
          backgroundColor: data.map(v =>
            v === 0
              ? 'rgba(100, 116, 139, 0.12)'
              : 'rgba(61, 90, 224, 0.72)'
          ),
          borderColor: data.map(v =>
            v === 0
              ? 'rgba(100, 116, 139, 0.2)'
              : 'rgba(61, 90, 224, 0.9)'
          ),
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
            color: '#6b7494',
            font: { family: "'DM Sans', system-ui, sans-serif", size: 10 },
            maxRotation: 0,
          },
          grid: { display: false },
          border: { color: 'rgba(100, 116, 139, 0.2)' },
        },
        y: {
          min: 0,
          max: Math.ceil(maxCount * 1.2) || 5,
          ticks: {
            color: '#6b7494',
            font: { family: "'DM Sans', system-ui, sans-serif", size: 11 },
            stepSize: 1,
            precision: 0,
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
