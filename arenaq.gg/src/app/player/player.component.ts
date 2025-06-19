import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerApiService } from './playerapi.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.css'
})
export class PlayerComponent implements OnInit {
  equipment: any;

  constructor(private playerApi: PlayerApiService) {}

  ngOnInit(): void {
    // Example: hardcoded player name from sample data
    this.playerApi.getEquipment('Gladsup').subscribe((e) => {
      this.equipment = e;
    });
  }
}
