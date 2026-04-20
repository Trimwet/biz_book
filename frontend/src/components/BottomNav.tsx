import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import {
  House,
  MagnifyingGlass,
  Storefront,
  UserCircle,
  Compass,
  Heart,
  Package,
  ChartBar,
  ChatCircle,
} from '@phosphor-icons/react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  match?: string[]; // additional paths that count as "active"
}

const shopperNav: NavItem[] = [
  { label: 'Home', icon: House, path: '/shopper/dashboard', match: ['/'] },
  { label: 'Browse', icon: Compass, path: '/browse' },
  { label: 'Search', icon: MagnifyingGlass, path: '/search' },
  { label: 'Saved', icon: Heart, path: '/watchlist' },
  { label: 'Profile', icon: UserCircle, path: '/profile' },
];

const vendorNav: NavItem[] = [
  { label: 'Home', icon: House, path: '/vendor/dashboard' },
  { label: 'Products', icon: Package, path: '/vendor/products' },
  { label: 'Chats', icon: ChatCircle, path: '/vendor/chats' },
  { label: 'Analytics', icon: ChartBar, path: '/vendor/analytics' },
  { label: 'Profile', icon: UserCircle, path: '/profile' },
];

const guestNav: NavItem[] = [
  { label: 'Home', icon: House, path: '/' },
  { label: 'Browse', icon: Compass, path: '/browse' },
  { label: 'Search', icon: MagnifyingGlass, path: '/search' },
  { label: 'Sign In', icon: UserCircle, path: '/login' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const items: NavItem[] = !user
    ? guestNav
    : user.user_type === 'vendor'
      ? vendorNav
      : shopperNav;

  const isActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (item.match?.includes(location.pathname)) return true;
    return false;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-[4.5rem] max-w-lg mx-auto px-2">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                  active ? 'bg-blue-50' : ''
                }`}
              >
                <Icon
                  size={22}
                  weight={active ? 'fill' : 'regular'}
                />
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
