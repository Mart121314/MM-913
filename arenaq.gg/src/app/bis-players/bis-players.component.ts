import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BisPlayerApiService } from './bis-playerapi.service';

@Component({
  selector: 'app-bis-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bis-players.component.html',
  styleUrls: ['./bis-players.component.css']
})
export class BisPlayersComponent implements OnInit {
  playersByClass: Record<string, any[]> = {};

  constructor(private bisApi: BisPlayerApiService) {}

  ngOnInit(): void {
    this.bisApi.getTopPlayersByClass().subscribe((data) => {
      this.playersByClass = data;
    });
  }
}
