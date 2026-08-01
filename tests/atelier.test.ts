import { describe, it, expect } from 'vitest';
import {
  nextNumber, formatEdition, ClaimSchema, EDITION, describePiece,
  anglesFor, resolveAngle, assetName,
} from '../src/lib/atelier';

describe('nextNumber', () => {
  it('geeft 1 voor de eerste claim', () => {
    expect(nextNumber(0)).toBe(1);
  });
  it('telt netjes door', () => {
    expect(nextNumber(41)).toBe(42);
    expect(nextNumber(EDITION - 1)).toBe(EDITION); // 500e claim = nummer 500
  });
  it('rolt door naar een volgende oplage na het maximum', () => {
    expect(nextNumber(EDITION)).toBe(1);
    expect(nextNumber(EDITION + 41)).toBe(42);
  });
  it('is bestand tegen onzin-invoer', () => {
    expect(nextNumber(-5)).toBe(1);
    expect(nextNumber(NaN)).toBe(1);
    expect(nextNumber(3.9)).toBe(4);
  });
  it('respecteert een aangepaste oplage', () => {
    expect(nextNumber(10, 10)).toBe(1);
    expect(nextNumber(9, 10)).toBe(10);
  });
});

describe('formatEdition', () => {
  it('vult voor met nullen tot de breedte van de oplage', () => {
    expect(formatEdition(42, 500)).toBe('042 / 500');
    expect(formatEdition(7, 500)).toBe('007 / 500');
    expect(formatEdition(500, 500)).toBe('500 / 500');
  });
});

describe('ClaimSchema', () => {
  it('accepteert een geldig e-mailadres', () => {
    expect(ClaimSchema.parse({ email: 'sanne@example.nl' }).email).toBe('sanne@example.nl');
  });
  it('weigert een ongeldig e-mailadres', () => {
    expect(() => ClaimSchema.parse({ email: 'geen-email' })).toThrow();
  });
  it('weigert een kleur buiten de collectie', () => {
    expect(() => ClaimSchema.parse({ email: 'a@b.nl', colour: 'roze' })).toThrow();
  });
  it('kapt geen geldige optionele velden af', () => {
    const p = ClaimSchema.parse({ email: 'a@b.nl', name: 'Sanne', colour: 'navy' });
    expect(p.name).toBe('Sanne');
    expect(p.colour).toBe('navy');
  });
  it('accepteert een kledingstuk uit de set', () => {
    const p = ClaimSchema.parse({ email: 'a@b.nl', garment: 'cap' });
    expect(p.garment).toBe('cap');
  });
  it('weigert een kledingstuk buiten de set', () => {
    expect(() => ClaimSchema.parse({ email: 'a@b.nl', garment: 'schoen' })).toThrow();
  });
});

describe('describePiece', () => {
  it('geeft de hoodie zijn kleur mee', () => {
    expect(describePiece('hoodie', 'olijfgroen')).toBe('Hoodie · Olijfgroen');
    expect(describePiece('hoodie', 'navy')).toBe('Hoodie · Navy');
    expect(describePiece(undefined, undefined)).toBe('Hoodie · Olijfgroen');
  });
  it('beschrijft de cap als één klassieke uitvoering (geen kleur)', () => {
    expect(describePiece('cap', 'navy')).toBe('Cap · Grijs melange');
    expect(describePiece('cap')).toBe('Cap · Grijs melange');
  });
});

describe('anglesFor / resolveAngle', () => {
  it('geeft de hoodie voor- en achterkant, de cap ook een zijkant', () => {
    expect(anglesFor('hoodie')).toEqual(['front', 'back']);
    expect(anglesFor('cap')).toEqual(['front', 'side', 'back']);
  });
  it('valt bij een onbekend stuk terug op de hoodie', () => {
    expect(anglesFor('schoen')).toEqual(['front', 'back']);
    expect(anglesFor(undefined)).toEqual(['front', 'back']);
  });
  it('houdt een bestaande hoek vast', () => {
    expect(resolveAngle('hoodie', 'back')).toBe('back');
    expect(resolveAngle('cap', 'side')).toBe('side');
  });
  it('valt terug op de voorkant bij een hoek die dit stuk niet heeft', () => {
    // cap-zijkant → hoodie: de hoodie heeft geen zijaanzicht
    expect(resolveAngle('hoodie', 'side')).toBe('front');
    expect(resolveAngle('hoodie', undefined)).toBe('front');
    expect(resolveAngle('cap', 'onzin')).toBe('front');
  });
});

describe('assetName', () => {
  it('kiest het juiste hoodiebeeld per kleur en hoek', () => {
    expect(assetName('hoodie', 'olijfgroen', 'front')).toBe('hoodie-olijfgroen-v2');
    expect(assetName('hoodie', 'olijfgroen', 'back')).toBe('hoodie-olijfgroen-back-v2');
    expect(assetName('hoodie', 'navy', 'back')).toBe('hoodie-navy-back-v2');
  });
  it('kiest het juiste capbeeld per hoek, kleur telt niet mee', () => {
    expect(assetName('cap', 'navy', 'side')).toBe('cap-side');
    expect(assetName('cap', undefined, 'back')).toBe('cap-back');
  });
  it('levert nooit een bestand dat niet bestaat', () => {
    // hoodie heeft geen zijaanzicht → voorkant
    expect(assetName('hoodie', 'navy', 'side')).toBe('hoodie-navy-v2');
    // onbekende kleur → de standaardkleur
    expect(assetName('hoodie', 'knalroze', 'front')).toBe('hoodie-olijfgroen-v2');
    expect(assetName(undefined, undefined, undefined)).toBe('hoodie-olijfgroen-v2');
  });
});
