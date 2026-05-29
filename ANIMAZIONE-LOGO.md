# Animazione Logo App Bar

Questo documento spiega come riprodurre l'animazione del brand nella app bar di Health.

L'animazione vive in:

- `src/components/layout/Header.jsx`
- `src/index.css`
- asset logo in `public/dueffe/logo dueffe light.png` e `public/dueffe/logo dueffe dark.png`
- font in `public/fonts/AutopromPro-BlackRoundedItalic.otf`

## Comportamento

All'apertura dell'app, il brand nella app bar mostra:

```txt
due [logo dueffe] e
```

Dopo circa `1800ms`, il brand passa allo stato compatto:

```txt
[logo dueffe] Health
```

La transizione non sposta il logo: sono i testi laterali `due` ed `e` che collassano verso il centro, diventano trasparenti e liberano spazio. Nello stesso momento, la scritta `Health`, inizialmente invisibile, si apre verso destra.

## Logica React

Nel componente `Header.jsx` serve uno stato booleano che diventa `true` dopo un timer:

```jsx
const [brandCompact, setBrandCompact] = useState(false)

useEffect(() => {
  const t = setTimeout(() => setBrandCompact(true), 1800)
  return () => clearTimeout(t)
}, [])
```

La classe `is-compact` viene aggiunta al wrapper del brand quando il timer e' scaduto:

```jsx
<div
  className={`header-brand${brandCompact ? ' is-compact' : ''}`}
  role="img"
  aria-label="Health"
>
  <span className="brand-text brand-text-left" aria-hidden="true">due</span>
  <img src="/dueffe/logo dueffe light.png" alt="" className="brand-logo brand-logo-light" />
  <img src="/dueffe/logo dueffe dark.png" alt="" className="brand-logo brand-logo-dark" />
  <span className="brand-text brand-text-right" aria-hidden="true">e</span>
  <span className="brand-text brand-text-health" aria-hidden="true">Health</span>
</div>
```

Note importanti:

- Il wrapper ha `aria-label="Health"` per dare un nome accessibile unico.
- Le parti decorative hanno `aria-hidden="true"`.
- I due loghi sono entrambi nel DOM; il CSS sceglie quale mostrare in base al tema.
- Il logo deve avere `flex-shrink: 0`, cosi' non viene compresso durante il collasso del testo.

## CSS Base

Il wrapper deve essere una riga flex senza gap reale. La vicinanza fra testo e logo e' controllata con margin negativi, per compensare le forme inclinate del font.

```css
.header-brand {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
  height: 36px;
  margin-right: auto;
  padding-left: 0;
  user-select: none;
  -webkit-user-select: none;
  transition: padding-left 380ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.header-brand.is-compact {
  padding-left: 10px;
}
```

## Testi Animati

Tutte le parti testuali condividono font, overflow nascosto e transizioni. L'animazione principale usa `max-width`, `opacity` e `transform`.

```css
.header-brand .brand-text {
  font-family: 'AutopromPro Black Rounded Italic', Georgia, serif;
  font-weight: 900;
  font-style: italic;
  font-size: 1.4rem;
  line-height: 1;
  letter-spacing: -0.01em;
  color: #f4fbff !important;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
  opacity: 1;
  transition:
    max-width 380ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1),
    margin 380ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

[data-theme="light"] .header-brand .brand-text {
  color: #101b22 !important;
}
```

Per evitare clipping sulle lettere inclinate:

```css
.brand-text-left {
  padding-right: 4px;
}

.brand-text-right,
.brand-text-health {
  padding-right: 6px;
}

.brand-text-right {
  margin-left: -3px;
}
```

## Logo

Il logo rimane stabile durante tutta l'animazione:

```css
.brand-logo {
  height: 36px;
  width: 36px;
  flex-shrink: 0;
  object-fit: contain;
  margin-left: -9px;
  margin-right: -5px;
}
```

Switch tema:

```css
.brand-logo-dark {
  display: none;
}

[data-theme="dark"] .brand-logo-light {
  display: none;
}

[data-theme="dark"] .brand-logo-dark {
  display: block;
}

[data-theme="light"] .brand-logo-light {
  display: block;
}

[data-theme="light"] .brand-logo-dark {
  display: none;
}
```

## Stato Iniziale e Stato Compatto

La scritta `Health` parte chiusa:

```css
.header-brand .brand-text-health {
  max-width: 0;
  opacity: 0;
  margin-left: 6px;
}
```

Quando arriva `is-compact`:

```css
.header-brand.is-compact .brand-text {
  max-width: 0;
  opacity: 0;
}

.header-brand.is-compact .brand-text-health {
  max-width: 140px;
  opacity: 1;
}

.header-brand.is-compact .brand-text-left {
  transform: translateX(6px);
}

.header-brand.is-compact .brand-text-right {
  transform: translateX(-6px);
}
```

Perche' funziona:

- `due` ed `e` perdono larghezza con `max-width: 0`.
- `opacity: 0` evita che il testo sembri tagliato durante il collasso.
- `translateX(...)` fa convergere i testi verso il logo, rendendo l'animazione piu' naturale.
- `Health` fa l'operazione opposta: da `max-width: 0` passa a `max-width: 140px`.

## Accessibilita' e Reduced Motion

Per utenti con riduzione movimento attiva, annullare o quasi annullare la transizione:

```css
@media (prefers-reduced-motion: reduce) {
  .brand-text {
    transition-duration: 0ms;
  }
}
```

## Checklist Per Riprodurla

1. Caricare il font `AutopromPro-BlackRoundedItalic.otf` con `@font-face`.
2. Renderizzare il brand con quattro elementi: `due`, logo light/dark, `e`, `Health`.
3. Tenere il logo a dimensione fissa e con `flex-shrink: 0`.
4. Dare ai testi `overflow: hidden`, `white-space: nowrap` e una `max-width` animabile.
5. Dopo `1800ms`, aggiungere la classe `is-compact`.
6. In `is-compact`, chiudere `due` ed `e`, aprire `Health`.
7. Usare easing `cubic-bezier(0.2, 0.8, 0.2, 1)` e durata intorno a `380ms`.
8. Testare sia tema light che dark.
