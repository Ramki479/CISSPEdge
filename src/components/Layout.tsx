import { NavLink, Outlet, useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◉' },
  { to: '/learn', label: 'Learn', icon: '⊕' },
  { to: '/mentor', label: 'AI Mentor', icon: '#' },
  { to: '/test', label: 'Practice', icon: '▸' },
  { to: '/skills-assessment', label: 'Skills', icon: '◆' },
  { to: '/analytics', label: 'Analytics', icon: '◈' },
  { to: '/study-coach', label: 'Coach', icon: '◈' },
  { to: '/recommendations', label: 'Recommend', icon: '⊞' },
  { to: '/flashcards', label: 'Flashcards', icon: '◐' },
  { to: '/notes', label: 'Notes', icon: '◇' },
  { to: '/study-planner', label: 'Planner', icon: '⊞' },
  { to: '/knowledge-map', label: 'Map', icon: '⊕' },
  { to: '/review', label: 'Review', icon: '◎' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

// Direction-aware page transition variants
const pageVariants = (direction: 'forward' | 'back' | 'replace', isDashboard: boolean) => {
  const forwardX = 40;
  const backX = -30;

  const enterX = direction === 'back' ? backX : forwardX;
  const exitX = direction === 'back' ? forwardX : -forwardX;

  if (isDashboard) {
    return {
      initial: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, scale: 0.97, filter: 'blur(2px)' },
    };
  }

  return {
    initial: { opacity: 0, x: enterX, filter: 'blur(2px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: exitX, filter: 'blur(2px)' },
  };
};

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType();
  const outlet = useOutlet();

  const [direction, setDirection] = useState<'forward' | 'back' | 'replace'>('forward');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (navigationType === 'POP') {
      setDirection('back');
    } else if (navigationType === 'PUSH') {
      setDirection('forward');
    } else {
      setDirection('replace');
    }
  }, [location.pathname, navigationType]);

  const currentBase = '/' + location.pathname.split('/')[1];
  const isDashboard = currentBase === '/dashboard';

  return (
    <div className="flex h-screen overflow-hidden tw-bg-surface">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: 0 }}
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Sidebar background — theme aware */}
        <div className="absolute inset-0 tw-bg-sidebar backdrop-blur-xl border-r tw-border" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/[0.02] to-transparent pointer-events-none dark:block hidden" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b tw-border glass-light" style={{ background: 'rgba(8, 11, 20, 0.92)' }}>
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-lg opacity-20 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] rounded-lg opacity-40" />
              <span className="relative text-lg font-bold tw-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tw-text-primary tracking-tight">CISSP Edge</h1>
              <p className="text-[10px] tw-text-muted font-mono uppercase tracking-widest">Offline · Secure</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              className="space-y-0.5"
            >
              {navItems.map(item => (
                <motion.div key={item.to} variants={itemVariants}>
                  <NavLink
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `tw-sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute left-0 w-[2px] h-5 bg-gradient-to-b from-[#00f0ff] to-[#ff00e4] rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className={`text-base w-5 text-center transition-colors ${
                          isActive
                            ? 'text-[#00f0ff]'
                            : 'tw-text-muted group-hover:tw-text-accent'
                        }`}>
                          {item.icon}
                        </span>
                        <span className={isActive ? 'tw-text-inverse dark:text-white' : 'tw-text-secondary'}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </motion.div>
          </nav>

          {/* Theme toggle */}
          <div className="px-3 py-3 border-t tw-border">
            <button
              onClick={toggleTheme}
              className="tw-sidebar-nav-item w-full"
            >
              <span className="text-base w-5 text-center tw-text-muted group-hover:tw-text-accent transition-colors">
                {theme === 'dark' ? '◉' : '○'}
              </span>
              <span className="tw-text-secondary text-sm font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Cyber-grid background — dark mode only */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 dark:block hidden" />

        {/* Top bar — mobile only */}
        <header className="relative z-10 flex items-center justify-between px-4 py-3 lg:hidden glass-light">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg tw-text-secondary hover:tw-text-primary hover:tw-bg-hover transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00f0ff] to-[#ff00e4] flex items-center justify-center">
              <span className="text-xs font-bold tw-text-inverse font-mono">#</span>
            </div>
            <span className="text-sm font-semibold tw-text-primary">CISSP Edge</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg tw-text-secondary hover:tw-text-primary hover:tw-bg-hover transition-all"
          >
            <span className="text-lg">{theme === 'dark' ? '◉' : '○'}</span>
          </button>
        </header>

        {/* Page content with direction-aware transitions */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants(direction, isDashboard)}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
                filter: { duration: 0.25 },
              }}
            >
              <ErrorBoundary fallbackTitle="Page Error" fallbackMessage="An error occurred loading this page.">
                {outlet}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
