import { ReactNode } from 'react';

import { ThemeToggle } from './ThemeToggle';

const ALGORAND_LOGO_PATH =
  'M28 28.0243H24.2515L21.8053 18.9452L16.5477 28.0243H12.3489L20.4665 13.9675L19.1521 9.06281L8.19878 28.0243H4L17.8864 3.97559H21.574L23.1684 9.96342H26.9655L24.3854 14.4665L28 28.0243Z';
const BOLT_ICON_PATH = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';

const PATTERN_FILL_LIGHT = '001324';
const PATTERN_FILL_DARK = 'ffffff';

const buildPatternUrl = (fillColor: string) =>
  `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${fillColor}' fill-opacity='1'%3E%3Cpath transform='translate(8, 15) scale(0.6)' d='${ALGORAND_LOGO_PATH}'/%3E%3Cpath transform='translate(38, 15) scale(0.9)' d='${BOLT_ICON_PATH}'/%3E%3C/g%3E%3C/svg%3E")`;

const BACKGROUND_POSITION_STYLE = {
  transform: 'rotate(45deg) scale(2.5)',
  transformOrigin: 'center' as const,
  width: '200%',
  height: '200%',
  left: '-50%',
  top: 'calc(-50% + 4.5rem)',
};

const ROW_COUNT = 24;

const AnimatedBackground = ({
  fillColor,
  className,
  keyPrefix,
}: {
  fillColor: string;
  className: string;
  keyPrefix: string;
}) => (
  <div
    className={`pointer-events-none fixed z-0 flex-col gap-4 overflow-visible opacity-[0.03] ${className}`}
    style={BACKGROUND_POSITION_STYLE}
  >
    {Array.from({ length: ROW_COUNT }).map((_, index) => (
      <div
        key={`${keyPrefix}-${index}`}
        style={{
          flex: 1,
          minHeight: 0,
          backgroundImage: buildPatternUrl(fillColor),
          backgroundSize: '60px 60px',
          animation:
            index % 2 === 0
              ? 'slideLeftToRight 20s linear infinite'
              : 'slideRightToLeft 20s linear infinite',
        }}
      />
    ))}
  </div>
);

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-background min-h-screen">
      <header className="bg-card/80 border-border sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 sm:h-8">
                  <img
                    src={`${import.meta.env.BASE_URL}logos/algorand-logo-light.svg`}
                    alt="Algorand"
                    className="hidden h-full dark:block"
                  />
                  <img
                    src={`${import.meta.env.BASE_URL}logos/algorand-logo-dark.svg`}
                    alt="Algorand"
                    className="h-full dark:hidden"
                  />
                </div>
                <h1 className="text-foreground text-lg font-bold sm:text-2xl">Energy Dashboard</h1>
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:mt-2">
                Network statistics and environmental impact metrics
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative container mx-auto max-w-7xl px-6 py-8">
        <AnimatedBackground
          fillColor={PATTERN_FILL_LIGHT}
          className="flex dark:hidden"
          keyPrefix="light-row"
        />
        <AnimatedBackground
          fillColor={PATTERN_FILL_DARK}
          className="hidden dark:flex"
          keyPrefix="dark-row"
        />

        <div className="relative z-10 space-y-6">{children}</div>
      </main>

      <footer className="bg-background border-border relative z-20 border-t">
        <div className="text-muted-foreground container mx-auto max-w-7xl px-6 py-6 text-center text-sm">
          <p className="mb-1">
            Data sources:{' '}
            <a
              href="https://nodely.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline transition-colors"
            >
              Nodely
            </a>
            {' · '}
            <a
              href="https://ourworldindata.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline transition-colors"
            >
              Our World in Data
            </a>
          </p>
          <p className="text-xs opacity-70">
            © {new Date().getFullYear()} Algorand Energy Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
};
