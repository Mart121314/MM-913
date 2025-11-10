import { Component, OnInit, DestroyRef } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BisGearService, ClassGearSummary, GearSnapshot } from './bis-gear.service';
import { BIS_CLASS_META, BisClassSlug } from '../bis-players/bis-playerapi.service';
import { Region } from '../wow-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type GearViewModel = {
  classSlug: BisClassSlug;
  className: string;
  totalSamples: number;
  generatedAt?: string;
  regionLabel: string;
  items: ClassGearSummary['items'];
};

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule, AsyncPipe, DatePipe],
  templateUrl: './bis-gear.component.html',
  styleUrls: ['./bis-gear.component.css'],
})
export class BisGearComponent implements OnInit {
  readonly defaultRegion: Region = 'eu';
  readonly classOptions = BIS_CLASS_META;
  private readonly defaultClass: BisClassSlug;

  private readonly selectedClassSubject: BehaviorSubject<BisClassSlug>;
  readonly selectedClass$: Observable<BisClassSlug>;
  snapshot$!: Observable<GearSnapshot | null>;
  vm$!: Observable<GearViewModel | null>;

  error?: string;

  constructor(
    private readonly bisGear: BisGearService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.defaultClass = (this.classOptions[0]?.slug ?? 'death-knight') as BisClassSlug;
    this.selectedClassSubject = new BehaviorSubject<BisClassSlug>(this.defaultClass);
    this.selectedClass$ = this.selectedClassSubject.asObservable();
  }

  ngOnInit(): void {
    this.snapshot$ = this.bisGear
      .getGearSnapshot({ region: this.defaultRegion })
      .pipe(
        tap(() => (this.error = undefined)),
        catchError(() => {
          this.error = 'Failed to load gear usage data.';
          return of(null);
        })
      );

    this.route.queryParamMap
      .pipe(
        map(params => normalizeClass(params.get('class'))),
        map(slug => this.resolveClassSlug(slug)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(slug => {
        if (slug) {
          this.selectedClassSubject.next(slug);
        }
      });

    this.vm$ = combineLatest([this.selectedClass$, this.snapshot$]).pipe(
      map(([classSlug, snapshot]) => {
        if (!snapshot) {
          return null;
        }
        return this.buildViewModel(classSlug, snapshot);
      })
    );
  }

  onSelectClass(slug: BisClassSlug): void {
    if (this.selectedClassSubject.getValue() === slug) {
      return;
    }
    this.selectedClassSubject.next(slug);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        class: slug === this.defaultClass ? undefined : slug,
      },
      queryParamsHandling: 'merge',
    });
  }

  trackItem(item: ClassGearSummary['items'][number]): string {
    return `${item.slot}-${item.item}`;
  }

  getClassIcon(slug: BisClassSlug): string {
    const override = CLASS_ICON_OVERRIDES[slug];
    return `assets/icons/${override ?? `${slug}.webp`}`;
  }

  onIconError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.onerror = null;
      img.src = PLACEHOLDER_ICON;
    }
  }

  formatPercent(value: number): string {
    if (!Number.isFinite(value)) {
      return '0%';
    }
    return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
  }

  private buildViewModel(classSlug: BisClassSlug, snapshot: GearSnapshot): GearViewModel {
    const classMeta = this.classOptions.find(meta => meta.slug === classSlug);
    const classes = snapshot.classes ?? [];
    const classData = classes.find(entry => entry.classSlug === classSlug);

    return {
      classSlug,
      className: classMeta?.name ?? classData?.className ?? 'Unknown',
      totalSamples: classData?.totalSamples ?? 0,
      generatedAt: snapshot.generatedAt,
      regionLabel: (snapshot.region ?? this.defaultRegion).toUpperCase(),
      items: classData?.items ?? [],
    };
  }

  private resolveClassSlug(slug: string | null): BisClassSlug {
    if (!slug) {
      return this.defaultClass;
    }
    const match = this.classOptions.find(option => option.slug === slug);
    return (match?.slug ?? this.defaultClass) as BisClassSlug;
  }
}

function normalizeClass(value: string | null): string | null {
  return value ? value.toLowerCase() : null;
}

const PLACEHOLDER_ICON =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff6633"/><stop offset="100%" stop-color="%236b3fd6"/></linearGradient></defs><rect width="40" height="40" rx="8" fill="url(%23g)"/><text x="50%" y="55%" font-size="16" text-anchor="middle" fill="%23ffffff" font-family="Arial, sans-serif">&#9733;</text></svg>';

const CLASS_ICON_OVERRIDES: Partial<Record<BisClassSlug, string>> = {
  monk: 'Monk.webp',
};
