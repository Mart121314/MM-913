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
  region: Region = 'eu';
  realmSlug?: string | null;
  characterName?: string | null;

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
        this.region = params.region;
        this.realmSlug = params.realm;
        this.characterName = params.name;
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

  avatarUrl(profile: PlayerProfile | null): string | null {
    return resolveAvatarAsset(profile);
  }

  raceIcon(profile: PlayerProfile | null): string | null {
    return resolveRaceIcon(profile, this.routeExtras, this.region);
  }

  raceName(profile: PlayerProfile | null): string | null {
    return (
      profile?.summary?.race?.name?.en_GB ??
      profile?.summary?.race?.name ??
      this.routeExtras?.race ??
      null
    );
  }

  trackTalent = (_: number, item: TalentOption) => item.name;

  trackEquipmentItem(item: any): string | number {
    return (
      item?.item?.id ??
      item?.name?.display_string ??
      item?.item?.name ??
      item?.slot?.type ??
      item?.slot?.name ??
      ''
    );
  }

  equipmentName(item: any): string {
    return (
      item?.name?.display_string ??
      item?.name ??
      item?.item?.name ??
      item?.item?.key?.name ??
      'Unknown item'
    );
  }

  equipmentSlot(item: any): string {
    return (
      item?.slot?.name?.display_string ??
      item?.slot?.name ??
      item?.slot?.type ??
      'Unknown'
    );
  }

  equipmentItemLevel(item: any): string {
    const numeric =
      item?.level?.value ??
      item?.ilevel ??
      item?.item_level ??
      item?.item?.level?.value ??
      parseLevelFromDisplay(
        item?.level?.display_string ??
          item?.item?.level?.display_string ??
          (typeof item?.level === 'string' ? item.level : undefined) ??
          (typeof item?.item?.level === 'string' ? item.item.level : undefined)
      );
    return Number.isFinite(numeric) ? String(numeric) : '-';
  }

  wowheadItemHref(item: any): string | null {
    const id = this.equipmentItemId(item);
    return id ? `https://www.wowhead.com/mop-classic/item=${id}` : null;
  }

  wowheadDataAttr(item: any): string | null {
    const id = this.equipmentItemId(item);
    return id ? `item=${id}&domain=mop-classic` : null;
  }

  private equipmentItemId(item: any): number | null {
    const id =
      item?.item?.id ??
      item?.item?.key?.id ??
      item?.transmog?.item?.id ??
      item?.appearance?.item?.id ??
      null;
    return typeof id === 'number' ? id : null;
  }

  equipmentIcon(item: any): string | null {
    return (
      item?.__icon ??
      item?.icon ??
      item?.transmog?.icon ??
      null
    );
  }

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
      media: null,
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

function parseLevelFromDisplay(displayValue: string | undefined): number | null {
  if (!displayValue) {
    return null;
  }
  const match = displayValue.match(/(\d+)/);
  return match ? Number(match[1]) : null;
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

function resolveAvatarAsset(profile: PlayerProfile | null): string | null {
  const media = profile?.media;
  if (!media) {
    return null;
  }

  const assets = [
    ...(Array.isArray(media.character_assets) ? media.character_assets : []),
    ...(Array.isArray(media.assets) ? media.assets : []),
  ];

  const avatar =
    assets.find((asset: any) => (asset?.key ?? asset?.type) === 'avatar') ??
    assets.find((asset: any) => (asset?.key ?? asset?.type) === 'main') ??
    assets.find((asset: any) => (asset?.key ?? asset?.type) === 'inset');

  if (avatar?.value || avatar?.url || avatar?.href) {
    return avatar.value ?? avatar.url ?? avatar.href ?? null;
  }

  if (typeof media?.render_url === 'string') {
    return media.render_url;
  }
  if (typeof media?.avatar_url === 'string') {
    return media.avatar_url;
  }

  return null;
}

function resolveRaceIcon(
  profile: PlayerProfile | null,
  extras: PlayerRouteExtras | undefined,
  region: Region
): string | null {
  const raceId =
    profile?.summary?.race?.id ??
    raceNameToId(
      profile?.summary?.race?.name?.en_GB ??
        profile?.summary?.race?.name ??
        extras?.race ??
        null
    );
  if (!raceId) {
    return null;
  }
  return buildRaceIconUrl(raceId, region);
}

function buildRaceIconUrl(raceId: number, region: Region | string | undefined): string | null {
  if (!Number.isFinite(raceId)) {
    return null;
  }
  const shard = String(region ?? 'eu').toLowerCase().startsWith('us') ? 'us' : 'eu';
  return `https://render.worldofwarcraft.com/classic-${shard}/race/${raceId}-0.jpg`;
}

function raceNameToId(raceName: string | null | undefined): number | null {
  if (!raceName) {
    return null;
  }
  const slug = raceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return RACE_NAME_TO_ID[slug] ?? null;
}

const RACE_NAME_TO_ID: Record<string, number> = {
  human: 1,
  orc: 2,
  dwarf: 3,
  'night-elf': 4,
  nightelf: 4,
  undead: 5,
  forsaken: 5,
  tauren: 6,
  gnome: 7,
  troll: 8,
  goblin: 9,
  'blood-elf': 10,
  bloodelf: 10,
  draenei: 11,
  'worgen': 22,
  pandaren: 24,
  'pandaren-alliance': 25,
  'pandaren-horde': 26,
  'nightborne': 27,
  'highmountain-tauren': 28,
  'void-elf': 29,
  'lightforged-draenei': 30,
  'zandalari-troll': 31,
  'kul-tiran': 32,
  'dark-iron-dwarf': 34,
  'vulpera': 35,
  'maghar-orc': 36,
  mechagnome: 37,
  dracthyr: 70,
};
