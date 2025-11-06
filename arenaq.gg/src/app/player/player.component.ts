import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { PlayerApiService, PlayerProfile } from './playerapi.service';
import { PvpBracket, Region } from '../wow-api.service';
import { LeaderboardApiService, LeaderboardCutoffs } from '../leaderboard/leaderboardapi.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, AsyncPipe, DatePipe],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  profile$!: Observable<PlayerProfile | null>;
  talents$!: Observable<TalentGroup[]>;
  cutoffs$!: Observable<LeaderboardCutoffs | null>;
  error?: string;
  routeExtras?: PlayerRouteExtras;

  constructor(
    private route: ActivatedRoute,
    private playerApi: PlayerApiService,
    private leaderboardApi: LeaderboardApiService
  ) {}

  ngOnInit(): void {
    const params$ = this.route.paramMap.pipe(
      map(params => {
        const region = (params.get('region') as Region | null) ?? 'eu';
        const realm = params.get('realm');
        const name = params.get('name');
        return { region, realm, name };
      })
    );

    const query$ = this.route.queryParamMap.pipe(
      map(params => ({
        rating: toNumber(params.get('rating')),
        wins: toNumber(params.get('wins')),
        losses: toNumber(params.get('losses')),
        className: normalize(params.get('class')),
        race: normalize(params.get('race')),
        spec: normalize(params.get('spec')),
        bracket: normalizeBracket(params.get('bracket')),
        realmName: params.get('realmName'),
        hidden: parseBoolean(params.get('hidden')),
      }))
    );

    const context$ = combineLatest([params$, query$]).pipe(shareReplay(1));

    this.profile$ = context$.pipe(
      switchMap(([params, extras]) => {
        if (!params.realm || !params.name) {
          this.error = 'Missing player route parameters.';
          return of(null);
        }

        this.routeExtras = extras;
        this.error = undefined;

        if (extras.hidden) {
          return of(this.buildFallbackProfile(params.realm, params.name, extras));
        }

        return this.playerApi.getProfile(params.region, params.realm, params.name).pipe(
          catchError(() => {
            if (hasContext(extras)) {
              this.error = undefined;
              return of(this.buildFallbackProfile(params.realm!, params.name!, extras));
            }
            this.error = 'Failed to load player profile.';
            return of(null);
          })
        );
      })
    ).pipe(shareReplay(1));

    this.talents$ = this.profile$.pipe(
      map(profile => extractTalentGroups(profile))
    );

    this.cutoffs$ = context$.pipe(
      switchMap(([params, extras]) => {
        const bracket = extras.bracket ?? '3v3';
        return this.leaderboardApi.getCutoffs(params.region, bracket).pipe(
          catchError(() => of(null))
        );
      })
    );
  }

  classColor(profile: PlayerProfile | null): string {
    const className =
      profile?.summary?.character_class?.name?.en_GB ??
      profile?.summary?.character_class?.name ??
      this.routeExtras?.className ??
      null;
    return classColorForName(className);
  }

  ratingClass(cutoffs: LeaderboardCutoffs | null, rating: number | null): string {
    if (!rating || !cutoffs) {
      return 'rating-badge';
    }
    if (cutoffs.rank1 && rating >= cutoffs.rank1) {
      return 'rating-badge rating-badge--rank1';
    }
    if (cutoffs.gladiator && rating >= cutoffs.gladiator) {
      return 'rating-badge rating-badge--gladiator';
    }
    return 'rating-badge';
  }

  hasRecord(): boolean {
    return (
      (this.routeExtras?.wins ?? null) != null ||
      (this.routeExtras?.losses ?? null) != null
    );
  }

  trackTalent = (_: number, item: TalentOption) => item.name;

  private buildFallbackProfile(
    realm: string,
    name: string,
    extras: PlayerRouteExtras
  ): PlayerProfile {
    const displayRealm =
      extras.realmName ??
      realm.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

    return {
      summary: {
        name,
        realm: {
          slug: realm,
          name: { en_GB: displayRealm, en_US: displayRealm },
        },
        character_class: extras.className
          ? { name: { en_GB: extras.className, en_US: extras.className } }
          : null,
        active_spec: extras.spec
          ? { name: extras.spec }
          : null,
        race: extras.race
          ? { name: { en_GB: extras.race, en_US: extras.race } }
          : null,
      },
      equipment: null,
      specializations: null,
    };
  }
}

type PlayerRouteExtras = {
  rating: number | null;
  wins: number | null;
  losses: number | null;
  className: string | null;
  race: string | null;
  spec: string | null;
  bracket: PvpBracket | null;
  realmName: string | null;
  hidden: boolean;
};

function toNumber(value: string | null): number | null {
  if (value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.trim();
}

function normalizeBracket(value: string | null): PvpBracket | null {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  if (normalized === '2v2' || normalized === '3v3' || normalized === '5v5') {
    return normalized;
  }
  return null;
}

function parseBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }
  return value === '1' || value.toLowerCase() === 'true';
}

function hasContext(extras: PlayerRouteExtras): boolean {
  return (
    extras.rating != null ||
    extras.wins != null ||
    extras.losses != null ||
    !!extras.className ||
    !!extras.spec ||
    !!extras.race
  );
}

type TalentGroup = {
  name: string;
  isActive: boolean;
  talents: TalentOption[];
  glyphs: string[];
};

type TalentOption = {
  name: string;
  description?: string | null;
};

function extractTalentGroups(profile: PlayerProfile | null): TalentGroup[] {
  const groups: TalentGroup[] = [];
  const data = profile?.specializations;
  const specs = Array.isArray(data?.specializations) ? data.specializations : [];
  const specGroups = Array.isArray(data?.specialization_groups) ? data.specialization_groups : [];
  const activeId = data?.active_specialization?.id ?? null;

  specs.forEach((spec: any, index: number) => {
    const talents = Array.isArray(spec?.talents)
      ? spec.talents.map((item: any) => ({
          name: item?.talent?.name ?? 'Unknown Talent',
          description: item?.spell_tooltip?.description ?? null,
        }))
      : [];

    const glyphs = Array.isArray(specGroups[index]?.glyphs)
      ? specGroups[index].glyphs.map((glyph: any) => glyph?.name).filter(Boolean)
      : [];

    const specId = spec?.specialization?.id ?? null;
    const isActive =
      specGroups[index]?.is_active ??
      (activeId != null && specId != null && activeId === specId);

    groups.push({
      name:
        spec?.specialization_name ??
        spec?.specialization?.name ??
        `Specialization ${index + 1}`,
      isActive,
      talents,
      glyphs: glyphs as string[],
    });
  });

  return groups;
}

const CLASS_COLORS: Record<string, string> = {
  'death-knight': '#C41E3A',
  druid: '#FF7C0A',
  hunter: '#AAD372',
  mage: '#3FC7EB',
  monk: '#00FF96',
  paladin: '#F48CBA',
  priest: '#FFFFFF',
  rogue: '#FFF468',
  shaman: '#0070DD',
  warlock: '#8788EE',
  warrior: '#C69B6D',
};

function classColorForName(className: string | null | undefined): string {
  if (!className) {
    return '#f5f5f5';
  }
  const slug = className.toLowerCase().replace(/[^a-z]/g, '-');
  return CLASS_COLORS[slug] ?? '#f5f5f5';
}
