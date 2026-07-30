import React, { useMemo } from 'react';
import { Flame, LocateFixed } from 'lucide-react';
import { MatchItLocationShare } from '../types';
import { computeMapBounds, getStaticMapUrl, latLngToPercent } from '../utils/mapBounds';

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

const MatchItPeopleMap: React.FC<MatchItPeopleMapProps> = ({
  pins,
  userCoords,
  onSelectPin,
  selectedPinId,
  fullScreen = false,
  emptyHint = 'Only you on the map until someone shares location in a Match chat.',
}) => {
  const bounds = useMemo(() => {
    const points = pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
    return computeMapBounds(points, userCoords);
  }, [pins, userCoords]);
  const mapUrl = useMemo(() => getStaticMapUrl(bounds, 900, 700), [bounds]);

  const frameClass = fullScreen
    ? 'absolute inset-0 w-full h-full overflow-hidden bg-[var(--bg-card)]'
    : 'relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)] bg-[var(--bg-card)]';

  const others = pins.filter((p) => !p.isSelf);

  return (
    <div className={frameClass}>
      <img
        src={mapUrl}
        alt="MatchIt location map"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 pointer-events-none" />

      {userCoords && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={latLngToPercent(userCoords.lat, userCoords.lng, bounds)}
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
          const pos = latLngToPercent(pin.latitude, pin.longitude, bounds);
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

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 z-20">
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
