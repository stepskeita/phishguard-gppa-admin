import ThemeToggle from "@/components/shared/ThemeToggle";
import logoFull from "@/assets/logo-full.jpg";
import authBg1280 from "@/assets/auth-bg-1280.webp";
import authBg2560 from "@/assets/auth-bg-2560.webp";

// Shell for the signed-out pages. From lg up it's a split screen — form on
// the left, image on the right. Below lg the image becomes a full-bleed
// background (behind a dark scrim) and the form sits on it as a card.
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden bg-slate-950 lg:relative lg:order-2"
      >
        {/* The image is object-cover'd to the panel's height, so on desktop
            its rendered width is ~1.9x the viewport height, not 50vw. */}
        <img
          src={authBg2560}
          srcSet={`${authBg1280} 1280w, ${authBg2560} 2560w`}
          sizes="(min-width: 1024px) 190vh, 100vw"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55 lg:bg-transparent lg:bg-gradient-to-t lg:from-slate-950/85 lg:via-slate-950/15 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 hidden p-12 text-white lg:block">
          <p className="max-w-md text-balance text-2xl font-semibold tracking-tight">
            Simulated phishing &amp; security awareness training
          </p>
          <p className="mt-2 text-sm text-white/70">
            Gambia Public Procurement Authority
          </p>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8 lg:order-1 lg:bg-card lg:p-12">
        <ThemeToggle className="absolute right-4 top-4 text-white/80 hover:bg-white/10 hover:text-white lg:text-muted-foreground lg:hover:bg-accent lg:hover:text-foreground" />
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xl lg:border-0 lg:p-0 lg:shadow-none">
          <div className="space-y-3">
            {/* The logo JPEG has a white background — seamless on the light
                card, and a deliberate white plate in dark mode. */}
            <div className="rounded-xl bg-white p-3">
              <img
                src={logoFull}
                alt="Gambia Public Procurement Authority"
                className="h-auto w-full"
              />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              PhishGuard GPPA Admin Portal
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
