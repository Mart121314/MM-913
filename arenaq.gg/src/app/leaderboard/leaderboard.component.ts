import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LeaderboardApiService,
  LeaderboardEntry,
  LeaderboardPage,
} from './leaderboardapi.service';
import { PvpBracket, Region } from '../wow-api.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  rows: LeaderboardEntry[] = [];
  currentPage = 1;
  region: Region = 'eu';
  currentSeason?: number;
  bracket: PvpBracket = '3v3';
  loading = false;
  error?: string;
  readonly brackets: readonly PvpBracket[] = ['2v2', '3v3', '5v5'];
  totalEntries = 0;
  totalPages = 1;
  pageSize = 100;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private api: LeaderboardApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => {
          const region = (params.get('region') as Region | null) ?? 'eu';
          const pageParam = params.get('page');
          const page = pageParam ? Number(pageParam) : 1;
          const seasonParam = params.get('season');
          const season = seasonParam ? Number(seasonParam) : undefined;
          const bracketParam = (params.get('bracket') ?? '').toLowerCase();
          const bracket = this.isBracket(bracketParam) ? (bracketParam as PvpBracket) : '3v3';

          return {
            region,
            page: page > 0 ? page : 1,
            season: season && !Number.isNaN(season) ? season : undefined,
            bracket,
          };
        }),
        distinctUntilChanged(
          (a, b) =>
            a.region === b.region &&
            a.page === b.page &&
            a.season === b.season &&
            a.bracket === b.bracket
        ),
        switchMap(({ region, page, season, bracket }) => {
          this.region = region;
          this.currentPage = page;
          this.currentSeason = season;
          this.bracket = bracket;
          this.loading = true;
          this.error = undefined;
          return this.api.getPage(page, season, region, bracket);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page: LeaderboardPage) => {
          this.currentPage = page?.page ?? this.currentPage;
          this.pageSize = page?.pageSize ?? this.pageSize;
          this.totalEntries = page?.totalEntries ?? page.entries.length;
          this.totalPages = page?.totalPages ?? 1;
          this.rows = page.entries;
          this.loading = false;
          this.error = undefined;
        },
        error: err => {
          this.error = err?.message ?? 'Failed to load leaderboard.';
          this.loading = false;
        },
      });
  }

  loadPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.updateQueryParams({ page });
  }

  setRegion(newRegion: Region): void {
    if (newRegion === this.region) {
      return;
    }
    this.updateQueryParams({ region: newRegion, page: 1 });
  }

  setBracket(newBracket: PvpBracket): void {
    if (newBracket === this.bracket) {
      return;
    }
    this.updateQueryParams({ bracket: newBracket, page: 1 });
  }

  private isBracket(value: string | null): value is PvpBracket {
    return !!value && this.brackets.includes(value as PvpBracket);
  }

  private updateQueryParams(params: {
    region?: Region;
    page?: number;
    season?: number | undefined;
    bracket?: PvpBracket;
  }): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        region: params.region ?? this.region,
        page: params.page ?? this.currentPage,
        season: params.season ?? this.currentSeason,
        bracket: params.bracket ?? this.bracket,
      },
      queryParamsHandling: 'merge',
    });
  }

  trackByRow = (_: number, row: LeaderboardEntry) =>
    row.characterId ?? `${row.name}-${row.realmSlug}`;

  classIcon(row: LeaderboardEntry): string {
    return row.classSlug ? classIconPath(row.classSlug) : DEFAULT_CLASS_ICON;
  }

  realmClass(row: LeaderboardEntry): string {
    const faction = (row.faction ?? '').toLowerCase();
    if (faction.includes('horde')) {
      return 'faction-horde';
    }
    if (faction.includes('alliance')) {
      return 'faction-alliance';
    }
    return 'faction-neutral';
  }

  record(row: LeaderboardEntry, key: 'wins' | 'losses'): string {
    const value = row[key];
    return Number.isFinite(value ?? NaN) ? String(value) : '0';
  }

  onIconError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }
    img.onerror = null;
    img.src = DEFAULT_CLASS_ICON;
  }
}

function classIconPath(slug: string): string {
  const override = CLASS_ICON_OVERRIDES[slug];
  return `assets/icons/${override ?? `${slug}.webp`}`;
}

const CLASS_ICON_OVERRIDES: Record<string, string | undefined> = {
  monk: 'Monk.webp',
};

const DEFAULT_CLASS_ICON =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff6633"/><stop offset="100%" stop-color="%236b3fd6"/></linearGradient></defs><rect width="40" height="40" rx="8" fill="url(%23g)"/><text x="50%" y="55%" font-size="16" text-anchor="middle" fill="%23ffffff" font-family="Arial, sans-serif">&#9733;</text></svg>';
