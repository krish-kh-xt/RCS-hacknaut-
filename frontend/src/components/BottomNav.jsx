import Icon from './Icon.jsx';

export default function BottomNav({ route }) {
  const items = [
    { href: '#/', icon: 'home', label: 'Home', active: route === '/' || route === '/help' },
    { href: '#/map', icon: 'map', label: 'Maps', active: route === '/map' },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map((i) => (
        <a key={i.href} href={i.href} className={i.active ? 'is-active' : ''} aria-current={i.active ? 'page' : undefined}>
          <Icon name={i.icon} size={22} fill={i.active ? 'currentColor' : 'none'} />
          <span>{i.label}</span>
        </a>
      ))}
    </nav>
  );
}
