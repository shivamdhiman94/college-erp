import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-6 font-medium">
      <Link
        to="/"
        className="flex items-center space-x-1 hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedTitle = value
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="text-brand-400 font-semibold">{formattedTitle}</span>
            ) : (
              <Link to={to} className="hover:text-slate-200 transition-colors">
                {formattedTitle}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
