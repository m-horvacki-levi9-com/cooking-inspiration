import type { PropsWithChildren } from 'react';

import '../styles/app-shell.css';

function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <p className="app-shell__eyebrow">Cooking Inspiration</p>
        <h1>Cooking Inspiration</h1>
        <p>Search Cookpad recipes by keyword and discover your next meal idea.</p>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}

export default AppShell;
