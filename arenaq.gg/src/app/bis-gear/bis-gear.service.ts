import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export type PopularGearEntry = {
  item: string;
  slot: string;
  count: number;
};

export type GearFilters = {
  seasonId?: number;
  region?: Region;
  maxPages?: number;
  concurrency?: number;
  classSlug?: string;
  slot?: string;
  specSlug?: string;
};

type EquippedItem = {
  itemName: string;
  slotType: string;
  slotLabel: string;
  classSlug: string;
  specSlug: string;
};

const DEFAULT_MAX_PAGES = 10;
const DEFAULT_CONCURRENCY = 5;

@Injectable({ providedIn: 'root' })
export class BisGearService {
  constructor(private wow: WowApiService) {}

  getMostPopularGear(filters: GearFilters = {}): Observable<PopularGearEntry[]> {
    const {
      seasonId,
      region = 'eu',
      maxPages = DEFAULT_MAX_PAGES,
      concurrency = DEFAULT_CONCURRENCY,
      classSlug,
      slot,
      specSlug,
    } = filters;

    const normalizedClass = classSlug?.toLowerCase() ?? null;
    const normalizedSlot = slot?.toLowerCase() ?? null;
    const normalizedSpec = specSlug?.toLowerCase() ?? null;

    return this.wow.resolveClassicSeasonId(seasonId, region).pipe(
      switchMap(resolvedSeason =>
        this.wow.getFull3v3LadderAuto(resolvedSeason, region, maxPages).pipe(
          switchMap(players =>
            from(players).pipe(
              mergeMap(player => {
                const realm = player?.character?.realm?.slug ?? player?.realm?.slug;
                const name = player?.character?.name ?? player?.name;
                if (!realm || !name) {
                  return of<EquippedItem[]>([]);
                }

                const playerClassName = String(player?.character?.playable_class?.name ?? '').trim();
                const playerSpecName = String(player?.character?.spec?.name ?? '').trim();
                const classSlugValue = playerClassName.toLowerCase();
                const specSlugValue = playerSpecName.toLowerCase();

                return this.wow.getCharacterEquipment(realm, name, region).pipe(
                  map(response =>
                    (response?.equipped_items ?? []).map((equipped: any) => {
                      const rawSlotType = String(equipped?.slot?.type ?? '').toLowerCase();
                      const slotLabel =
                        equipped?.slot?.name?.display_string ??
                        equipped?.slot?.name ??
                        equipped?.slot?.type ??
                        '';
                      const itemName =
                        equipped?.name?.display_string ??
                        equipped?.item?.name ??
                        '';
                      return {
                        itemName,
                        slotType: rawSlotType,
                        slotLabel: slotLabel || rawSlotType || 'Unknown',
                        classSlug: classSlugValue,
                        specSlug: specSlugValue,
                      } as EquippedItem;
                    })
                  ),
                  catchError(() => of<EquippedItem[]>([]))
                );
              }, Math.max(1, concurrency)),
              toArray(),
              map(allEquipmentArrays => {
                const counts = new Map<string, PopularGearEntry>();

                allEquipmentArrays.flat().forEach(item => {
                  if (!item.itemName) {
                    return;
                  }

                  if (normalizedClass && item.classSlug !== normalizedClass) {
                    return;
                  }

                  if (normalizedSpec && item.specSlug !== normalizedSpec) {
                    return;
                  }

                  const slotMatches =
                    !normalizedSlot ||
                    item.slotType === normalizedSlot ||
                    item.slotLabel.toLowerCase() === normalizedSlot;

                  if (!slotMatches) {
                    return;
                  }

                  const key = `${item.itemName}::${item.slotLabel}`;
                  const existing = counts.get(key);
                  if (existing) {
                    existing.count += 1;
                  } else {
                    counts.set(key, {
                      item: item.itemName,
                      slot: item.slotLabel,
                      count: 1,
                    });
                  }
                });

                return Array.from(counts.values()).sort((a, b) => b.count - a.count);
              })
            )
          )
        )
      )
    );
  }
}
