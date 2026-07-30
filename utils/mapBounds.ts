export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function computeMapBounds(
  points: { latitude: number; longitude: number }[],
  userCoords?: { lat: number; lng: number } | null
): MapBounds {
  const mapped = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  if (userCoords) mapped.push(userCoords);
  if (mapped.length === 0) {
    return { minLat: 38.55, maxLat: 38.62, minLng: -121.52, maxLng: -121.45 };
  }
  const lats = mapped.map((p) => p.lat);
  const lngs = mapped.map((p) => p.lng);
  const pad = 0.008;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

export function latLngToPercent(
  lat: number,
  lng: number,
  bounds: MapBounds
): { left: string; top: string } {
  const latSpan = bounds.maxLat - bounds.minLat || 0.01;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
  return {
    left: `${((lng - bounds.minLng) / lngSpan) * 100}%`,
    top: `${((bounds.maxLat - lat) / latSpan) * 100}%`,
  };
}

/** Web Mercator helpers for OSM-compatible raster tiles. */
export function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * 2 ** zoom;
}

export function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

export function tileXToLon(x: number, zoom: number): number {
  return (x / 2 ** zoom) * 360 - 180;
}

export function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function zoomForBounds(bounds: MapBounds, widthPx: number, heightPx: number): number {
  const WORLD = 256;
  const latFraction = Math.abs(latToTileY(bounds.maxLat, 0) - latToTileY(bounds.minLat, 0));
  const lngFraction = Math.abs(bounds.maxLng - bounds.minLng) / 360;
  const latZoom = Math.log2(heightPx / WORLD / Math.max(latFraction, 1e-6));
  const lngZoom = Math.log2(widthPx / WORLD / Math.max(lngFraction, 1e-6));
  // Slightly zoom out so pins aren't clipped at edges
  return Math.max(2, Math.min(18, Math.floor(Math.min(latZoom, lngZoom) - 0.35)));
}

/** Recompute bounds from center zoom so pins align with the tiled basemap. */
export function boundsFromCenterZoom(
  centerLat: number,
  centerLng: number,
  zoom: number,
  widthPx: number,
  heightPx: number
): MapBounds {
  const cx = lonToTileX(centerLng, zoom);
  const cy = latToTileY(centerLat, zoom);
  const halfW = widthPx / 2 / 256;
  const halfH = heightPx / 2 / 256;
  return {
    minLng: tileXToLon(cx - halfW, zoom),
    maxLng: tileXToLon(cx + halfW, zoom),
    maxLat: tileYToLat(cy - halfH, zoom),
    minLat: tileYToLat(cy + halfH, zoom),
  };
}

/** Carto Voyager — free raster tiles, no API key. */
export function tileUrl(z: number, x: number, y: number): string {
  const n = (x + y) % 3;
  const host = ['a', 'b', 'c'][n];
  return `https://${host}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}
