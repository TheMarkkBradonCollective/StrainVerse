import React, { useMemo } from 'react';
import { Flame, LocateFixed } from 'lucide-react';
import { MatchPerson } from '../types';
import { computeMapBounds, getStaticMapUrl, latLngToPercent } from '../utils/mapBounds';

interface MatchItPeopleMapProps {
  people: MatchPerson[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectPerson: (person: MatchPerson) => void;
  selectedPersonId?: string | null;
  /** Fill parent instead of fixed aspect ratio (map mode). */
  fullScreen?: boolean;
}

const MatchItPeopleMap: React.FC<MatchItPeopleMapProps> = ({
  people,
  userCoords,
  onSelectPerson,
  selectedPersonId,
  fullScreen = false,
}) => {
  const mappable = useMemo(
    () =>
      people.filter(
        (p): p is MatchPerson & { latitude: number; longitude: number } =>
          typeof p.latitude === 'number' && typeof p.longitude === 'number'
      ),
    [people]
  );

  const bounds = useMemo(() => computeMapBounds(mappable, userCoords), [mappable, userCoords]);
  const mapUrl = useMemo(() => getStaticMapUrl(bounds), [bounds]);

  const frameClass = fullScreen
    ? 'absolute inset-0 w-full h-full overflow-hidden bg-[var(--bg-card)]'
    : 'relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)] bg-[var(--bg-card)]';

  if (mappable.length === 0) {
    return (
      <div
        className={
          fullScreen
            ? 'absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-main)] px-6 text-center'
            : 'aspect-[4/3] flex items-center justify-center text-sm text-[var(--text-muted)] rounded-2xl border border-[var(--border)]'
        }
      >
        <Flame size={32} className="text-orange-400/50 mb-1" />
        <p>No nearby people with map locations yet.</p>
        <p className="text-xs">Switch to list view, or wait for others to share location.</p>
      </div>
    );
  }

  return (
    <div className={frameClass}>
      <img
        src={mapUrl}
        alt="Map of people nearby looking to smoke"
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
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
        </div>
      )}

      {mappable.map((person) => {
        const pos = latLngToPercent(person.latitude, person.longitude, bounds);
        const isSelected = selectedPersonId === person.id;
        return (
          <button
            key={person.id}
            type="button"
            onClick={() => onSelectPerson(person)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-transform ${
              isSelected ? 'scale-110' : 'hover:scale-105'
            }`}
            style={pos}
            title={person.name}
            aria-label={person.name}
          >
            <span className="relative block">
              <img
                src={person.avatar}
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

      {userCoords && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[var(--bg-card)]/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm border border-[var(--border)]">
          <LocateFixed size={12} className="text-blue-500" />
          Your location
        </div>
      )}
    </div>
  );
};

export default MatchItPeopleMap;
