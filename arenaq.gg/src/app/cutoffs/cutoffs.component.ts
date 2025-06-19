import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CutoffApiService, CutoffData } from './cutoffapi.service';

@Component({
  selector: 'app-cutoffs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cutoffs.component.html',
  styleUrls: ['./cutoffs.component.css'],
})
export class CutoffsComponent implements OnInit {
  gladiatorCutoff: number | null = null;
  rank1Cutoff: number | null = null;
  totalPlayers = 0;

  constructor(private cutoffApi: CutoffApiService) {}

  ngOnInit(): void {
    this.cutoffApi.getCutoffs().subscribe((data: CutoffData) => {
      this.totalPlayers = data.totalPlayers;
      this.gladiatorCutoff = data.gladiatorCutoff;
      this.rank1Cutoff = data.rank1Cutoff;
    });
  }
}