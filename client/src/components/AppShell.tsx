import type { PropsWithChildren } from 'react';

import '../styles/app-shell.css';

function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <main className="app-shell__main">{children}</main>
    </div>
  );
}

export default AppShell;
