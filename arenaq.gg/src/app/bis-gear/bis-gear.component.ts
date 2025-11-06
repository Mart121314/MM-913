import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { BisGearService, PopularGearEntry } from './bis-gear.service';

type GearFiltersState = {
  classSlug: string | null;
  slot: string | null;
  specSlug: string | null;
};

type GearViewModel = {
  filters: GearFiltersState;
  items: PopularGearEntry[];
};

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './bis-gear.component.html',
  styleUrls: ['./bis-gear.component.css'],
})
export class BisGearComponent implements OnInit {
  vm$!: Observable<GearViewModel>;
  error?: string;

  constructor(private bisGear: BisGearService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.vm$ = this.route.queryParamMap.pipe(
      map(params => ({
        classSlug: normalizeQuery(params.get('class')),
        slot: normalizeQuery(params.get('slot')),
        specSlug: normalizeQuery(params.get('spec')),
      })),
      distinctUntilChanged(
        (a, b) =>
          a.classSlug === b.classSlug &&
          a.slot === b.slot &&
          a.specSlug === b.specSlug
      ),
      switchMap(filters =>
        this.bisGear
          .getMostPopularGear({
            classSlug: filters.classSlug ?? undefined,
            slot: filters.slot ?? undefined,
            specSlug: filters.specSlug ?? undefined,
          })
          .pipe(
            tap(() => (this.error = undefined)),
            map(items => ({
              filters,
              items: items.slice(0, 20),
            })),
            catchError(() => {
              this.error = 'Failed to load popular gear.';
              return of({
                filters,
                items: [],
              });
            })
          )
      )
    );
  }
}

function normalizeQuery(value: string | null): string | null {
  return value ? value.toLowerCase() : null;
}
