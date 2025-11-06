import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardApiService } from './leaderboardapi.service';
import { Region } from '../wow-api.service';

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
  loading = false;
  error?: string;

  constructor(private api: LeaderboardApiService) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(page: number = this.currentPage, seasonId: number = 13): void {
    if (page < 1) {
      return;
    }
    this.loading = true;
    this.api.getPage(page, seasonId, this.region).subscribe({
      next: entries => {
        this.rows = (entries ?? []).map(entry => ({
          id: entry?.character?.id ?? null,
          name: entry?.character?.name ?? entry?.name ?? 'Unknown',
          realm: entry?.character?.realm?.slug ?? entry?.realm?.slug ?? '',
          className: entry?.character?.playable_class?.name ?? 'Unknown',
          rank: entry?.rank ?? null,
          rating: entry?.rating ?? null,
          wins: entry?.season_match_statistics?.won ?? null,
          losses: entry?.season_match_statistics?.lost ?? null,
        }));
        this.currentPage = page;
        this.loading = false;
        this.error = undefined;
      },
      error: err => {
        this.error = err?.message ?? 'Failed to load leaderboard.';
        this.loading = false;
      },
    });
  }

  setRegion(newRegion: Region): void {
    if (newRegion === this.region) {
      return;
    }
    this.region = newRegion;
    this.currentPage = 1;
    this.loadPage(1);
  }

  trackByRow = (_: number, row: Row) => row.id ?? `${row.name}-${row.realm}`;
}
