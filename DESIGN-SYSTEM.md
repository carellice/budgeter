# DDS (Dueffe Design System)

DDS, Dueffe Design System, e' una guida pratica per ricreare lo stile visivo di Subber in un'altra app: superfici glass ma leggibili, colori freddi con accenti energici, bordi morbidi, movimento leggero e layout pensato prima mobile ma con desktop ampio.

## Principi

- **Locale, calmo, utile**: l'interfaccia deve sembrare personale e affidabile, non promozionale.
- **Superfici morbide**: usare card e pannelli con blur, bordi sottili e ombre profonde ma controllate.
- **Accenti luminosi**: usare primary/secondary per azioni, icone attive, indicatori e highlight.
- **Gerarchia densa ma ariosa**: evitare hero marketing, preferire dashboard e schermate operative con spaziatura costante.
- **Movimento breve**: animazioni rapide, elastiche, mai decorative al punto da rallentare l'uso.

## Token CSS

Usare variabili semantiche, non colori hard-coded nei componenti.

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --bg: #07131f;
  --surface: #102232;
  --surface-high: #173247;
  --surface-higher: #203d54;
  --surface-container: rgba(20, 43, 61, 0.86);
  --text: #f4fbff;
  --muted: #a8c0cf;
  --line: rgba(182, 222, 242, 0.14);
  --primary: #7be8ff;
  --on-primary: #00202a;
  --secondary: #b7f36d;
  --tertiary: #d7b8ff;
  --danger: #ffb4bf;
  --warning: #ffd56a;
  --nav: rgba(9, 24, 36, 0.88);
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
}

:root[data-theme="light"] {
  --bg: #f6fafc;
  --surface: #eaf3f8;
  --surface-high: #dcebf3;
  --surface-higher: #d0e4ef;
  --surface-container: rgba(255, 255, 255, 0.88);
  --text: #101b22;
  --muted: #5f7481;
  --line: rgba(17, 42, 58, 0.12);
  --primary: #00677d;
  --on-primary: #ffffff;
  --secondary: #476900;
  --tertiary: #6750a4;
  --danger: #ba1a1a;
  --warning: #765a00;
  --nav: rgba(255, 255, 255, 0.88);
  --shadow: 0 20px 60px rgba(28, 66, 90, 0.14);
}
```

## Background

Il background dell'app non e' piatto. Usa gradienti radiali molto grandi e sfumati, sempre ancorati ai token.

```css
html {
  min-height: 100%;
  background:
    radial-gradient(circle at 16% -12%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 32rem),
    radial-gradient(circle at 92% 6%, color-mix(in srgb, var(--secondary) 18%, transparent), transparent 28rem),
    radial-gradient(circle at 48% 112%, color-mix(in srgb, var(--tertiary) 18%, transparent), transparent 30rem),
    var(--bg);
}
```

## Layout

- Shell mobile/tablet: max `1180px`.
- Desktop: max `1480px`.
- Safe areas sempre considerate con `env(safe-area-inset-*)`.
- App bar fissa in alto con superficie glass solida.
- Mobile: bottom navigation.
- Desktop: hamburger a sinistra e drawer persistente.

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

Le superfici principali condividono:

- bordo `1px solid var(--line)`;
- background `var(--surface-container)` o mix di surface;
- shadow `var(--shadow)`;
- blur tra `18px` e `24px`;
- radius grande per sezioni, medio per righe, piccolo per controlli interni.

```css
.surface {
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface-container);
  box-shadow: var(--shadow);
  backdrop-filter: blur(22px);
}
```

## Tipografia

- Font: Inter/system stack.
- Titoli grandi: `font-weight: 950`, line-height stretta, letter-spacing `0`.
- Label e small text: peso alto (`800-900`) ma colore muted.
- Evitare testo troppo grande dentro pannelli operativi.

```css
h1 {
  max-width: 720px;
  margin: 0;
  color: var(--text);
  font-size: clamp(2.35rem, 7vw, 5.7rem);
  line-height: 0.94;
  letter-spacing: 0;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}
