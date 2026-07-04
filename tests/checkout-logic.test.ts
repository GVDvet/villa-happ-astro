import { describe, it, expect } from 'vitest';
import {
  shippingCost,
  FREE_SHIPPING_CENTS,
  CheckoutSchema,
  mapMollieStatus,
} from '../src/lib/checkout-logic';

describe('shippingCost', () => {
  it('rekent NL-tarief onder de gratis-verzendgrens', () => {
    expect(shippingCost('NL', 5995)).toBe(495);
  });
  it('rekent BE- en DE-tarief', () => {
    expect(shippingCost('BE', 2195)).toBe(695);
    expect(shippingCost('DE', 2195)).toBe(895);
  });
  it('is gratis vanaf exact de grens, voor elk land', () => {
    expect(shippingCost('NL', FREE_SHIPPING_CENTS)).toBe(0);
    expect(shippingCost('BE', FREE_SHIPPING_CENTS)).toBe(0);
    expect(shippingCost('DE', 9999)).toBe(0);
  });
  it('is niet gratis op 1 cent onder de grens', () => {
    expect(shippingCost('NL', FREE_SHIPPING_CENTS - 1)).toBe(495);
  });
  it('valt voor onbekende landen terug op het hoogste tarief', () => {
    expect(shippingCost('FR', 2195)).toBe(895);
  });
});

describe('CheckoutSchema', () => {
  const valid = {
    items: [{ variant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 2 }],
    customer: { email: 'test@example.com', first_name: 'Sanne', last_name: 'Jansen' },
    shipping: { street: 'Heuvelstraat', house_number: '12a', postal_code: '5038 AA', city: 'Tilburg', country: 'NL' as const },
  };

  it('accepteert een geldige payload', () => {
    expect(CheckoutSchema.parse(valid).shipping.country).toBe('NL');
  });
  it('weigert een lege cart', () => {
    expect(() => CheckoutSchema.parse({ ...valid, items: [] })).toThrow();
  });
  it('weigert quantity 0 en quantity boven 20', () => {
    expect(() => CheckoutSchema.parse({ ...valid, items: [{ ...valid.items[0], quantity: 0 }] })).toThrow();
    expect(() => CheckoutSchema.parse({ ...valid, items: [{ ...valid.items[0], quantity: 21 }] })).toThrow();
  });
  it('weigert een variant_id die geen uuid is (injectie-oppervlak)', () => {
    expect(() => CheckoutSchema.parse({ ...valid, items: [{ variant_id: '1; DROP TABLE', quantity: 1 }] })).toThrow();
  });
  it('weigert landen buiten NL/BE/DE', () => {
    expect(() => CheckoutSchema.parse({ ...valid, shipping: { ...valid.shipping, country: 'FR' } })).toThrow();
  });
  it('default naar NL als land ontbreekt', () => {
    const { country, ...rest } = valid.shipping;
    expect(CheckoutSchema.parse({ ...valid, shipping: rest }).shipping.country).toBe('NL');
  });
});

describe('mapMollieStatus (idempotente statusmachine)', () => {
  const open = { payment_status: 'open', status: 'pending' };
  const paid = { payment_status: 'paid', status: 'paid' };
  const cancelled = { payment_status: 'expired', status: 'cancelled' };

  it('paid op een open order: finalize + markeer betaald', () => {
    const t = mapMollieStatus('paid', open);
    expect(t).toEqual({ payment_status: 'paid', status: 'paid', action: 'finalize', markPaidAt: true });
  });

  it('tweede paid-webhook op een al betaalde order doet niets (geen dubbele voorraadaftrek)', () => {
    const t = mapMollieStatus('paid', paid);
    expect(t.action).toBe('none');
    expect(t.payment_status).toBe('paid');
    expect(t.markPaidAt).toBe(false);
  });

  it('een al betaalde order kan niet meer geannuleerd worden door een late webhook', () => {
    const t = mapMollieStatus('expired', paid);
    expect(t.action).toBe('none');
    expect(t.status).toBe('paid');
  });

  it('expired op een open order: release + cancelled', () => {
    const t = mapMollieStatus('expired', open);
    expect(t).toEqual({ payment_status: 'expired', status: 'cancelled', action: 'release', markPaidAt: false });
  });

  it('canceled wordt als failed vastgelegd', () => {
    expect(mapMollieStatus('canceled', open).payment_status).toBe('failed');
  });

  it('tweede failure-webhook geeft de voorraad niet nogmaals vrij', () => {
    const t = mapMollieStatus('failed', cancelled);
    expect(t.action).toBe('none');
  });

  it('authorized en open muteren alleen payment_status', () => {
    expect(mapMollieStatus('authorized', open)).toMatchObject({ payment_status: 'authorized', action: 'none' });
    expect(mapMollieStatus('pending', open)).toMatchObject({ payment_status: 'open', action: 'none' });
  });

  it('onbekende status verandert niets', () => {
    expect(mapMollieStatus('chargeback?', open)).toMatchObject({ action: 'none', payment_status: 'open' });
  });
});
