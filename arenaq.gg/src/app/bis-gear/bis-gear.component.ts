import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BisGearService } from './bis-gear.service';

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bis-gear.component.html',
  styleUrls: ['./bis-gear.component.css']
})
export class BisGearComponent implements OnInit {
  topGear: { item: string; count: number }[] = [];

  constructor(private gearSvc: BisGearService) {}

  ngOnInit(): void {
    this.gearSvc.getMostPopularGear().subscribe((gear) => {
      this.topGear = gear.slice(0, 10);
    });
  }
}
