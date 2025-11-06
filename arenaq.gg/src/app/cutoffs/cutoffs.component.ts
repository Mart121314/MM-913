import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { CutoffApiService, CutoffData } from './cutoffapi.service';
import { PvpBracket, Region } from '../wow-api.service';

type HistoryPoint = {
  date: string; // yyyy-mm-dd
  rank1: number;
  gladiator: number;
};

type RenderPoint = {
  x: number;
  y: number;
  value: number;
  date: Date;
  label: string;
};

@Component({
  selector: 'app-cutoffs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cutoffs.component.html',
  styleUrls: ['./cutoffs.component.css'],
})
export class CutoffsComponent implements OnInit {
  gladiatorCutoff: number | null = null;
  rank1Cutoff: number | null = null;
  gladiatorSpots = 0;
  rank1Spots = 0;
  totalPlayers = 0;
  currentRegion: Region = 'eu';
  currentSeason?: number;
  currentBracket: PvpBracket = '3v3';
  readonly brackets: readonly PvpBracket[] = ['2v2', '3v3', '5v5'];
  loading = false;
  error?: string;
  seasonStartDate?: Date;
  lastUpdated?: Date;

  historyPoints: HistoryPoint[] = [];
  rank1Path = '';
  gladiatorPath = '';
  rank1RenderPoints: RenderPoint[] = [];
  gladiatorRenderPoints: RenderPoint[] = [];
  xAxisTicks: Array<{ x: number; label: string }> = [];
  yAxisTicks: Array<{ y: number; label: string }> = [];
  chartReady = false;

