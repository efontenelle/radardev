export interface MetricsRequest {
  startColumn: string;
  endColumn: string;
  selectedLanes: string[];
  from: string; // ISO 8601
  to: string;   // ISO 8601
}

export interface MetricsResponse {
  cycleTime: CycleTimePoint[];
  percentiles: CyclePercentiles;
  throughput: ThroughputWeek[];
  age: AgeItem[];
}

export interface CycleTimePoint {
  id: number;
  title: string;
  deliveredDate: string; // ISO 8601
  cycleTimeDays: number;
}

export interface CyclePercentiles {
  p85: number;
  p90: number;
}

export interface ThroughputWeek {
  isoYear: number;
  isoWeek: number;
  weekStart: string; // ISO 8601
  count: number;
}

export interface AgeItem {
  id: number;
  title: string;
  type: string;
  ageDays: number;
}
