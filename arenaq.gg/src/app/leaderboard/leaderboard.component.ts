import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeaderboardApiService, LeaderboardPage } from './leaderboardapi.service';
import { PvpBracket, Region } from '../wow-api.service';

type Row = {
  id: number | null;
  name: string;
  realm: string;
  className: string;
  rank: number | null;
  rating: number | null;
  wins: number | null;
  losses: number | null;
};

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  rows: Row[] = [];
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
          const entries = page?.entries ?? [];
          this.currentPage = page?.page ?? this.currentPage;
          this.pageSize = page?.pageSize ?? this.pageSize;
          this.totalEntries = page?.totalEntries ?? entries.length;
          this.totalPages = page?.totalPages ?? 1;
          this.rows = entries.map(entry => ({
            id: entry?.character?.id ?? null,
            name: entry?.character?.name ?? entry?.name ?? 'Unknown',
            realm: entry?.character?.realm?.slug ?? entry?.realm?.slug ?? '',
            className: entry?.character?.playable_class?.name ?? 'Unknown',
            rank: entry?.rank ?? null,
            rating: entry?.rating ?? null,
            wins: entry?.season_match_statistics?.won ?? null,
            losses: entry?.season_match_statistics?.lost ?? null,
          }));
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

  trackByRow = (_: number, row: Row) => row.id ?? `${row.name}-${row.realm}`;
}
