import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardApiService } from './leaderboardapi.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  players: any[] = [];
  currentPage = 1;

  constructor(private lbApi: LeaderboardApiService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    if (page < 1) return;
    this.lbApi.getPage(page).subscribe((data) => {
      this.players = data;
      this.currentPage = page;
    });
  }
}
