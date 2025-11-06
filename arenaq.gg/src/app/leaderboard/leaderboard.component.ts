import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardApiService } from './leaderboardapi.service';

type Region = 'eu' | 'us';

type Row = {
  id: number | null;
  name: string;
  realm: string;
  classId: number | null;
  rank: number | null;
  rating: number | null;
  
};

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],   // <-- plural
})
export class LeaderboardComponent implements OnInit {
  rows: Row[] = [];
  currentPage = 1;
  region: Region = 'eu';                        // <-- define it
  loading = false;
  error?: string;

  constructor(private api: LeaderboardApiService) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(page: number = this.currentPage, seasonId: number = 13) {
    this.loading = true;
    this.api.getPage(page, seasonId, this.region).subscribe({
      next: (entries: any[]) => {
        this.rows = (entries ?? []).map((e) => ({
          id: e?.character?.id ?? null,
          name: e?.character?.name ?? e?.name ?? 'Unknown',
          realm: e?.character?.realm?.slug ?? e?.realm?.slug ?? '',
          classId: e?.character?.playable_class?.id ?? e?.class?.id ?? null,
          rank: e?.rank ?? null,
          rating: e?.rating ?? null,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'Failed to load ladder';
        this.loading = false;
      },
    });
  }

  setRegion(newRegion: Region) {
    if (this.region !== newRegion) {
      this.region = newRegion;
      this.currentPage = 1;
      this.loadPage(1);
    }
  }

  trackById = (_: number, row: Row) => row.id ?? `${row.name}:${row.realm}`;
}