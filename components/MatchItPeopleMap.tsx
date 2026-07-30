import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, LocateFixed } from 'lucide-react';
import { MatchItLocationShare } from '../types';
import {
  boundsFromCenterZoom,
  computeMapBounds,
  latLngToPercent,
  latToTileY,
  lonToTileX,
  tileUrl,
  zoomForBounds,
  MapBounds,
} from '../utils/mapBounds';

export type MapPin = {
  id: string;
  name: string;
  avatar: string;
  latitude: number;
  longitude: number;
  isSelf?: boolean;
  expiresAt?: string | null;
};

interface MatchItPeopleMapProps {
  pins: MapPin[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectPin?: (pin: MapPin) => void;
  selectedPinId?: string | null;
  fullScreen?: boolean;
  emptyHint?: string;
}

type TileSpec = { key: string; z: number; x: number; y: number; left: number; top: number };

function buildTiles(bounds: MapBounds, zoom: number, width: number, height: number): TileSpec[] {
  const z = zoom;
  const x0 = lonToTileX(bounds.minLng, z);
  const x1 = lonToTileX(bounds.maxLng, z);
  const y0 = latToTileY(bounds.maxLat, z);
  const y1 = latToTileY(bounds.minLat, z);
  const minX = Math.floor(x0);
  const maxX = Math.floor(x1);
  const minY = Math.floor(y0);
  const maxY = Math.floor(y1);
  const scale = 256;
  const tiles: TileSpec[] = [];
  const n = 2 ** z;
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (y < 0 || y >= n) continue;
      const wrappedX = ((x % n) + n) % n;
      tiles.push({
        key: `${z}/${wrappedX}/${y}`,
        z,
        x: wrappedX,
        y,
        left: (x - x0) * scale,
        top: (y - y0) * scale,
      });
    }
  }
  // Silence unused — width/height reserved for future density tweaks
  void width;
  void height;
  return tiles;
}

const MatchItPeopleMap: React.FC<MatchItPeopleMapProps> = ({
  pins,
  userCoords,
  onSelectPin,
  selectedPinId,
  fullScreen = false,
  emptyHint = 'Only you on the map until someone shares location in a Match chat.',
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 480 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setSize({ w: Math.round(r.width), h: Math.round(r.height) });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dataBounds = useMemo(() => {
    const points = pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
    return computeMapBounds(points, userCoords);
  }, [pins, userCoords]);

  const { viewBounds, zoom, tiles } = useMemo(() => {
    const centerLat = (dataBounds.minLat + dataBounds.maxLat) / 2;
    const centerLng = (dataBounds.minLng + dataBounds.maxLng) / 2;
    const z = zoomForBounds(dataBounds, size.w, size.h);
    const vb = boundsFromCenterZoom(centerLat, centerLng, z, size.w, size.h);
    return {
      viewBounds: vb,
      zoom: z,
      tiles: buildTiles(vb, z, size.w, size.h),
    };
  }, [dataBounds, size.w, size.h]);

  const frameClass = fullScreen
    ? 'absolute inset-0 w-full h-full overflow-hidden bg-[var(--bg-input)]'
    : 'relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)] bg-[var(--bg-input)]';

  const others = pins.filter((p) => !p.isSelf);

  return (
    <div ref={frameRef} className={frameClass}>
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {tiles.map((t) => (
          <img
            key={t.key}
            src={tileUrl(t.z, t.x, t.y)}
            alt=""
            draggable={false}
            className="absolute pointer-events-none select-none"
            style={{
              width: 256,
              height: 256,
              left: t.left,
              top: t.top,
            }}
            loading="eager"
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 pointer-events-none" />

      {userCoords && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={latLngToPercent(userCoords.lat, userCoords.lng, viewBounds)}
          title="You are here"
        >
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-blue-600/90 px-1.5 py-0.5 rounded-full">
              You
            </span>
          </div>
        </div>
      )}

      {pins
        .filter((p) => !p.isSelf)
        .map((pin) => {
          const pos = latLngToPercent(pin.latitude, pin.longitude, viewBounds);
          const isSelected = selectedPinId === pin.id;
          return (
            <button
              key={pin.id}
              type="button"
              onClick={() => onSelectPin?.(pin)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-transform ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
              style={pos}
              title={pin.name}
              aria-label={pin.name}
            >
              <span className="relative block">
                <img
                  src={pin.avatar}
                  alt=""
                  className={`w-9 h-9 rounded-full border-2 object-cover shadow-md ${
                    isSelected ? 'border-orange-400' : 'border-white'
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border border-white flex items-center justify-center">
                  <Flame size={9} className="text-white" />
                </span>
              </span>
            </button>
          );
        })}

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 z-20 pointer-events-none">
        {userCoords && (
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)]/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm border border-[var(--border)]">
            <LocateFixed size={12} className="text-blue-500" />
            Your location
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)]/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm border border-[var(--border)]">
          {others.length === 0
            ? emptyHint
            : `${others.length} shared pin${others.length === 1 ? '' : 's'}`}
        </div>
      </div>
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-2 z-20 text-[9px] text-black/50 hover:text-black/80 bg-white/50 px-1 rounded"
      >
        © OSM · © CARTO
      </a>
    </div>
  );
};

export function sharesToMapPins(shares: MatchItLocationShare[]): MapPin[] {
  return shares.map((s) => ({
    id: s.id,
    name: s.userName,
    avatar: s.userAvatar,
    latitude: s.latitude,
    longitude: s.longitude,
    isSelf: s.isSelf,
    expiresAt: s.expiresAt,
  }));
}

export default MatchItPeopleMap;
