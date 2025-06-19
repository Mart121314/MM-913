import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BisGearService } from './bis-gear.service';

import { WowApiService } from '../wow-api.service';
import { BisGearService } from './bis-gear.service';
import { switchMap } from 'rxjs';


@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bis-gear.component.html',
  styleUrl: './bis-gear.component.css'
})
export class BisGearComponent implements OnInit {

  topGear: { item: string; count: number }[] = [];

  constructor(private gearSvc: BisGearService) {}

  ngOnInit(): void {
    this.gearSvc.getMostPopularGear().subscribe((gear) => {
      this.topGear = gear.slice(0, 10);

  topGear: { itemId: number; count: number }[] = [];

  constructor(private wowApi: WowApiService, private gearSvc: BisGearService) {}

  ngOnInit(): void {
    this.wowApi
      .getFull3v3Ladder(5)
      .pipe(switchMap((players) => this.gearSvc.getMostPopularGear(players)))
      .subscribe((gear) => (this.topGear = gear.slice(0, 10)));
  }
}
