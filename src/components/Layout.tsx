import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/test', label: 'Practice', icon: '📝' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/recommendations', label: 'Learn', icon: '🎯' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { to: '/notes', label: 'Notes', icon: '📓' },
  { to: '/study-planner', label: 'Planner', icon: '📅' },
  { to: '/knowledge-map', label: 'Map', icon: '🗺️' },
  { to: '/review', label: 'Review', icon: '🔍' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface text-text-primary overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface-card border-r border-border transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:flex lg:flex-col`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">CISSP Coach</h1>
            <p className="text-xs text-text-muted">Offline Prep Platform</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/50'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-surface-hover/50 transition-all"
          >
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-surface-card/50 border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-text-primary">🛡️ CISSP Coach</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover"
          >
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
