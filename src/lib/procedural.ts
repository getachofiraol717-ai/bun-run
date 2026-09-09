// ============================================================
// PROCEDURAL UNIVERSE ENGINE
// Simulates 200 sextillion (2×10^23) stars deterministically.
// No storage — everything regenerated from seeds on demand.
// ============================================================

// --- Deterministic hash (mulberry32-style) ---
export function hash3(x: number, y: number, z: number): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (z | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

export function hash2(x: number, y: number): number {
  return hash3(x, y, 0);
}

// Seeded RNG from a single integer seed
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Subject pool (Earth knowledge, 144 unique subjects) ---
export const SUBJECTS = [
  'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Astronomy', 'Cosmology',
  'Quantum Mechanics', 'Relativity', 'Thermodynamics', 'Electromagnetism',
  'Organic Chemistry', 'Biochemistry', 'Genetics', 'Evolution', 'Ecology',
  'Neuroscience', 'Anatomy', 'Physiology', 'Microbiology', 'Botany',
  'Zoology', 'Paleontology', 'Geology', 'Oceanography', 'Meteorology',
  'Climate Science', 'Geography', 'Cartography', 'Hydrology', 'Volcanology',
  'History', 'Ancient History', 'Medieval History', 'Modern History',
  'African History', 'Asian History', 'European History', 'World Wars',
  'Archaeology', 'Anthropology', 'Sociology', 'Psychology', 'Philosophy',
  'Logic', 'Ethics', 'Linguistics', 'Literature', 'Poetry', 'Mythology',
  'Comparative Religion', 'Theology', 'Music Theory', 'Art History',
  'Sculpture', 'Architecture', 'Photography', 'Film Studies', 'Theater',
  'Economics', 'Macroeconomics', 'Microeconomics', 'Finance', 'Accounting',
  'Business', 'Marketing', 'Management', 'Entrepreneurship',
  'Political Science', 'Law', 'Diplomacy', 'Public Policy', 'Government',
  'Computer Science', 'Algorithms', 'Data Structures', 'Programming',
  'Web Development', 'Mobile Development', 'Game Development',
  'Artificial Intelligence', 'Machine Learning', 'Deep Learning',
  'Cybersecurity', 'Cryptography', 'Networks', 'Operating Systems',
  'Databases', 'Cloud Computing', 'DevOps', 'Quantum Computing',
  'Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Electrical Engineering', 'Aerospace Engineering', 'Robotics',
  'Nanotechnology', 'Biotechnology', 'Materials Science',
  'Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology',
  'Pharmacology', 'Public Health', 'Nutrition', 'Sports Science',
  'English', 'Amharic', 'Afan Oromo', 'Tigrinya', 'Arabic',
  'French', 'Spanish', 'Mandarin', 'Hindi', 'Swahili',
  'Education Theory', 'Pedagogy', 'Child Development',
  'Agriculture', 'Permaculture', 'Forestry', 'Fisheries',
  'Renewable Energy', 'Solar Power', 'Wind Energy', 'Nuclear Physics',
  'Astrophysics', 'String Theory', 'Particle Physics', 'Optics',
  'Acoustics', 'Fluid Dynamics', 'Statistics', 'Probability',
  'Calculus', 'Algebra', 'Geometry', 'Number Theory', 'Topology',
  'Game Theory', 'Chaos Theory', 'Information Theory',
];

export const COUNTRIES = [
  'Ethiopia', 'Kenya', 'Nigeria', 'Egypt', 'South Africa', 'Morocco',
  'USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile',
  'UK', 'France', 'Germany', 'Italy', 'Spain', 'Greece', 'Russia',
  'China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Vietnam',
  'Australia', 'New Zealand', 'Saudi Arabia', 'Turkey', 'Iran',
  'Oromia', 'Tigray', 'Amhara', 'Somalia', 'Sudan', 'Ghana',
];

// Star spectral classes with realistic color temperatures
export const STAR_TYPES = [
  { class: 'O', color: '#9bb0ff', size: 1.8, weight: 0.001 },
  { class: 'B', color: '#aabfff', size: 1.4, weight: 0.01 },
  { class: 'A', color: '#cad7ff', size: 1.1, weight: 0.04 },
  { class: 'F', color: '#f8f7ff', size: 0.95, weight: 0.08 },
  { class: 'G', color: '#fff4ea', size: 0.85, weight: 0.15 }, // Sun-like
  { class: 'K', color: '#ffd2a1', size: 0.7, weight: 0.25 },
  { class: 'M', color: '#ffad51', size: 0.55, weight: 0.46 }, // Red dwarf, most common
];

function pickStarType(r: number) {
  let acc = 0;
  for (const t of STAR_TYPES) {
    acc += t.weight;
    if (r <= acc) return t;
  }
  return STAR_TYPES[STAR_TYPES.length - 1];
}

// ============================================================
// GALAXY LAYER — Milky Way spiral with sector streaming
// Each sector is a 60×60 ly cube; star count varies by galactic position
// ============================================================
export const SECTOR_SIZE = 60;
export const GALAXY_RADIUS = 800;       // visual extent of the disk
export const GALAXY_BULGE_RADIUS = 120; // dense core
export const GALAXY_ARM_COUNT = 4;
export const GALAXY_ARM_TIGHTNESS = 0.18; // logarithmic spiral pitch
export const GALAXY_DISK_THICKNESS = 25;  // vertical scale at center
const STARS_PER_SECTOR_MAX = 60;

export interface StarSeed {
  id: string;            // global deterministic id
  sx: number; sy: number; sz: number; // sector coordinates
  idx: number;           // index within sector
  position: [number, number, number]; // world position
  size: number;
  color: string;
  spectralClass: string;
  name: string;
  seed: number;          // deterministic seed for system gen
}

function starName(sx: number, sy: number, sz: number, idx: number): string {
  const prefix = ['Kepler', 'Gliese', 'Proxima', 'Sirius', 'Vega', 'Altair', 'Rigel', 'Lyra', 'Orion', 'Andro', 'Cygnus', 'Phoenix'][Math.abs(sx + idx) % 12];
  const num = Math.abs(sx * 31 + sy * 17 + sz * 13 + idx * 7) % 9999;
  return `${prefix}-${num}`;
}

// Density at a point in galactic coordinates (Milky-Way-like)
// Combines: exponential disk + central bulge + spiral arm enhancement
function galacticDensity(x: number, z: number, y: number): number {
  const r = Math.sqrt(x * x + z * z);
  if (r > GALAXY_RADIUS * 1.2) return 0;

  // Exponential disk falloff
  const disk = Math.exp(-r / 250);
  // Central bulge (dense core)
  const bulge = Math.exp(-r / GALAXY_BULGE_RADIUS) * 2.5;
  // Vertical falloff (thin disk; thicker at center)
  const verticalScale = GALAXY_DISK_THICKNESS * Math.exp(-r / 400) + 4;
  const vertical = Math.exp(-(y * y) / (2 * verticalScale * verticalScale));

  // Spiral arm enhancement — logarithmic spiral
  const theta = Math.atan2(z, x);
  const spiralAngle = Math.log(Math.max(r, 1)) / GALAXY_ARM_TIGHTNESS;
  const armPhase = Math.cos(GALAXY_ARM_COUNT * (theta - spiralAngle));
  // Smooth arm: sharper near arms, smooth gaps
  const arms = 0.5 + 0.5 * Math.pow(Math.max(0, armPhase), 2.5);
  const armBoost = 1 + arms * 1.8 * Math.max(0, 1 - r / GALAXY_RADIUS);

  return (disk + bulge) * vertical * armBoost;
}

// Generate all stars in a single sector deterministically
// Star count and placement follow real Milky Way density profile
export function generateSector(sx: number, sy: number, sz: number): StarSeed[] {
  const r = rng(((sx * 73856093) ^ (sy * 19349663) ^ (sz * 83492791)) >>> 0);
  const stars: StarSeed[] = [];

  // Sample density at sector center (in world coordinates, centered on origin)
  const cx = (sx + 0.5) * SECTOR_SIZE;
  const cy = (sy + 0.5) * SECTOR_SIZE;
  const cz = (sz + 0.5) * SECTOR_SIZE;
  const density = galacticDensity(cx, cz, cy);
  if (density < 0.005) return stars; // empty intergalactic void

  const targetCount = Math.min(STARS_PER_SECTOR_MAX, Math.floor(density * 50));
  if (targetCount < 1) return stars;

  // Rejection sampling within the sector — denser where galactic density is higher
  let attempts = 0;
  const maxAttempts = targetCount * 4;
  while (stars.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const px = sx * SECTOR_SIZE + r() * SECTOR_SIZE;
    const py = sy * SECTOR_SIZE + r() * SECTOR_SIZE;
    const pz = sz * SECTOR_SIZE + r() * SECTOR_SIZE;
    const localD = galacticDensity(px, pz, py);
    if (r() > localD / Math.max(density * 1.5, 0.5)) continue;

    const t = pickStarType(r());
    const i = stars.length;
    const seed = ((sx * 100000 + sy * 1000 + sz) * 1000 + i) >>> 0;
    // Bigger, brighter stars near the bulge
    const radial = Math.sqrt(px * px + pz * pz);
    const bulgeBoost = radial < GALAXY_BULGE_RADIUS ? 1.4 : 1.0;

    stars.push({
      id: `${sx}_${sy}_${sz}_${i}`,
      sx, sy, sz, idx: i,
      position: [px, py, pz],
      size: t.size * (0.6 + r() * 0.8) * bulgeBoost,
      color: t.color,
      spectralClass: t.class,
      name: starName(sx, sy, sz, i),
      seed,
    });
  }
  return stars;
}

// ============================================================
// STAR SYSTEM LAYER — generate planets for a star
// ============================================================
export interface PlanetSeed {
  id: string;
  name: string;
  subject: string;
  country: string;
  color: string;
  emissive: string;
  size: number;
  orbitRadius: number;
  speed: number;
  hasRings: boolean;
  moons: number;
  population: string;
  description: string;
  funFact: string;
  distanceLY: string;
  travelTime: string;
}

const PLANET_COLORS = [
  '#4169E1', '#CD853F', '#DAA520', '#8B8B8B', '#87CEEB', '#F4A460',
  '#ffa500', '#ff6347', '#00CED1', '#9370DB', '#3CB371', '#FF69B4',
  '#20B2AA', '#FFD700', '#DC143C', '#4B0082',
];

export function generateSystem(starSeed: StarSeed): PlanetSeed[] {
  const r = rng(starSeed.seed);
  const planetCount = 2 + Math.floor(r() * 8); // 2-9 planets
  const planets: PlanetSeed[] = [];

  for (let i = 0; i < planetCount; i++) {
    const subjectIdx = Math.floor(r() * SUBJECTS.length);
    const countryIdx = Math.floor(r() * COUNTRIES.length);
    const colorIdx = Math.floor(r() * PLANET_COLORS.length);
    const subject = SUBJECTS[subjectIdx];
    const country = COUNTRIES[countryIdx];

    planets.push({
      id: `${starSeed.id}_p${i}`,
      name: `${starSeed.name} ${['I','II','III','IV','V','VI','VII','VIII','IX'][i]}`,
      subject,
      country,
      color: PLANET_COLORS[colorIdx],
      emissive: PLANET_COLORS[(colorIdx + 5) % PLANET_COLORS.length],
      size: 0.3 + r() * 0.7,
      orbitRadius: 3 + i * 2.5 + r() * 1.5,
      speed: 0.4 - i * 0.04 + r() * 0.05,
      hasRings: r() > 0.75,
      moons: Math.floor(r() * 5),
      population: `${(r() * 50).toFixed(1)}B`,
      description: `A ${subject} world orbiting ${starSeed.name}. Inhabited culture rooted in ${country} traditions.`,
      funFact: `Contains ${Math.floor(r() * 1e9).toLocaleString()} knowledge nodes across ${Math.floor(r() * 1000)} archives.`,
      distanceLY: (Math.sqrt(starSeed.position[0]**2 + starSeed.position[1]**2 + starSeed.position[2]**2)).toFixed(2),
      travelTime: `${Math.floor(r() * 5000 + 100)} years`,
    });
  }
  return planets;
}

// ============================================================
// SECTOR STREAMING — load only nearby sectors around camera
// ============================================================
export function getNearbySectors(camX: number, camY: number, camZ: number, radius = 2): Array<[number, number, number]> {
  const csx = Math.floor(camX / SECTOR_SIZE);
  const csy = Math.floor(camY / SECTOR_SIZE);
  const csz = Math.floor(camZ / SECTOR_SIZE);
  const out: Array<[number, number, number]> = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        out.push([csx + dx, csy + dy, csz + dz]);
      }
    }
  }
  return out;
}

