import { describe, expect, it } from 'vitest';
import { macroText, parseDecimal } from './format';

describe('parseDecimal', () => {
  it('accepts dot and comma decimals, empty → undefined, junk → NaN', () => {
    expect(parseDecimal('1.5')).toBe(1.5);
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal(' 25 ')).toBe(25);
    expect(parseDecimal('1.')).toBe(1);
    expect(parseDecimal('')).toBeUndefined();
    expect(parseDecimal('.')).toBeNaN();
    expect(parseDecimal('-3')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
  });
});

describe('macroText', () => {
  it('rounds for display', () => {
    expect(macroText({ kcal: 101.75, protein: 3, carbs: 17.1, fat: 2.4, fibre: 2.5 })).toBe('102 kcal · 3P · 17C · 2F · 3Fib');
  });
});
