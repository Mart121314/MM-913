import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BisGearService } from './bis-gear.service';

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './bis-gear.component.html',
  styleUrls: ['./bis-gear.component.css'],
})
export class BisGearComponent implements OnInit {
  gear$!: Observable<{ item: string; count: number }[]>;
  error?: string;

  constructor(private bisGear: BisGearService) {}

  ngOnInit(): void {
    this.gear$ = this.bisGear.getMostPopularGear().pipe(
      map(items => items.slice(0, 20)),
      catchError(() => {
        this.error = 'Failed to load popular gear.';
        return of([]);
      })
    );
  }
}
