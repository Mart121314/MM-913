import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { BisPlayerApiService, TopByClass } from './bis-playerapi.service';

type PlayersFilters = {
  classSlug: string | null;
};

type PlayersViewModel = {
  filters: PlayersFilters;
  groups: TopByClass[];
};

@Component({
  selector: 'app-bis-players',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './bis-players.component.html',
  styleUrls: ['./bis-players.component.css'],
})
export class BisPlayersComponent implements OnInit {
  vm$!: Observable<PlayersViewModel>;
  error?: string;

  constructor(private bisApi: BisPlayerApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.vm$ = this.route.queryParamMap.pipe(
      map(params => ({
        classSlug: normalize(params.get('class')),
      })),
      distinctUntilChanged((a, b) => a.classSlug === b.classSlug),
      switchMap(filters =>
        this.bisApi
          .getTopPlayersByClass({
            classSlug: filters.classSlug ?? undefined,
          })
          .pipe(
            tap(() => (this.error = undefined)),
            map(groups => ({
              filters,
              groups,
            })),
            catchError(() => {
              this.error = 'Failed to load players.';
              return of({
                filters,
                groups: [],
              });
            })
          )
      )
    );
  }
}

function normalize(value: string | null): string | null {
  return value ? value.toLowerCase() : null;
}
