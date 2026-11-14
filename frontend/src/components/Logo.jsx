import Icon from './Icon.jsx';

// Yellow shield + "RCS / Road Convenience Suite". Tapping 5 times opens the demo panel (handled in App.jsx).
export default function Logo({ onTap, compact = false }) {
  return (
    <div className={'logo' + (compact ? ' logo--compact' : '')} onClick={onTap} role="img" aria-label="RCS Road Convenience Suite">
      <span className="logo__mark">
        <Icon name="shield" size={compact ? 26 : 32} fill="currentColor" stroke={0} />
        <Icon name="pin" size={compact ? 12 : 15} className="logo__pin" stroke={2.4} />
      </span>
      <span className="logo__text">
        <strong>RCS</strong>
        <small>Road Convenience Suite</small>
      </span>
    </div>
  );
}
