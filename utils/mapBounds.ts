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

export function getStaticMapUrl(bounds: MapBounds, width = 800, height = 500): string {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const latSpan = bounds.maxLat - bounds.minLat;
  const zoom = Math.max(10, Math.min(15, Math.round(14 - Math.log2(latSpan * 120))));
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik`;
}
