import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap, shareReplay } from 'rxjs/operators';
import { WowApiService, Region } from '../wow-api.service';

export interface PlayerProfile {
  summary: any | null;
  equipment: any | null;
  specializations: any | null;
  media: any | null;
}

@Injectable({ providedIn: 'root' })
export class PlayerApiService {
  private readonly itemMediaCache = new Map<string, Observable<any>>();

  constructor(private wow: WowApiService) {}

  getProfile(region: Region, realm: string, name: string): Observable<PlayerProfile> {
    const normalizedName = name.toLowerCase();
    return this.wow
      .getCharacterProfileBundle(realm, normalizedName, region)
      .pipe(
        switchMap(profile => this.enrichEquipmentMedia(profile, region)),
        map(profile => ({
          summary: profile?.summary ?? null,
          equipment: profile?.equipment ?? null,
          specializations: profile?.specializations ?? null,
          media: profile?.media ?? null,
        })),
        catchError(() =>
          of({
            summary: null,
            equipment: null,
            specializations: null,
            media: null,
          })
        )
      );
  }

  private enrichEquipmentMedia(profile: any, region: Region): Observable<any> {
    const equippedItems = profile?.equipment?.equipped_items;
    if (!Array.isArray(equippedItems) || !equippedItems.length) {
      return of(profile);
    }

    const requests = equippedItems.map((item: any, index: number) => {
      return this.getItemMediaCached(item, region).pipe(
        map(media => ({
          index,
          icon: extractIcon(media),
        })),
        catchError(() => of({ index, icon: null }))
      );
    });

    return forkJoin(requests).pipe(
      map(results => {
        results.forEach(({ index, icon }) => {
          if (icon) {
            equippedItems[index].__icon = icon;
          }
        });
        return profile;
      })
    );
  }

  private getItemMediaCached(item: any, _region: Region): Observable<any> {
    const href = resolveMediaHref(item);
    if (!href) {
      return of(null);
    }

    const cacheKey = href;
    const cached = this.itemMediaCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.wow.getItemMediaByHref(href).pipe(shareReplay(1));
    this.itemMediaCache.set(cacheKey, request$);
    return request$;
  }
}

function extractIcon(media: any): string | null {
  const assets = Array.isArray(media?.assets) ? media.assets : [];
  const iconAsset = assets.find((asset: any) => asset?.key === 'icon');
  return typeof iconAsset?.value === 'string' ? iconAsset.value : null;
}

function resolveMediaHref(item: any): string | null {
  const direct = item?.media?.key?.href;
  if (typeof direct === 'string' && direct.length) {
    return appendLocale(direct);
  }

  const fallbackCandidates = [
    item?.item?.key?.href,
    item?.transmog?.item?.key?.href,
  ];

  for (const candidate of fallbackCandidates) {
    if (typeof candidate === 'string' && candidate.includes('/data/wow/item/')) {
      const replaced = candidate.replace('/data/wow/item/', '/data/wow/media/item/');
      return appendLocale(replaced);
    }
  }

  return null;
}

function appendLocale(href: string): string {
  if (!href) {
    return href;
  }
  if (href.includes('locale=')) {
    return href;
  }
  return `${href}${href.includes('?') ? '&' : '?'}locale=en_GB`;
}
