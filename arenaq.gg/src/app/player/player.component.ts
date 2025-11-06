import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PlayerApiService } from './playerapi.service';
import { Region } from '../wow-api.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  equipment$!: Observable<any | null>;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private playerApi: PlayerApiService
  ) {}

  ngOnInit(): void {
    this.equipment$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const region = (params.get('region') as Region | null) ?? 'eu';
        const realm = params.get('realm');
        const name = params.get('name');

        if (!realm || !name) {
          this.error = 'Missing player route parameters.';
          return of(null);
        }

        this.error = undefined;
        return this.playerApi.getEquipment(region, realm, name).pipe(
          catchError(() => {
            this.error = 'Failed to load player equipment.';
            return of(null);
          })
        );
      })
    );
  }
}