  readonly chartWidth = 680;
  readonly chartHeight = 320;
  readonly chartPadding = 48;
  private readonly fallbackSeasonStart = new Date('2025-08-01T00:00:00Z');
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private cutoffApi: CutoffApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => {
          const region = (params.get('region') as Region | null) ?? 'eu';
          const seasonParam = params.get('season');
          const season = seasonParam ? Number(seasonParam) : undefined;
          const bracketParam = (params.get('bracket') ?? '').toLowerCase();
          const bracket = this.isBracket(bracketParam) ? (bracketParam as PvpBracket) : '3v3';
          return {
            region,
            season: season && !Number.isNaN(season) ? season : undefined,
            bracket,
          };
        }),
        distinctUntilChanged(
          (a, b) => a.region === b.region && a.season === b.season && a.bracket === b.bracket
        ),
        switchMap(({ region, season, bracket }) => {
          this.currentRegion = region;
          this.currentSeason = season;
          this.currentBracket = bracket;
          this.loading = true;
          this.error = undefined;
          this.gladiatorCutoff = null;
          this.rank1Cutoff = null;
          this.gladiatorSpots = 0;
          this.rank1Spots = 0;
          this.totalPlayers = 0;
          this.chartReady = false;
          return this.cutoffApi.getCutoffs(region, season, bracket);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data: CutoffData) => {
          this.loading = false;
          this.totalPlayers = data.totalPlayers;
          this.gladiatorCutoff = data.gladiatorCutoff;
          this.rank1Cutoff = data.rank1Cutoff;
          this.gladiatorSpots = data.gladiatorSpots;
          this.rank1Spots = data.rank1Spots;
          this.currentBracket = data.bracket;
          this.seasonStartDate = this.resolveSeasonStart(data.seasonStart);
          this.lastUpdated = data.fetchedAt ? new Date(data.fetchedAt) : new Date();
          this.updateHistory(data);
          this.updateChart();
          if (!this.totalPlayers) {
            this.error = 'No rated players found or API unavailable.';
          }
        },
        error: err => {
          this.loading = false;
          this.error = err?.message ?? 'Failed to load cutoff data.';
        },
      });
  }

  setBracket(bracket: PvpBracket): void {
    if (bracket === this.currentBracket) {
      return;
    }
    this.updateQueryParams({ bracket });
  }

  private isBracket(value: string | null): value is PvpBracket {
    return !!value && this.brackets.includes(value as PvpBracket);
  }

  private updateQueryParams(params: { region?: Region; season?: number | undefined; bracket?: PvpBracket }): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        region: params.region ?? this.currentRegion,
        season: params.season ?? this.currentSeason,
        bracket: params.bracket ?? this.currentBracket,
      },
      queryParamsHandling: 'merge',
    });
  }

  private updateHistory(data: CutoffData): void {
    const key = this.historyStorageKey(this.currentRegion, this.currentBracket);
    const stored = this.readHistory(key);
    const updated = this.mergeHistory(stored, data);
    this.historyPoints = updated;
    this.writeHistory(key, updated);
  }

  get seasonStartDisplay(): Date {
    return this.seasonStartDate ?? this.fallbackSeasonStart;
  }

  private updateChart(): void {
    if (!this.historyPoints.length) {
      this.rank1Path = '';
      this.gladiatorPath = '';
      this.rank1RenderPoints = [];
      this.gladiatorRenderPoints = [];
      this.xAxisTicks = [];
      this.yAxisTicks = [];
      this.chartReady = false;
      return;
    }

    const dataPoints = this.historyPoints
      .map(point => ({
        date: this.toDate(point.date),
        rank1: point.rank1 ?? 0,
        gladiator: point.gladiator ?? 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const minDate = dataPoints[0].date;
    const maxDate = dataPoints[dataPoints.length - 1].date;
    const innerWidth = this.chartWidth - this.chartPadding * 2;
    const innerHeight = this.chartHeight - this.chartPadding * 2;
    const dateRange = Math.max(1, maxDate.getTime() - minDate.getTime());

    let minValue = Math.min(
      ...dataPoints.map(p => Math.min(p.rank1, p.gladiator))
    );
    let maxValue = Math.max(
      ...dataPoints.map(p => Math.max(p.rank1, p.gladiator))
    );

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      minValue = 0;
      maxValue = 100;
    }

    if (minValue === maxValue) {
      minValue = Math.max(0, minValue - 50);
      maxValue = maxValue + 50;
    }

    const valuePadding = Math.max(10, Math.round((maxValue - minValue) * 0.05));
    minValue = Math.max(0, minValue - valuePadding);
    maxValue = maxValue + valuePadding;

    const step = this.computeNiceStep(maxValue - minValue);
    minValue = this.roundDown(minValue, step);
    maxValue = this.roundUp(maxValue, step);

    const toX = (date: Date) =>
      this.chartPadding +
      ((date.getTime() - minDate.getTime()) / Math.max(1, dateRange)) * innerWidth;

    const toY = (value: number) =>
      this.chartHeight -
      this.chartPadding -
      ((value - minValue) / Math.max(1, maxValue - minValue)) * innerHeight;

    this.rank1RenderPoints = dataPoints.map(point => ({
      x: toX(point.date),
      y: toY(point.rank1),
      value: Math.round(point.rank1),
      date: point.date,
      label: this.labelForDate(point.date),
    }));

    this.gladiatorRenderPoints = dataPoints.map(point => ({
      x: toX(point.date),
      y: toY(point.gladiator),
      value: Math.round(point.gladiator),
      date: point.date,
      label: this.labelForDate(point.date),
    }));

    this.rank1Path = this.buildPath(this.rank1RenderPoints);
    this.gladiatorPath = this.buildPath(this.gladiatorRenderPoints);
    this.xAxisTicks = this.buildXAxisTicks(minDate, maxDate, toX);
    this.yAxisTicks = this.buildYAxisTicks(minValue, maxValue, toY, step);
    this.chartReady = this.rank1RenderPoints.length > 1 || this.gladiatorRenderPoints.length > 1;
  }

  private mergeHistory(existing: HistoryPoint[], data: CutoffData): HistoryPoint[] {
    const seasonStart = this.startOfDay(this.seasonStartDate ?? this.fallbackSeasonStart);
    const seasonStartDay = this.toDayString(seasonStart);
    const currentDay = this.toDayString(this.startOfDay(data.fetchedAt ? new Date(data.fetchedAt) : new Date()));

    const map = new Map<string, HistoryPoint>();
    for (const point of existing) {
      const day = this.toDayString(this.startOfDay(this.toDate(point.date)));
      map.set(day, {
        date: day,
        rank1: Number.isFinite(point.rank1) ? point.rank1 : 0,
        gladiator: Number.isFinite(point.gladiator) ? point.gladiator : 0,
      });
    }

    map.set(currentDay, {
      date: currentDay,
      rank1: data.rank1Cutoff ?? 0,
      gladiator: data.gladiatorCutoff ?? 0,
    });

    let history = Array.from(map.values()).filter(point => point.date >= seasonStartDay);
    history.sort((a, b) => a.date.localeCompare(b.date));

    if (!history.length) {
      history = [
        {
          date: currentDay,
          rank1: data.rank1Cutoff ?? 0,
          gladiator: data.gladiatorCutoff ?? 0,
        },
      ];
    }

    if (history[0].date !== seasonStartDay) {
      const seed = history[0];
      history.unshift({
        date: seasonStartDay,
        rank1: seed.rank1,
        gladiator: seed.gladiator,
      });
    }

    const limit = 180;
    if (history.length > limit) {
      history = history.slice(history.length - limit);
    }

    return history;
  }

  private resolveSeasonStart(iso?: string): Date {
    if (!iso) {
      return this.fallbackSeasonStart;
    }
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? this.fallbackSeasonStart : parsed;
  }

  private historyStorageKey(region: Region, bracket: PvpBracket): string {
    return `cutoff-history:${region}:${bracket}`;
  }

  private readHistory(key: string): HistoryPoint[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map(item => ({
          date: typeof item?.date === 'string' ? item.date : '',
          rank1: Number(item?.rank1 ?? 0),
          gladiator: Number(item?.gladiator ?? 0),
        }))
        .filter(item => !!item.date);
    } catch {
      return [];
    }
  }

  private writeHistory(key: string, history: HistoryPoint[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(history));
    } catch {
      // Ignore storage failures (quota, private mode, etc.)
    }
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  private toDayString(date: Date): string {
    return this.startOfDay(date).toISOString().slice(0, 10);
  }

  private toDate(day: string): Date {
    return new Date(`${day}T00:00:00Z`);
  }

  private buildPath(points: RenderPoint[]): string {
    if (!points.length) {
      return '';
    }
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' ');
  }

  private buildXAxisTicks(
    minDate: Date,
    maxDate: Date,
    toX: (date: Date) => number
  ): Array<{ x: number; label: string }> {
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    const monthlyTicks: Array<{ x: number; label: string; time: number }> = [];
    const cursor = new Date(minDate);
    cursor.setUTCHours(0, 0, 0, 0);
    if (cursor.getUTCDate() !== 1) {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    } else {
      cursor.setUTCDate(1);
    }

    while (cursor <= maxDate) {
      monthlyTicks.push({
        x: toX(new Date(cursor)),
        label: formatter.format(cursor),
        time: cursor.getTime(),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }

    const minPixelSpacing = 32;
    const ticks: Array<{ x: number; label: string }> = [
      { x: toX(minDate), label: formatter.format(minDate) },
    ];

    for (const tick of monthlyTicks) {
      const last = ticks[ticks.length - 1];
      if (tick.x - last.x < minPixelSpacing) {
        continue;
      }
      ticks.push({ x: tick.x, label: tick.label });
    }

    const endX = toX(maxDate);
    const endLabel = formatter.format(maxDate);
    const last = ticks[ticks.length - 1];
    if (endX - last.x < minPixelSpacing) {
      ticks[ticks.length - 1] = { x: endX, label: endLabel };
    } else {
      ticks.push({ x: endX, label: endLabel });
    }

    return ticks;
  }

  private buildYAxisTicks(
    minValue: number,
    maxValue: number,
    toY: (value: number) => number,
    step: number
  ): Array<{ y: number; label: string }> {
    const ticks: Array<{ y: number; label: string }> = [];
    const start = this.roundDown(minValue, step);
    const end = this.roundUp(maxValue, step);
    for (let value = start; value <= end + step / 2; value += step) {
      ticks.push({ y: toY(value), label: Math.round(value).toString() });
    }
    return ticks;
  }

  private labelForDate(date: Date): string {
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return formatter.format(date);
  }

  private computeNiceStep(range: number): number {
    if (!Number.isFinite(range) || range <= 0) {
      return 50;
    }
    const roughStep = range / 4;
    const exponent = Math.floor(Math.log10(roughStep));
    const base = Math.pow(10, exponent);
    const candidates = [1, 2, 5, 10];
    for (const candidate of candidates) {
      const step = candidate * base;
      if (roughStep <= step) {
        return step;
      }
    }
    return 10 * base;
  }

  private roundDown(value: number, step: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0) {
      return value;
    }
    return Math.floor(value / step) * step;
  }

  private roundUp(value: number, step: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0) {
      return value;
    }
    return Math.ceil(value / step) * step;
  }
}
