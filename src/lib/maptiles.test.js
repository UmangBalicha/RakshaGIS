/* Tests for src/lib/maptiles.js — tile provider selection. */
import { describe, expect, it } from 'vitest';
import { getMapTiles, mapmyIndiaKey } from './maptiles.js';

describe('map tiles', () => {
  it('returns null key and OSM fallback when no key is configured', () => {
    expect(mapmyIndiaKey()).toBeNull();
    const tiles = getMapTiles();
    expect(tiles.isIndian).toBe(false);
    expect(tiles.url).toContain('openstreetmap');
    expect(tiles.attribution).toContain('OpenStreetMap');
  });
});
