import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, switchMap, toArray } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export type GearItemStat = {
  item: string;
  slot: string;
  count: number;
  percent: number;
};

export type ClassGearSummary = {
  classSlug: string;
  className: string;
  totalSamples: number;
  items: GearItemStat[];
};

export type GearSnapshot = {
  generatedAt: string;
  region: Region;
  classes: ClassGearSummary[];
};

export type GearFilters = {
  seasonId?: number;
  region?: Region;
  maxPages?: number;
  concurrency?: number;
};

type EquippedItem = {
  itemName: string;
  slotLabel: string;
};

type PlayerGearSample = {
  classSlug: string;
  className: string;
  items: EquippedItem[];
};

const DEFAULT_MAX_PAGES = 10;
const DEFAULT_CONCURRENCY = 5;

@Injectable({ providedIn: 'root' })
export class BisGearService {
  private snapshotCache = new Map<string, Observable<GearSnapshot>>();

  constructor(private wow: WowApiService) {}

  getGearSnapshot(filters: GearFilters = {}): Observable<GearSnapshot> {
    const region = filters.region ?? 'eu';
    const maxPages = filters.maxPages ?? DEFAULT_MAX_PAGES;
    const concurrency = filters.concurrency ?? DEFAULT_CONCURRENCY;
    const cacheKey = JSON.stringify({
      seasonId: filters.seasonId ?? null,
      region,
      maxPages,
      concurrency,
    });

    const existing = this.snapshotCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const snapshot$ = this.buildSnapshot({
      seasonId: filters.seasonId,
      region,
      maxPages,
      concurrency,
    }).pipe(shareReplay(1));

    this.snapshotCache.set(cacheKey, snapshot$);
    return snapshot$;
  }

  private buildSnapshot(options: RequiredGearFilters): Observable<GearSnapshot> {
    const { seasonId, region, maxPages, concurrency } = options;
    return this.wow.resolveClassicSeasonId(seasonId, region).pipe(
      switchMap(resolvedSeason =>
        this.wow.getFull3v3LadderAuto(resolvedSeason, region, maxPages).pipe(
          switchMap(players =>
            from(players).pipe(
              mergeMap(player => this.fetchPlayerGearSample(player, region), Math.max(1, concurrency)),
              toArray(),
              map(samples => this.buildClassSummaries(samples.filter(isNonNull))),
              map(classes => ({
                generatedAt: new Date().toISOString(),
                region,
                classes,
              }))
            )
          )
        )
      )
    );
  }

  private fetchPlayerGearSample(player: any, region: Region): Observable<PlayerGearSample | null> {
    const realm = player?.character?.realm?.slug ?? player?.realm?.slug;
    const name = player?.character?.name ?? player?.name;
    const className = String(player?.character?.playable_class?.name ?? '').trim();
    const classSlug = slugify(className);

    if (!realm || !name || !classSlug) {
      return of(null);
    }

    return this.wow.getCharacterEquipment(realm, name, region).pipe(
      map(response => ({
        classSlug,
        className: className || toTitleCase(classSlug),
        items: this.mapEquippedItems(response?.equipped_items ?? []),
      })),
      catchError(() =>
        of({
          classSlug,
          className: className || toTitleCase(classSlug),
          items: [] as EquippedItem[],
        })
      )
    );
  }

  private mapEquippedItems(rawItems: any[]): EquippedItem[] {
    return rawItems.map(item => {
      const slotLabel =
        item?.slot?.name?.display_string ??
        item?.slot?.name ??
        item?.slot?.type ??
        '';
      const itemName = item?.name?.display_string ?? item?.item?.name ?? '';
      return {
        itemName,
        slotLabel: slotLabel || 'Unknown',
      };
    });
  }

  private buildClassSummaries(samples: PlayerGearSample[]): ClassGearSummary[] {
    const stats = new Map<string, ClassAccumulator>();

    for (const sample of samples) {
      const { classSlug, className, items } = sample;
      let accumulator = stats.get(classSlug);
      if (!accumulator) {
        accumulator = {
          classSlug,
          className,
          totalSamples: 0,
          counts: new Map<string, GearCount>(),
        };
        stats.set(classSlug, accumulator);
      }
      accumulator.totalSamples += 1;

      for (const item of items) {
        if (!item.itemName) {
          continue;
        }
        const key = `${item.slotLabel}::${item.itemName}`;
        const existing = accumulator.counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          accumulator.counts.set(key, {
            item: item.itemName,
            slot: item.slotLabel,
            count: 1,
          });
        }
      }
    }

    return Array.from(stats.values()).map(accumulator => {
      const items = Array.from(accumulator.counts.values())
        .map(entry => ({
          ...entry,
          percent: accumulator.totalSamples
            ? parseFloat(((entry.count / accumulator.totalSamples) * 100).toFixed(1))
            : 0,
        }))
        .sort((a, b) => b.percent - a.percent || b.count - a.count)
        .slice(0, 3);

      return {
        classSlug: accumulator.classSlug,
        className: accumulator.className,
        totalSamples: accumulator.totalSamples,
        items,
      };
    });
  }
}

type RequiredGearFilters = {
  seasonId?: number;
  region: Region;
  maxPages: number;
  concurrency: number;
};

type GearCount = {
  item: string;
  slot: string;
  count: number;
};

type ClassAccumulator = {
  classSlug: string;
  className: string;
  totalSamples: number;
  counts: Map<string, GearCount>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}
