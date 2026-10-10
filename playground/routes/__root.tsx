import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { DarkTheme, DefaultTheme } from "@/constants/theme.constant";
import { getStyleFromTheme } from "@/utils/theme.util";

import appCss from "@/css/base.css?url";

export const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Spaceful" },
      {
        name: "description",
        content:
          "Immutable 2D shapes and an R-tree spatial index for TypeScript. Exact-shape search, collisions, nearest neighbours and rotation.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
        <style>{`:root {${getStyleFromTheme(DefaultTheme)}} .dark {${getStyleFromTheme(DarkTheme)}}`}</style>
      </head>
      <body className="font-sans antialiased bg-shade-100 dark:bg-shade-50 text-shade-700 selection:bg-primary/40">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
