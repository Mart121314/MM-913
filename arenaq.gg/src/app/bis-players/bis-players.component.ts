import { Component, OnInit, DestroyRef } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BIS_CLASS_META,
  BisClassSlug,
  BisPlayerApiService,
  BisTopEntry,
  BisTopSnapshot,
} from './bis-playerapi.service';
import { Region } from '../wow-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type PlayersViewModel = {
  classSlug: BisClassSlug;
  className: string;
  entries: BisTopEntry[];
  generatedAt?: string;
  regionLabel: string;
  specs: SpecOption[];
  activeSpec: string | null;
};

type SpecOption = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-bis-players',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterModule, DatePipe],
  templateUrl: './bis-players.component.html',
  styleUrls: ['./bis-players.component.css'],
})
export class BisPlayersComponent implements OnInit {
  readonly defaultRegion: Region = 'eu';
  readonly classOptions = BIS_CLASS_META;

  private readonly selectedClassSubject: BehaviorSubject<BisClassSlug>;
  private readonly specFilterSubject = new BehaviorSubject<string | null>(null);
  readonly selectedClass$: Observable<BisClassSlug>;
  readonly specFilter$ = this.specFilterSubject.asObservable();
  readonly snapshot$: Observable<BisTopSnapshot>;

  vm$!: Observable<PlayersViewModel>;

  constructor(
    private readonly bisApi: BisPlayerApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    const defaultSlug = this.bisApi.getDefaultClass();
    this.selectedClassSubject = new BehaviorSubject<BisClassSlug>(defaultSlug);
    this.selectedClass$ = this.selectedClassSubject.asObservable();
    this.snapshot$ = this.bisApi.getSnapshot();
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => ({
          classSlug: normalizeClass(params.get('class')),
          spec: normalizeValue(params.get('spec')),
        })),
        map(({ classSlug, spec }) => ({
          classSlug: this.resolveClassSlug(classSlug) ?? this.bisApi.getDefaultClass(),
          spec,
        })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ classSlug, spec }) => {
        this.selectedClassSubject.next(classSlug);
        this.specFilterSubject.next(spec);
      });

    this.vm$ = combineLatest([
      this.selectedClass$,
      this.specFilter$,
      this.snapshot$,
    ]).pipe(
      map(([classSlug, specFilter, snapshot]) =>
        this.buildViewModel(classSlug, specFilter, snapshot)
      )
    );
  }

  onSelectClass(slug: BisClassSlug): void {
    const current = this.selectedClassSubject.getValue();
    if (current === slug) {
      return;
    }
    this.selectedClassSubject.next(slug);
    this.specFilterSubject.next(null);
    const defaultSlug = this.bisApi.getDefaultClass();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        class: slug === defaultSlug ? undefined : slug,
        spec: undefined,
      },
      queryParamsHandling: 'merge',
    });
  }

  trackPlayer(_: number, item: BisTopEntry): number {
    return item.id;
  }

  formatRating(value: number | null): string {
    return Number.isFinite(value ?? NaN) ? String(value) : '-';
  }

  getClassIcon(slug: BisClassSlug): string {
    const override = CLASS_ICON_OVERRIDES[slug];
    return `assets/icons/${override ?? `${slug}.webp`}`;
  }

  onIconError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }
    img.onerror = null;
    img.src = PLACEHOLDER_ICON;
  }

  onSelectSpec(specValue: string | null): void {
    const normalized = specValue ? specValue : null;
    if (this.specFilterSubject.getValue() === normalized) {
      return;
    }
    this.specFilterSubject.next(normalized);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        spec: normalized ?? undefined,
      },
      queryParamsHandling: 'merge',
    });
  }

  private buildViewModel(
    classSlug: BisClassSlug,
    specFilter: string | null,
    snapshot: BisTopSnapshot
  ): PlayersViewModel {
    const classMeta = this.classOptions.find(meta => meta.slug === classSlug);
    const regionSnapshot = snapshot.regions?.[this.defaultRegion];
    const allEntries = regionSnapshot?.classes?.[classSlug] ?? [];
    const specs = extractSpecs(allEntries);
    const hasSpec = specFilter && specs.some(spec => spec.value === specFilter);

    const filteredEntries = hasSpec
      ? allEntries.filter(entry => normalizeValue(entry.spec) === specFilter)
      : allEntries;

    return {
      classSlug,
      className: classMeta?.name ?? 'Unknown',
      entries: filteredEntries,
      generatedAt: regionSnapshot?.generatedAt ?? snapshot.generatedAt,
      regionLabel: this.defaultRegion.toUpperCase(),
      specs,
      activeSpec: hasSpec ? specFilter : null,
    };
  }

  private resolveClassSlug(slug: string | null): BisClassSlug | null {
    if (!slug) {
      return null;
    }
    const match = this.classOptions.find(
      option => option.slug === slug.toLowerCase()
    );
    return match?.slug ?? null;
  }
}

function normalizeClass(value: string | null): string | null {
  return value ? value.toLowerCase() : null;
}

function normalizeValue(value: string | null | undefined): string | null {
  return value ? value.trim().toLowerCase() : null;
}

function extractSpecs(entries: BisTopEntry[]): SpecOption[] {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const normalized = normalizeValue(entry.spec);
    if (!normalized) {
      continue;
    }
    if (!seen.has(normalized)) {
      seen.set(normalized, entry.spec);
    }
  }
  return Array.from(seen.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const PLACEHOLDER_ICON =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff6633"/><stop offset="100%" stop-color="%236b3fd6"/></linearGradient></defs><rect width="40" height="40" rx="8" fill="url(%23g)"/><text x="50%" y="55%" font-size="16" text-anchor="middle" fill="%23ffffff" font-family="Arial, sans-serif">&#9733;</text></svg>';

const CLASS_ICON_OVERRIDES: Partial<Record<BisClassSlug, string>> = {
  monk: 'Monk.webp',
};