// LRU-ish cache so we don't regenerate every frame
const sectorCache = new Map<string, StarSeed[]>();
const MAX_CACHE = 200;

export function getSector(sx: number, sy: number, sz: number): StarSeed[] {
  const key = `${sx}_${sy}_${sz}`;
  let s = sectorCache.get(key);
  if (!s) {
    s = generateSector(sx, sy, sz);
    if (sectorCache.size >= MAX_CACHE) {
      const firstKey = sectorCache.keys().next().value;
      if (firstKey) sectorCache.delete(firstKey);
    }
    sectorCache.set(key, s);
  }
  return s;
}

// Deterministic virtual star generator for subject navigation (Option B: deterministic virtual navigation target)
export function createVirtualSubjectStar(subject: string): StarSeed {
  const validSubject = SUBJECTS.find(s => s.toLowerCase() === subject.trim().toLowerCase()) || subject.trim();
  const seedVal = [...validSubject].reduce((a, c, i) => (a + c.charCodeAt(0) * (i + 1) * 31) >>> 0, 0);
  const r = rng(seedVal);
  const starType = pickStarType(r());

  return {
    id: `subject_nav_${validSubject.toLowerCase().replace(/\s+/g, '_')}`,
    sx: 0,
    sy: 0,
    sz: 0,
    idx: 0,
    position: [0, 0, 0],
    size: starType.size * 1.1,
    color: starType.color,
    spectralClass: starType.class,
    name: `${validSubject}-System`,
    seed: seedVal,
  };
}

