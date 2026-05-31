import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BoardConfigService } from '../../core/services/board-config.service';
import { UserService } from '../../core/services/user.service';
import { MetricsApiService } from '../../core/services/metrics-api.service';
import { MetricsRequest, MetricsResponse, CycleTimePoint, CyclePercentiles, ThroughputWeek, AgeItem } from '../../core/models/metrics.model';
import { PeriodFilterComponent, DateRange } from './period-filter/period-filter.component';
import { CycleTimeChartComponent } from './cycle-time-chart/cycle-time-chart.component';
import { ThroughputChartComponent } from './throughput-chart/throughput-chart.component';
import { AgeRankingComponent } from './age-ranking/age-ranking.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PeriodFilterComponent,
    CycleTimeChartComponent,
    ThroughputChartComponent,
    AgeRankingComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  loading = false;
  error = false;

  cycleTimePoints: CycleTimePoint[] = [];
  percentiles: CyclePercentiles = { p85: 0, p90: 0 };
  throughputWeeks: ThroughputWeek[] = [];
  ageItems: AgeItem[] = [];

  private currentRange: DateRange = this.defaultRange();

  constructor(
    private boardConfigService: BoardConfigService,
    private userService: UserService,
    private metricsApi: MetricsApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Range already set via default; PeriodFilterComponent emits on init and triggers load.
  }

  onRangeChange(range: DateRange): void {
    this.currentRange = range;
    this.loadMetrics();
  }

  retry(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    const config = this.boardConfigService.getConfig();
    if (!config) {
      this.router.navigate(['/settings']);
      return;
    }

    const userName = this.userService.getUserName() ?? undefined;

    const request: MetricsRequest = {
      startColumn: config.startColumn,
      endColumn: config.endColumn,
      selectedLanes: config.selectedLanes,
      from: this.currentRange.from.toISOString(),
      to: this.currentRange.to.toISOString(),
    };

    this.loading = true;
    this.error = false;

    this.metricsApi.getMetrics(request, userName).subscribe({
      next: (res: MetricsResponse) => {
        this.cycleTimePoints = res.cycleTime;
        this.percentiles = res.percentiles;
        this.throughputWeeks = res.throughput;
        this.ageItems = res.age;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        // 400 = config inconsistente — redireciona para reconfiguração
        if (err.status === 400) {
          this.boardConfigService.clearConfig();
          this.router.navigate(['/settings']);
        } else {
          this.error = true;
        }
      },
    });
  }

  private defaultRange(): DateRange {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return { from, to };
  }
}
