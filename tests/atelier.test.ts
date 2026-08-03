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
  it('kapt geen geldige optionele velden af', () => {
    const p = ClaimSchema.parse({ email: 'a@b.nl', name: 'Sanne' });
    expect(p.name).toBe('Sanne');
  });
  it('accepteert de cap als kledingstuk', () => {
    const p = ClaimSchema.parse({ email: 'a@b.nl', garment: 'cap' });
    expect(p.garment).toBe('cap');
  });
  it('weigert een kledingstuk buiten de set', () => {
    // Alleen de cap loopt in een genummerde oplage; de hoodie hoort
    // hier bewust niet meer bij.
    expect(() => ClaimSchema.parse({ email: 'a@b.nl', garment: 'hoodie' })).toThrow();
    expect(() => ClaimSchema.parse({ email: 'a@b.nl', garment: 'schoen' })).toThrow();
  });
});

describe('describePiece', () => {
  it('beschrijft de cap als één klassieke uitvoering', () => {
    expect(describePiece()).toBe('Cap · Grijs melange');
  });
});

describe('anglesFor / resolveAngle', () => {
  it('geeft de cap voorkant, zijkant en achterkant', () => {
    expect(anglesFor()).toEqual(['front', 'side', 'back']);
  });
  it('houdt een bestaande hoek vast', () => {
    expect(resolveAngle('back')).toBe('back');
    expect(resolveAngle('side')).toBe('side');
  });
  it('valt terug op de voorkant bij een onbekende hoek', () => {
    expect(resolveAngle('onzin')).toBe('front');
    expect(resolveAngle(undefined)).toBe('front');
  });
});

describe('assetName', () => {
  it('kiest het juiste capbeeld per hoek', () => {
    expect(assetName('front')).toBe('cap-front');
    expect(assetName('side')).toBe('cap-side');
    expect(assetName('back')).toBe('cap-back');
  });
  it('levert nooit een bestand dat niet bestaat', () => {
    expect(assetName('onzin')).toBe('cap-front');
    expect(assetName(undefined)).toBe('cap-front');
  });
});