```

## Componenti

### App Bar

App bar fissa, compatta, con hamburger a sinistra su desktop e brand subito dopo.

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
  background: var(--nav);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(24px) saturate(1.25);
}
```

### Desktop Drawer

Il drawer desktop non e' un overlay effimero: puo' restare aperto mentre si usa l'app.

- Larghezza: circa `248px`.
- Entra da sinistra con `translateX`.
- Background piu' opaco del resto, per leggibilita'.
- Quando aperto, il contenuto puo' ricevere padding a sinistra.

### Bottom Navigation

Solo mobile/tablet. Deve avere indicatore animato, quattro item massimo, icona sopra label.

### Cards

Card operative:

- radius `26-34px`;
- padding `18-26px`;
- hover con `translateY(-2px)`;
- focus visibile con inset shadow primary.

```css
.card {
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface-container);
  box-shadow: var(--shadow);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.card:hover {
  transform: translateY(-2px);
}
```

### Settings Row

Righe di impostazione:

- grid `auto 1fr auto`;
- altezza minima `72px`;
- icona in superficie quadrata `46px`;
- testo principale bold, descrizione muted;
- per controlli complessi usare una terza colonna, non infilare il controllo sotto a caso.

### Segmented Control

Usarlo per scelte mutualmente esclusive come tema, modalità, filtri rapidi.

```css
.segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  min-height: 44px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--text) 4%, transparent), transparent),
    color-mix(in srgb, var(--surface) 72%, transparent);
}

.segment button.active {
  color: var(--on-primary);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--primary) 18%, transparent);
}
```

### Buttons

Primario:

- gradient primary -> secondary;
- testo `var(--on-primary)`;
- radius `18px` o pill;
- shadow colorata leggera.

Secondario/ghost:

- bordo `var(--line)`;
- background `surface-higher`;
- hover con mix primary.

### Forms

- input altezza minima `54px`;
- radius `20px`;
- bordo sottile;
- background `surface-high` semi-opaco;
- label bold con gap `7px`.

## Icone

Usare icone lineari stile Lucide:

- `20-22px` nella navigazione;
- `18px` nei pulsanti;
- `16px` nei controlli compatti;
- icone attive su background gradient primary/secondary.

## Stati Vuoti

Gli stati vuoti non devono mostrare metriche a zero. Devono guidare.

Struttura consigliata:

- eyebrow contestuale;
- titolo operativo;
- descrizione corta;
- CTA primaria;
- CTA secondaria;
- pannello con 2-3 passi.

## Animazioni

Durate:

- hover: `160-180ms`;
- ingresso pagina: `330ms`;
- drawer/menu: `190-240ms`;
- modali/sheet: `260-330ms`.

Curve:

```css
--ease-subber: cubic-bezier(0.2, 0.8, 0.2, 1);
```

Pattern:

```css
@keyframes page-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

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

- `980px+`: desktop ampio, drawer hamburger, niente bottom nav.
- `860px-`: layout a colonna singola per dashboard e griglie.
- `620px-`: modal full-screen, CTA a tutta larghezza, card piu' compatte.
- `390px-`: ridurre label e padding nei controlli compatti.

## Cose Da Evitare

- Palette monocromatica solo blu/viola: gli accenti secondary e tertiary devono comparire.
- Testi grandi dentro controlli piccoli.
- Menu e pannelli troppo trasparenti quando sopra contenuti ricchi.
- Card annidate dentro altre card.
- Landing page o hero marketing se l'app e' uno strumento operativo.
- Animazioni lunghe o continue tranne micro-decorazioni leggere.

## Checklist Per Una Nuova App

1. Copia i token `:root` e `:root[data-theme="light"]`.
2. Imposta background radiale sul `html`.
3. Usa `.app-shell` con max-width desktop ampio.
4. Crea app bar glass con brand e navigazione coerente.
5. Definisci card, row, button, input e segmented control dai pattern sopra.
6. Aggiungi stati vuoti guidati prima di dashboard numeriche.
7. Usa animazioni brevi e rispetta `prefers-reduced-motion`.
8. Verifica mobile, desktop e testi lunghi.
