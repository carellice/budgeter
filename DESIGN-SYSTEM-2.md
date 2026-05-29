# DDS 2 (Dueffe Design System)

DDS 2 e' una variante del Dueffe Design System costruita partendo da `DESIGN-SYSTEM.md`, ma orientata allo stile dei loghi in `public/dueffe/`:

- `public/dueffe/logo dueffe dark.png`: monogramma bianco su nero profondo con taglio oro.
- `public/dueffe/logo dueffe light.png`: monogramma nero/antracite con oro e trasparenza, ideale su superfici chiare.
- `public/dueffe/logo dueffe dark no sfondo.png`: logo chiaro senza box, ideale per header scuri.
- `public/dueffe/logo dueffe light no sfondo.png`: variante esportata su fondo chiaro; usarla solo se il box bianco e' desiderato.

La direzione visiva e' premium, netta e minimale: nero profondo, bianco pulito, oro metallico, superfici compatte, pochissimi gradienti e micro-animazioni precise.

## Identita'

- **Premium operativo**: l'app deve restare utile e leggibile, ma con presenza piu' decisa.
- **Nero come spazio**: usare fondi scuri profondi, non blu/slate dominanti.
- **Oro come energia**: l'oro e' l'accento primario, da usare per azioni, stati attivi, focus e indicatori.
- **Taglio Dueffe**: forme leggermente inclinate, highlight laterali, curve grandi e angoli vivi dosati.
- **Flat premium**: preferire superfici piene, bordi sottili e ombre morbide. I gradienti sono eccezioni, non la base.

## Asset Logo

Usare i loghi cosi':

```txt
public/dueffe/logo dueffe dark.png
public/dueffe/logo dueffe light.png
public/dueffe/logo dueffe dark no sfondo.png
public/dueffe/logo dueffe light no sfondo.png
```

Regola consigliata:

- App header dark: usare `logo dueffe dark no sfondo.png`.
- App header light: usare `logo dueffe light.png`, per evitare il box bianco della variante RGB.
- UI premium/hero: usare i loghi con sfondo quando serve un effetto piu' scenografico.
- Icone piccole/app bar: preferire crop quadrato con monogramma centrato.

```css
.brand-mark {
  width: 58px;
  height: 48px;
  display: grid;
  place-items: center;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(255, 216, 77, 0.18));
}
```

## Token CSS

Rispetto al DDS originale, la palette passa da cyan/lime a oro/antracite.

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #fffaf0;
  background: #050505;

  --bg: #050505;
  --bg-elevated: #0b0a08;
  --surface: #11100d;
  --surface-high: #1a1711;
  --surface-higher: #242016;
  --surface-container: rgba(18, 16, 12, 0.9);

  --text: #fffaf0;
  --muted: #b8aa8d;
  --line: rgba(255, 220, 128, 0.16);

  --primary: #ffd84d;
  --primary-readable: #ffd84d;
  --primary-strong: #ffb800;
  --on-primary: #161006;
  --secondary: #fff0ad;
  --tertiary: #8f7a42;

  --danger: #ff9b9b;
  --warning: #ffd166;
  --success: #a8f0b0;

  --nav: rgba(8, 7, 5, 0.92);
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.48);
  --gold-glow: 0 0 34px rgba(255, 206, 68, 0.22);
}

