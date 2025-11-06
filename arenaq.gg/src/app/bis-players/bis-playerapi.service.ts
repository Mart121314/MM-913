import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Region } from '../wow-api.service';

export type BisBracket = '2v2' | '3v3' | '5v5' | 'rbg';

export const BIS_CLASS_META = [
  { id: 6, name: 'Death Knight', slug: 'death-knight' },
  { id: 11, name: 'Druid', slug: 'druid' },
  { id: 3, name: 'Hunter', slug: 'hunter' },
  { id: 8, name: 'Mage', slug: 'mage' },
  { id: 10, name: 'Monk', slug: 'monk' },
  { id: 2, name: 'Paladin', slug: 'paladin' },
  { id: 5, name: 'Priest', slug: 'priest' },
  { id: 4, name: 'Rogue', slug: 'rogue' },
  { id: 7, name: 'Shaman', slug: 'shaman' },
  { id: 9, name: 'Warlock', slug: 'warlock' },
  { id: 1, name: 'Warrior', slug: 'warrior' },
] as const;

export type BisClassSlug = (typeof BIS_CLASS_META)[number]['slug'];

export interface BisTopSnapshot {
  generatedAt: string;
  regions: Record<string, BisRegionSnapshot | undefined>;
}

export interface BisRegionSnapshot {
  seasonId: number;
  generatedAt: string;
  classes: Record<string, BisTopEntry[] | undefined>;
}

export interface BisTopEntry {
  id: number;
  rank: number;
  region: string;
  classId: number;
  className: string;
  classSlug: BisClassSlug;
  spec: string;
  race: string;
  faction: string;
  detailsKey: string;
  name: string;
  routeName: string;
  realm: string;
  realmSlug: string;
  ratings: Record<BisBracket, number | null>;
  ranks: Record<BisBracket, number | null>;
}

export interface GetClassOptions {
  classSlug: BisClassSlug;
  region?: Region;
}

@Injectable({ providedIn: 'root' })
export class BisPlayerApiService {
  private snapshot$?: Observable<BisTopSnapshot>;

  constructor(private http: HttpClient) {}

  private loadSnapshot(): Observable<BisTopSnapshot> {
    if (!this.snapshot$) {
      this.snapshot$ = this.http
        .get<BisTopSnapshot>('/api/bis-top')
        .pipe(
          catchError(() =>
            of({
              generatedAt: '',
              regions: {},
            } satisfies BisTopSnapshot)
          ),
          shareReplay(1)
        );
    }
    return this.snapshot$;
  }

  getSnapshot(): Observable<BisTopSnapshot> {
    return this.loadSnapshot();
  }

  getClassMeta(): typeof BIS_CLASS_META {
    return BIS_CLASS_META;
  }

  getDefaultClass(): BisClassSlug {
    return BIS_CLASS_META[0]?.slug ?? 'death-knight';
  }

  getTopPlayersByClass(options: GetClassOptions): Observable<BisTopEntry[]> {
    const region = options.region ?? 'eu';
    const classSlug = options.classSlug;
    return this.loadSnapshot().pipe(
      map(snapshot => snapshot.regions[region]?.classes[classSlug] ?? []),
    );
  }
}
