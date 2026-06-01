import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface ChartPalette {
  tick: string;
  grid: string;
  axisBorder: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipTitle: string;
  tooltipBody: string;
  accent: string;
  accentSoft: string;
  p85: string;
  p90: string;
}

const THEME_KEY = 'radardev_theme';

const CHART_DEFAULTS: ChartPalette = {
  tick:         '#6b7494',
  grid:         'rgba(100, 116, 139, 0.1)',
  axisBorder:   'rgba(100, 116, 139, 0.2)',
  tooltipBg:    '#ffffff',
  tooltipBorder:'#d4d8e6',
  tooltipTitle: '#6b7494',
  tooltipBody:  '#1e2340',
  accent:       'rgba(61, 90, 224, 0.7)',
  accentSoft:   'rgba(100, 116, 139, 0.12)',
  p85:          'rgba(52, 160, 107, 0.7)',
  p90:          'rgba(196, 120, 40, 0.7)',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this._loadMode());
  private readonly _mq = this._getMediaQuery();

  readonly mode = this._mode.asReadonly();
  readonly effectiveTheme = computed<EffectiveTheme>(() =>
    this._resolve(this._mode())
  );

  constructor() {
    // Adopt the data-theme already set by the inline script — don't fight it.
    // Listener fires only when mode is 'system' so explicit choices are sticky.
    this._mq?.addEventListener('change', () => {
      if (this._mode() === 'system') {
        this._applyEffective();
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this._persist(mode);
    this._mode.set(mode);
    this._applyEffective();
  }

  chartPalette(): ChartPalette {
    const s = getComputedStyle(document.documentElement);
    const get = (v: string, fallback: string) =>
      s.getPropertyValue(v).trim() || fallback;
    return {
      tick:         get('--chart-tick',          CHART_DEFAULTS.tick),
      grid:         get('--chart-grid',          CHART_DEFAULTS.grid),
      axisBorder:   get('--chart-axis-border',   CHART_DEFAULTS.axisBorder),
      tooltipBg:    get('--chart-tooltip-bg',    CHART_DEFAULTS.tooltipBg),
      tooltipBorder:get('--chart-tooltip-border',CHART_DEFAULTS.tooltipBorder),
      tooltipTitle: get('--chart-tooltip-title', CHART_DEFAULTS.tooltipTitle),
      tooltipBody:  get('--chart-tooltip-body',  CHART_DEFAULTS.tooltipBody),
      accent:       get('--chart-accent',        CHART_DEFAULTS.accent),
      accentSoft:   get('--chart-accent-soft',   CHART_DEFAULTS.accentSoft),
      p85:          get('--chart-p85',           CHART_DEFAULTS.p85),
      p90:          get('--chart-p90',           CHART_DEFAULTS.p90),
    };
  }

  private _resolve(mode: ThemeMode): EffectiveTheme {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return this._mq?.matches ? 'dark' : 'light';
  }

  private _applyEffective(): void {
    document.documentElement.setAttribute('data-theme', this.effectiveTheme());
  }

  private _loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch { /* localStorage inacessível */ }
    return 'system';
  }

  private _persist(mode: ThemeMode): void {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch { /* localStorage inacessível */ }
  }

  private _getMediaQuery(): MediaQueryList | null {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return null;
    }
  }
}