:root[data-theme="light"] {
  color: #050505;
  background: #f5f5f2;

  --bg: #f5f5f2;
  --bg-elevated: #ffffff;
  --surface: #ffffff;
  --surface-high: #e8e5de;
  --surface-higher: #d4cec0;
  --surface-container: rgba(255, 255, 255, 0.9);

  --text: #050505;
  --muted: #5c5850;
  --line: rgba(5, 5, 5, 0.14);

  --primary: #ffd84d;
  --primary-readable: #725100;
  --primary-strong: #050505;
  --on-primary: #050505;
  --secondary: #050505;
  --tertiary: #8a6a1b;

  --danger: #b4232a;
  --warning: #7a5600;
  --success: #1d6b37;

  --nav: rgba(255, 255, 255, 0.92);
  --shadow: 0 24px 70px rgba(5, 5, 5, 0.14);
  --gold-glow: 0 0 30px rgba(210, 161, 42, 0.18);
}
```

## Background

Il background deve essere flat e lasciare parlare logo, tipografia e superfici. Evitare fondi pieni di luci decorative.

```css
html {
  min-height: 100%;
  background: var(--bg);
}
```

Evitare gradienti blu/viola dominanti e bagliori decorativi. L'oro deve comparire come accento secco: stato attivo, focus, icona, bordo o bottone primario.

## Layout

La struttura resta vicina al DDS originale:

- shell mobile/tablet max `1180px`;
- desktop max `1480px`;
- app bar fissa;
- mobile bottom nav;
- desktop drawer persistente.

La differenza e' nel carattere visivo: piu' compatto, piu' scuro, piu' deciso.

```css
.app-shell {
  --shell-max-width: 1180px;
  width: min(var(--shell-max-width), 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(82px + env(safe-area-inset-top)) clamp(12px, 2.4vw, 28px) calc(112px + env(safe-area-inset-bottom));
}

@media (min-width: 980px) {
  .app-shell {
    --shell-max-width: 1480px;
    padding-bottom: 36px;
  }
}
```

## Superfici

Le superfici devono sembrare lastre scure con bordo oro molto sottile.

```css
.surface {
  border: 1px solid var(--line);
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255, 217, 92, 0.07), transparent 52%),
    var(--surface-container);
  box-shadow:
    var(--shadow),
    inset 0 1px 0 rgba(255, 240, 173, 0.08);
  backdrop-filter: blur(18px) saturate(1.08);
}
```

Radius consigliati:

- app bar/drawer: `26-28px`;
- cards principali: `24-30px`;
- righe e controlli: `18-22px`;
- icone quadrate: `14-18px`.

## Tipografia

Il logo ha un peso forte e inclinato; l'app deve usare tipografia pulita ma assertiva.

- Titoli: `900-950`, line-height stretta.
- Label: uppercase molto piccole solo per eyebrow/meta.
- Corpo: leggibile, non troppo luminoso.
- Evitare font decorative: lasciare il carattere "sportivo" a forme, tagli e motion.

```css
h1 {
  max-width: 760px;
  margin: 0;
  color: var(--text);
  font-size: clamp(2.4rem, 7vw, 5.4rem);
  line-height: 0.92;
  letter-spacing: 0;
}

.eyebrow {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid rgba(255, 216, 77, 0.28);
  border-radius: 999px;
  color: var(--primary-readable);
  background: rgba(255, 216, 77, 0.1);
  font-size: 0.78rem;
  font-weight: 950;
  text-transform: uppercase;
}
```

## App Bar

App bar piu' solida rispetto al DDS originale.

```css
.app-bar {
  position: fixed;
  z-index: 15;
  top: max(10px, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  width: min(var(--shell-max-width), calc(100% - 20px));
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 8px 10px 8px 12px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 216, 77, 0.07), transparent 50%),
    var(--nav);
  box-shadow: 0 18px 58px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(22px) saturate(1.08);
}
```

## Hamburger e Drawer

Il drawer deve sembrare un pannello tecnico-premium.

- Aperto da sinistra.
- Persistente su desktop.
- Background quasi opaco.
- Stato active con oro pieno.
- Hamburger animato in X con linee oro/bianco.

```css
.desktop-menu-button.open {
  color: var(--on-primary);
  border-color: transparent;
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  box-shadow: 0 14px 32px rgba(255, 206, 68, 0.22);
}

.desktop-menu {
  width: 248px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 216, 77, 0.1), transparent 52%),
    color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 240, 173, 0.08);
}
```

## Cards

Card DDS 2:

- meno "morbide cloud", piu' "pannello premium";
- glow oro solo in alto/lato;
- hover verticale minimo;
- eventuale bordo active oro.

```css
.card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(255, 216, 77, 0.08), transparent 54%),
    color-mix(in srgb, var(--surface-container) 88%, var(--surface) 12%);
  box-shadow: var(--shadow);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 216, 77, 0.32);
  box-shadow:
    var(--shadow),
    0 0 28px rgba(255, 216, 77, 0.12);
}
```

## Taglio Dueffe

Per richiamare la forma inclinata del logo, usare pseudo-elementi diagonali in modo sottile.

```css
.dueffe-cut {
  position: relative;
  overflow: hidden;
}

