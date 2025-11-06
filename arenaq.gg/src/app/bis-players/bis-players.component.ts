import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BisPlayerApiService, TopByClass } from './bis-playerapi.service';

@Component({
  selector: 'app-bis-players',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './bis-players.component.html',
  styleUrls: ['./bis-players.component.css'],
})
export class BisPlayersComponent implements OnInit {
  players$!: Observable<TopByClass[]>;
  error?: string;

  constructor(private bisApi: BisPlayerApiService) {}

  ngOnInit(): void {
    this.players$ = this.bisApi.getTopPlayersByClass().pipe(
      catchError(() => {
        this.error = 'Failed to load players.';
        return of([]);
      })
    );
  }
}
