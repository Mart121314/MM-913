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
    // Example usage with hardcoded player and realm
    this.playerApi.getEquipment('some-realm', 'Gladsup').subscribe((e) => {
      this.equipment = e;
    });
  }
}