.dueffe-cut::after {
  content: "";
  position: absolute;
  top: 0;
  right: -36px;
  width: 120px;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 216, 77, 0.14), transparent 62%);
  transform: skewX(-14deg);
  pointer-events: none;
}
```

Usarlo su hero, card importanti, drawer preview e pannelli dashboard.

## Pulsanti

Primario:

```css
.primary {
  color: var(--on-primary);
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  box-shadow: 0 16px 34px rgba(255, 206, 68, 0.22);
}
```

Ghost:

```css
.ghost {
  border: 1px solid var(--line);
  color: var(--text);
  background: color-mix(in srgb, var(--surface-higher) 70%, transparent);
}

.ghost:hover {
  background: color-mix(in srgb, var(--primary) 12%, var(--surface-high));
}
```

## Segmented Control

Segmented control con active oro pieno.

```css
.segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  min-height: 44px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
}

.segment button.active {
  color: var(--on-primary);
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
}
```

## Switch

Gli switch devono sembrare piccoli controlli metallici/illuminati.

```css
.switch-control {
  width: 52px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-high) 82%, transparent);
}

.switch-control.active {
  border-color: rgba(255, 216, 77, 0.48);
  background: rgba(255, 216, 77, 0.16);
  box-shadow: 0 10px 24px rgba(255, 206, 68, 0.14);
}
```

## Form

Input e select:

- altezza `54px`;
- radius `18-20px`;
- bordo oro tenue;
- focus con bordo oro e glow minimo.

```css
input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 20px;
  outline: 0;
  color: var(--text);
  background: color-mix(in srgb, var(--surface-high) 78%, transparent);
}

input:focus,
select:focus,
textarea:focus {
  border-color: rgba(255, 216, 77, 0.46);
  box-shadow: 0 0 0 3px rgba(255, 216, 77, 0.1);
}
```

## Icone

- Usare icone lineari tipo Lucide.
- Icone attive: fondo oro, testo `--on-primary`.
- Icone passive: `--muted`.
- Evitare icone multicolore se non sono loghi brand.

## Stato Vuoto

Lo stato vuoto deve essere piu' deciso rispetto al DDS originale:

- headline forte;
- CTA primaria oro;
- pannello passi con numeri in badge oro;
- logo Dueffe grande ma non invadente.

## Motion

Il movimento deve sembrare rapido e "meccanico-premium":

- hover: `160-180ms`;
- drawer: `220-260ms`;
- modali: `260ms`;
- page enter: `300-330ms`;
- curve principale: `cubic-bezier(0.2, 0.8, 0.2, 1)`.

```css
@keyframes dueffe-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }
}

@keyframes dueffe-drawer {
  from {
    opacity: 0;
    transform: translateX(-20px) scale(0.98);
  }
}
```

Rispettare sempre:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

## Breakpoint

- `980px+`: shell ampia, drawer persistente desktop, app bar larga.
- `860px-`: dashboard e griglie a una colonna.
- `620px-`: modali full-screen, CTA full-width, card compatte.
- `390px-`: ridurre label, padding, font dei controlli.

## Do

- Usare nero/antracite come base.
- Usare oro per azioni e stati attivi.
- Usare glow oro solo per gerarchia.
- Usare tagli diagonali sottili per richiamare il logo.
- Mantenere la UI operativa e scansionabile.

## Don't

- Non usare palette blu/cyan come dominante.
- Non rendere tutto dorato: l'oro deve restare un accento.
- Non usare gradienti chiassosi o arcobaleno.
- Non usare vetro troppo trasparente sopra contenuti complessi.
- Non introdurre font futuristici difficili da leggere.
- Non riempire la pagina di effetti luce.

## Checklist Per App Dueffe-Branded

1. Importa i token DDS 2.
2. Usa background nero con glow oro radiale.
3. Inserisci il logo da `public/dueffe/` nell'app bar.
4. Usa superfici antracite con bordo oro tenue.
5. Usa CTA primarie oro.
6. Usa drawer/card con taglio diagonale leggero.
7. Mantieni testo e dati leggibili prima degli effetti.
8. Verifica contrasto dark e light.
9. Testa mobile sotto `390px`.
10. Riduci motion con `prefers-reduced-motion`.
