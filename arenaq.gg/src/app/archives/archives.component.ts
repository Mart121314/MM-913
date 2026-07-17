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

  loadingSeasons = false;
  loadingStandings = false;

  seasons: any[] = [];
  selectedSeasonId: number | null = null;
  standings: any[] = [];

  constructor(private archivesApi: ArchivesApiService) {}

  ngOnInit(): void {
    this.loadSeasons();
  }

  setRegion(region: Region): void {
    if (region === this.region) {
      return;
    }
    this.region = region;
    this.loadSeasons();
  }

  setBracket(bracket: PvpBracket): void {
    if (bracket === this.bracket) {
      return;
    }
    this.bracket = bracket;
    if (this.selectedSeasonId != null) {
      this.loadStandings(this.selectedSeasonId);
    }
  }

  selectSeason(seasonId: number): void {
    if (seasonId === this.selectedSeasonId) {
      return;
    }
    this.loadStandings(seasonId);
  }

  get selectedSeason(): any {
    return this.seasons.find(s => s.id === this.selectedSeasonId) ?? null;
  }

  private loadSeasons(): void {
    this.loadingSeasons = true;
    this.archivesApi.getRecentSeasons(4, this.region).subscribe(seasons => {
      this.seasons = seasons;
      this.loadingSeasons = false;
      const firstSeasonId = seasons[0]?.id ?? null;
      if (firstSeasonId != null) {
        this.loadStandings(firstSeasonId);
      } else {
        this.selectedSeasonId = null;
        this.standings = [];
      }
    });
  }

  private loadStandings(seasonId: number): void {
    this.selectedSeasonId = seasonId;
    this.loadingStandings = true;
    this.archivesApi.getSeasonStandings(seasonId, this.bracket, this.region).subscribe(standings => {
      this.standings = standings;
      this.loadingStandings = false;
    });
  }
}
