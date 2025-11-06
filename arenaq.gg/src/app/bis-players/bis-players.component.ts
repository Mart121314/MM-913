import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BisPlayerApiService, TopByClass } from './bis-playerapi.service';
import { WowApiService } from '../wow-api.service';             // <-- add
import { switchMap } from 'rxjs/operators';                      // <-- add

@Component({
  selector: 'app-bis-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bis-players.component.html',
  styleUrls: ['./bis-players.component.css'],
})
export class BisPlayersComponent implements OnInit {
  topByClass: TopByClass[] = [];
  loading = false;
  error?: string;

  constructor(
    private api: BisPlayerApiService,
    private wow: WowApiService                                 // <-- add
  ) {}

  ngOnInit(): void {
    this.loading = true;

    const region: 'eu' = 'eu';
    const maxPages = 12;   // how many leaderboard pages to read
    const perClass = 5;    // how many players per class to show

    this.wow.getClassicSeasonIndex(region)
      .pipe(
        switchMap(seasonId =>
          this.api.getTopPlayersByClass(seasonId, region, maxPages, perClass)
        )
      )
      .subscribe({
        next: groups => {
          this.topByClass = groups ?? [];
          this.loading = false;
        },
        error: e => {
          this.error = e?.message ?? 'Failed to load';
          this.loading = false;
        },
      });
  }

  trackByClass = (_: number, g: TopByClass) => g.classId;
}