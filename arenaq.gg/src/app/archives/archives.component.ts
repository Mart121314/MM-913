import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivesApiService } from './archivesapi.service';
import { PvpBracket, Region } from '../wow-api.service';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css']
})
export class ArchivesComponent implements OnInit {
  readonly regions: Region[] = ['eu', 'us'];
  readonly brackets: PvpBracket[] = ['2v2', '3v3', '5v5'];

  region: Region = 'eu';
  bracket: PvpBracket = '3v3';
  loading = false;
  seasons: any[] = [];

  constructor(private archivesApi: ArchivesApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  setRegion(region: Region): void {
    if (region === this.region) {
      return;
    }
    this.region = region;
    this.refresh();
  }

  setBracket(bracket: PvpBracket): void {
    if (bracket === this.bracket) {
      return;
    }
    this.bracket = bracket;
    this.refresh();
  }

  private refresh(): void {
    this.loading = true;
    this.archivesApi.getRecentSeasonsWithStandings(this.bracket, this.region).subscribe(seasons => {
      this.seasons = seasons;
      this.loading = false;
    });
  }
}
