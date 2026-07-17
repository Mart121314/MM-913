const axios = require('axios');
const { getAccessToken } = require('../tracker-snapshot');

const CHARACTER_RESOURCE_SUFFIX = {
  summary: '',
  equipment: '/equipment',
  specializations: '/specializations',
  media: '/character-media',
};

const RACE_NAME_TO_ID = {
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
  worgen: 22,
  pandaren: 24,
  'pandaren-alliance': 25,
  'pandaren-horde': 26,
  nightborne: 27,
  'highmountain-tauren': 28,
  'void-elf': 29,
  'lightforged-draenei': 30,
  'zandalari-troll': 31,
  'kul-tiran': 32,
  'dark-iron-dwarf': 34,
  vulpera: 35,
  'maghar-orc': 36,
  mechagnome: 37,
  dracthyr: 70,
};

const slugify = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const encodeSlug = value => encodeURIComponent(String(value ?? '').toLowerCase());

const buildRaceIconUrl = (raceId, region) => {
  if (!Number.isFinite(raceId)) {
    return null;
  }
  const shard = String(region ?? '')
    .toLowerCase()
    .startsWith('us')
    ? 'us'
    : 'eu';
  return `https://render.worldofwarcraft.com/classic-${shard}/race/${raceId}-0.jpg`;
};

const raceNameToId = raceName => {
  const slug = slugify(raceName);
  return RACE_NAME_TO_ID[slug] ?? null;
};

const decorateLeaderboardEntry = (entry, region) => {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }
  const normalizedRegion = String(entry.region ?? region ?? 'eu').toLowerCase();
  const raceId =
    typeof entry.raceId === 'number' && Number.isFinite(entry.raceId)
      ? entry.raceId
      : raceNameToId(entry.race);
  const raceSlug = entry.raceSlug ?? (entry.race ? slugify(entry.race) : null);
  const raceIcon = entry.raceIcon ?? (raceId ? buildRaceIconUrl(raceId, normalizedRegion) : null);

  return {
    ...entry,
    raceId: raceId ?? null,
    raceSlug,
    raceIcon,
    region: entry.region ?? normalizedRegion.toUpperCase(),
  };
};

const fetchCharacterResource = async (region, realm, name, resourceKey) => {
  const suffix = CHARACTER_RESOURCE_SUFFIX[resourceKey];
  if (suffix == null) {
    throw new Error(`Unsupported resource "${resourceKey}"`);
  }
  const tokenInfo = await getAccessToken();
  const headers = { Authorization: `Bearer ${tokenInfo.token}` };
  const namespace = `profile-classic-${region}`;
  const realmSlug = encodeSlug(realm);
  const characterSlug = encodeSlug(name);
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}${suffix}?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, { headers });
  return data;
};

const fetchCharacterProfileBundle = async (region, realm, name) => {
  const summary = await fetchCharacterResource(region, realm, name, 'summary');

  const [equipment, specializations, media] = await Promise.all([
    fetchCharacterResource(region, realm, name, 'equipment').catch(error => {
      console.warn('Equipment fetch failed', error?.response?.status || error?.message);
      return null;
    }),
    fetchCharacterResource(region, realm, name, 'specializations').catch(error => {
      console.warn('Specializations fetch failed', error?.response?.status || error?.message);
      return null;
    }),
    fetchCharacterResource(region, realm, name, 'media').catch(error => {
      console.warn('Media fetch failed', error?.response?.status || error?.message);
      return null;
    }),
  ]);

  return { summary, equipment, specializations, media };
};

module.exports = {
  CHARACTER_RESOURCE_SUFFIX,
  slugify,
  encodeSlug,
  buildRaceIconUrl,
  raceNameToId,
  decorateLeaderboardEntry,
  fetchCharacterResource,
  fetchCharacterProfileBundle,
};
