import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivesApiService } from './archivesapi.service';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css']
})
export class ArchivesComponent implements OnInit {
  seasons: any[] = [];

  constructor(private archivesApi: ArchivesApiService) {}

  ngOnInit(): void {
    this.archivesApi.getSeasons([9, 10]).subscribe((data) => {
      this.seasons = data;
    });
  }
}
