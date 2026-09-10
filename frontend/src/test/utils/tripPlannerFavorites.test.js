// tripPlannerFavorites — Unit tests for the localStorage-backed favorites
// helpers (pure, DOM-free functions from utils/tripPlannerFavorites.js).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadFavorites, saveFavorites, toggleFavorite, isFavorite } from '../../utils/tripPlannerFavorites';

const PLACE = { placeId: 'ChIJ-A', name: 'Eiffel Tower', address: 'Paris', lat: 48.8584, lng: 2.2945 };
const OTHER = { placeId: 'ChIJ-B', name: 'Burj Khalifa', address: 'Dubai', lat: 25.1972, lng: 55.2744 };

describe('tripPlannerFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('loads an empty list when nothing is saved and keys per user', () => {
    expect(loadFavorites('user-1')).toEqual([]);
    saveFavorites('user-1', [PLACE]);
    expect(loadFavorites('user-1')).toHaveLength(1);
    expect(loadFavorites('user-2')).toEqual([]);
  });

  it('handles corrupt storage gracefully', () => {
    localStorage.setItem('tripPlannerFavorites:user-1', '{not-json');
    expect(loadFavorites('user-1')).toEqual([]);
  });

  it('adds then removes a favorite through toggleFavorite', () => {
    const added = toggleFavorite([], PLACE);
    expect(added).toHaveLength(1);
    expect(isFavorite(added, PLACE.placeId)).toBe(true);

    const removed = toggleFavorite(added, PLACE);
    expect(removed).toHaveLength(0);
    expect(isFavorite(removed, PLACE.placeId)).toBe(false);
  });

  it('deduplicates by placeId when toggling same place twice', () => {
    const once = toggleFavorite([], PLACE);
    const twice = toggleFavorite(once, PLACE);
    expect(twice).toHaveLength(0);
  });

  it('prepends new uniques and keeps existing favorites', () => {
    const first = toggleFavorite([], PLACE);
    const second = toggleFavorite(first, OTHER);
    expect(second).toHaveLength(2);
    expect(second[0].placeId).toBe(OTHER.placeId);
    expect(second[1].placeId).toBe(PLACE.placeId);
  });
});