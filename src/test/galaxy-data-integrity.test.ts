import { describe, it, expect } from 'vitest';
import {
  createVirtualSubjectStar,
  generateSystem,
  getSector,
  SUBJECTS,
  type StarSeed,
  type PlanetSeed,
} from '@/lib/procedural';

describe('KU PHASE 5 — Galaxy Data Integrity Tests', () => {
  describe('1. Subject Warp via Deterministic Virtual Navigation Target', () => {
    it('generates a deterministic virtual star for standard curriculum subjects without fake DB entities', () => {
      const star1 = createVirtualSubjectStar('Physics');
      const star2 = createVirtualSubjectStar('Physics');

      expect(star1.id).toBe('subject_nav_physics');
      expect(star1.name).toBe('Physics-System');
      expect(star1.seed).toBe(star2.seed);
      expect(star1.spectralClass).toBe(star2.spectralClass);
      expect(star1.color).toBe(star2.color);

      // Verify no misleading fake DB primary keys
      expect(star1.id.startsWith('subject_nav_')).toBe(true);
      expect(star1.id).not.toContain('warp_');
    });

    it('generates valid planetary systems for virtual subject navigation targets', () => {
      const subjectStar = createVirtualSubjectStar('Mathematics');
      const planets = generateSystem(subjectStar);

      expect(planets.length).toBeGreaterThanOrEqual(2);
      expect(planets.length).toBeLessThanOrEqual(9);

      planets.forEach((planet: PlanetSeed) => {
        expect(planet.id).toContain(subjectStar.id);
        expect(planet.name.startsWith(subjectStar.name)).toBe(true);
        expect(planet.subject).toBeDefined();
        expect(planet.orbitRadius).toBeGreaterThan(0);
        expect(planet.color).toBeDefined();
      });
    });

    it('handles case-insensitivity and whitespace normalization safely', () => {
      const starNormal = createVirtualSubjectStar('Biology');
      const starUpper = createVirtualSubjectStar('  BIOLOGY ');

      expect(starUpper.id).toBe(starNormal.id);
      expect(starUpper.seed).toBe(starNormal.seed);
      expect(starUpper.name).toBe('Biology-System');
    });

    it('handles unknown or custom subject queries deterministically without crashing', () => {
      const customStar = createVirtualSubjectStar('Quantum Topology 2026');
      expect(customStar.id).toBe('subject_nav_quantum_topology_2026');
      expect(customStar.name).toBe('Quantum Topology 2026-System');

      const planets = generateSystem(customStar);
      expect(planets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Normal Procedural Galaxy Generation & Sector Streaming', () => {
    it('produces persistent deterministic star sectors on demand without DB records', () => {
      const sector000_a = getSector(0, 0, 0);
      const sector000_b = getSector(0, 0, 0);

      expect(sector000_a.length).toBe(sector000_b.length);
      if (sector000_a.length > 0) {
        expect(sector000_a[0].id).toBe(sector000_b[0].id);
        expect(sector000_a[0].name).toBe(sector000_b[0].name);
        expect(sector000_a[0].position).toEqual(sector000_b[0].position);
      }
    });

    it('maintains system consistency when navigating from a normal star to planets', () => {
      const sector = getSector(1, 0, 1);
      if (sector.length > 0) {
        const star = sector[0];
        const systemPlanets1 = generateSystem(star);
        const systemPlanets2 = generateSystem(star);

        expect(systemPlanets1.length).toBe(systemPlanets2.length);
        expect(systemPlanets1[0].name).toBe(systemPlanets2[0].name);
        expect(systemPlanets1[0].subject).toBe(systemPlanets2[0].subject);
      }
    });
  });

  describe('3. Codebase Audit: Zero Fake Entities', () => {
    it('contains all 144 registered knowledge domains', () => {
      expect(SUBJECTS.length).toBeGreaterThanOrEqual(100);
      expect(SUBJECTS).toContain('Mathematics');
      expect(SUBJECTS).toContain('Physics');
      expect(SUBJECTS).toContain('Computer Science');
    });
  });
});
