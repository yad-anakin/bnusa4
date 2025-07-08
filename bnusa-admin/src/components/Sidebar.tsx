import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggleMobileMenu: () => void;
}

// Sidebar navigation items
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Articles', href: '/articles', icon: NewspaperIcon },
  { name: 'Books', href: '/books', icon: BookOpenIcon },
  { name: 'Pending Reviews', href: '/articles/pending', icon: ClockIcon, hasBadge: true },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ isOpen, isMobileOpen, toggleMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const [pendingArticlesCount, setPendingArticlesCount] = useState(0);

  // Fetch pending articles count
  useEffect(() => {
    const fetchPendingArticlesCount = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          if (data.stats && data.stats.pendingArticles) {
            setPendingArticlesCount(data.stats.pendingArticles);
          }
        }
      } catch (error) {
        console.error('Error fetching pending articles count:', error);
      }
    };

    fetchPendingArticlesCount();
    
    // Set up polling interval (every 5 minutes)
    const interval = setInterval(fetchPendingArticlesCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Determine if a nav item is active
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Mobile sidebar
  const mobileClasses = isMobileOpen 
    ? 'fixed inset-0 z-40 flex md:hidden' 
    : 'hidden';

  // Desktop sidebar
  const desktopClasses = isOpen 
    ? 'hidden md:flex md:w-64 md:flex-col' 
    : 'hidden md:flex md:w-20 md:flex-col';

  return (
    <>
      {/* Mobile sidebar */}
      <div className={mobileClasses}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-indigo-600">Bnusa Admin</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive(item.href)
                      ? 'active'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.hasBadge && pendingArticlesCount > 0 && (
                    <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {pendingArticlesCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={desktopClasses}>
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              {isOpen ? (
                <h1 className="text-xl font-bold text-indigo-600">Bnusa Admin</h1>
              ) : (
                <h1 className="text-xl font-bold text-indigo-600">B</h1>
              )}
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'active'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={item.name}
                >
                  <div className="relative">
                    <item.icon
                      className={`flex-shrink-0 h-6 w-6 ${
                        isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {!isOpen && item.hasBadge && pendingArticlesCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {pendingArticlesCount}
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <span className="ml-3 flex-1">{item.name}</span>
                  )}
                  {isOpen && item.hasBadge && pendingArticlesCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {pendingArticlesCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
} 