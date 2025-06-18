import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WowApiService } from '../wow-api.service';

@Component({
  selector: 'app-cutoffs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cutoffs.component.html',
  styleUrls: ['./cutoffs.component.css'],
})
export class CutoffsComponent implements OnInit {
  gladiatorCutoff: number | null = null;
  totalPlayers: number = 0;

  constructor(private wowApi: WowApiService) {}

  ngOnInit(): void {
  this.wowApi.getFull3v3Ladder().subscribe({
    next: (entries) => {
      this.totalPlayers = entries.length;

      entries.sort((a: any, b: any) => b.rating - a.rating);
      const cutoffIndex = Math.floor(this.totalPlayers * 0.005);
      this.gladiatorCutoff = entries[cutoffIndex]?.rating ?? null;
      console.log(`Cutoff determined from ${this.totalPlayers} players`);
    },
    error: (err) => {
      console.error('Leaderboard fetch failed', err);
    },
  });
}
}