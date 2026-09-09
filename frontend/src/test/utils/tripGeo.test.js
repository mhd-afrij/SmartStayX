import { describe, it, expect } from 'vitest';
import {
  decodePolyline,
  formatDuration,
  formatDistance,
  formatTimeOfDay,
  parseDepartureTime,
  buildEtaChain,
  stopNumber,
  haversineKm,
} from '../../utils/tripGeo';

describe('decodePolyline', () => {
  it('returns empty array for empty/invalid input', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null)).toEqual([]);
    expect(decodePolyline(123)).toEqual([]);
  });

  it('decodes a known Google polyline sample', () => {
    // Official sample from Google's polyline algorithm docs.
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points).toHaveLength(3);
    expect(points[0][0]).toBeCloseTo(38.5, 4);
    expect(points[0][1]).toBeCloseTo(-120.2, 4);
    expect(points[1][0]).toBeCloseTo(40.7, 4);
    expect(points[1][1]).toBeCloseTo(-120.95, 4);
    expect(points[2][0]).toBeCloseTo(43.252, 4);
    expect(points[2][1]).toBeCloseTo(-126.453, 4);
  });
});

describe('formatters', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(95)).toBe('1h 35m');
    expect(formatDuration(180)).toBe('3h');
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats distances', () => {
    expect(formatDistance(181.2)).toBe('181 km');
    expect(formatDistance(0.48)).toBe('480 m');
    expect(formatDistance(0)).toBe('0 km');
  });

  it('formats time of day', () => {
    expect(formatTimeOfDay(18 * 60 + 40)).toBe('6:40 PM');
    expect(formatTimeOfDay(9 * 60)).toBe('9:00 AM');
    expect(formatTimeOfDay(0)).toBe('12:00 AM');
    expect(formatTimeOfDay(12 * 60)).toBe('12:00 PM');
  });

  it('wraps around midnight', () => {
    expect(formatTimeOfDay(25 * 60)).toBe('1:00 AM');
  });
});

describe('parseDepartureTime', () => {
  it('parses valid HH:MM strings', () => {
    expect(parseDepartureTime('09:00')).toBe(540);
    expect(parseDepartureTime('23:59')).toBe(23 * 60 + 59);
  });

  it('falls back to 9:00 AM for invalid input', () => {
    expect(parseDepartureTime('')).toBe(540);
    expect(parseDepartureTime('not-a-time')).toBe(540);
    expect(parseDepartureTime('25:00')).toBe(540);
  });
});

describe('buildEtaChain', () => {
  const hotel = { lat: 6.9271, lng: 79.8612, name: 'Hotel' };
  const stopA = { lat: 7.2906, lng: 80.6337, name: 'Kandy' };
  const stopB = { lat: 7.8731, lng: 80.7718, name: 'Sigiriya' };

  const legs = [
    { distance: { value: 115000, text: '115 km' }, duration: { value: 5700, text: '1h 35m' } },
    { distance: { value: 50000, text: '50 km' }, duration: { value: 3600, text: '1h' } },
  ];

  it('builds segments per leg with arrival times', () => {
    const chain = buildEtaChain([hotel, stopA, stopB], legs, [120], 540); // 9:00 AM + 2h stay at A
    expect(chain.segments).toHaveLength(2);
    expect(chain.segments[0].durationMin).toBeCloseTo(95, 0);
    expect(chain.segments[1].durationMin).toBeCloseTo(60, 0);
    // Arrival at A: 9:00 + 1h35m = 10:35
    expect(chain.arrivalTimes[0]).toBeCloseTo(10 * 60 + 35, 0);
    // Departure from A: 10:35 + 2h = 12:35
    expect(chain.departureTimes[1]).toBeCloseTo(12 * 60 + 35, 0);
    // Final arrival: 12:35 + 1h = 13:35
    expect(chain.arrivalTimes[1]).toBeCloseTo(13 * 60 + 35, 0);
  });

  it('totals distance, duration and stops', () => {
    const chain = buildEtaChain([hotel, stopA, stopB], legs, [0], 540);
    expect(chain.totals.stops).toBe(2);
    expect(chain.totals.distanceKm).toBeCloseTo(165, 0);
    expect(chain.totals.durationMin).toBeCloseTo(155, 0);
  });

  it('falls back to haversine when legs are missing', () => {
    const chain = buildEtaChain([hotel, stopA], null, [0], 540);
    expect(chain.segments[0].distanceKm).toBeGreaterThan(0);
    expect(chain.segments[0].distanceKm).toBe(haversineKm(hotel, stopA));
  });
});

describe('stopNumber', () => {
  it('pads to two digits', () => {
    expect(stopNumber(0)).toBe('01');
    expect(stopNumber(8)).toBe('09');
    expect(stopNumber(11)).toBe('12');
  });
});
