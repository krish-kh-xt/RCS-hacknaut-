import Icon from './Icon.jsx';
import { km } from '../utils/format.js';

const KIND = {
  hospital: { icon: 'cross', cls: 'red', label: 'Hospital' },
  police: { icon: 'shield', cls: 'blue', label: 'Police Station' },
  highway: { icon: 'road', cls: 'green', label: 'Highway Help' },
  patrol: { icon: 'car', cls: 'purple', label: 'Patrol Unit' },
};

export function KindIcon({ kind, size = 22, bare = false }) {
  const k = KIND[kind] || KIND.hospital;
  return (
    <span className={'kind-icon kind-icon--' + k.cls + (bare ? ' kind-icon--bare' : '')}>
      <Icon name={k.icon} size={size} fill={kind === 'hospital' ? 'currentColor' : 'none'} />
    </span>
  );
}

export const kindLabel = (kind) => (KIND[kind] || KIND.hospital).label;

// Row used on the full "Nearest help" list.
export default function PlaceCard({ kind, place }) {
  const phone = place.phone || place.contact;
  return (
    <article className="place-card">
      <KindIcon kind={kind} />
      <div className="place-card__body">
        <h3>{place.name || kindLabel(kind)}</h3>
        <p>{kindLabel(kind)}</p>
      </div>
      <div className="place-card__side">
        <strong>{km(place.distanceKm)}</strong>
        {phone && (
          <a href={`tel:${phone}`} className="place-card__call">
            Call
          </a>
        )}
      </div>
    </article>
  );
}
