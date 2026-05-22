import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileUp,
  Maximize2,
  Menu,
  Palette,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  Tags,
  Target,
  Trash2,
  Wallet,
  X
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const STORAGE_KEY = "budgeter:data:v1";
const THEME_KEY = "budgeter:theme";
const CATEGORY_STORAGE_KEY = "budgeter:categories:v1";
const CATEGORY_DEFAULTS_STORAGE_KEY = "budgeter:category-defaults:v1";
const CATEGORIES_DEFAULTS_PRUNED_KEY = "budgeter:categories-defaults-pruned:v1";

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre"
];

const TYPES = ["Ingresso", "Necessario", "Sfizio"];

const TYPE_META = {
  Ingresso: { label: "Ingressi e Risparmi", color: "var(--secondary)", icon: Wallet },
  Necessario: { label: "Necessari", color: "var(--primary)", icon: ShieldCheck },
  Sfizio: { label: "Sfizi", color: "var(--tertiary)", icon: Sparkles }
};

const LEGACY_FLOW_CATEGORIES = [
  "Stipendio",
  "Freelance",
  "Bonus",
  "Rimborsi",
  "Interessi",
  "Regalo",
  "Risparmio",
  "Fondo emergenza",
  "Investimenti",
  "Pensione",
  "Vacanze",
  "Obiettivo casa",
  "Debiti",
  "Altro ingresso o risparmio"
];

const LEGACY_DEFAULT_CATEGORY_OPTIONS = {
  Ingresso: LEGACY_FLOW_CATEGORIES,
  Necessario: [
    "Affitto",
    "Mutuo",
    "Bollette",
    "Spesa",
    "Trasporti",
    "Assicurazioni",
    "Salute",
    "Tasse",
    "Abbonamenti essenziali",
    "Scuola",
    "Altro necessario"
  ],
  Sfizio: [
    "Pasto fuori",
    "Bar",
    "Shopping",
    "Viaggi",
    "Intrattenimento",
    "Sport",
    "Regali",
    "Hobby",
    "Altro sfizio"
  ]
};

const EMPTY_CATEGORY_OPTIONS = TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {});
const LEGACY_DEFAULT_CATEGORY_SETS = TYPES.reduce(
  (acc, type) => ({ ...acc, [type]: new Set(LEGACY_DEFAULT_CATEGORY_OPTIONS[type] ?? []) }),
  {}
);

const CATEGORY_GROUPS = [
  {
    key: "IngressoRisparmio",
    label: "Ingressi e Risparmi",
    types: ["Ingresso"],
    color: "var(--secondary)"
  },
  {
    key: "Necessario",
    label: TYPE_META.Necessario.label,
    types: ["Necessario"],
    color: TYPE_META.Necessario.color
  },
  {
    key: "Sfizio",
    label: TYPE_META.Sfizio.label,
    types: ["Sfizio"],
    color: TYPE_META.Sfizio.color
  }
];

const BUDGET_TYPE_GROUPS = [
  {
    label: "Movimenti",
    options: [
      { value: "Ingresso", label: "Entrata o risparmio" },
      { value: "Necessario", label: "Necessario" },
      { value: "Sfizio", label: "Sfizio" }
    ]
  }
];

const VIEW_ITEMS = [
  { id: "budget", label: "Budget", icon: Table2 },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "categories", label: "Categorie", icon: Tags },
  { id: "settings", label: "Impostazioni", icon: Settings }
];

const formatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentDateParts() {
  const now = new Date();
  return { year: now.getFullYear(), month: MONTHS[now.getMonth()] };
}

function numberValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberInputValue(value) {
  const amount = numberValue(value);
  return amount === 0 ? "" : String(amount);
}

function categoryKey(type, category) {
  return `${type}::${category}`;
}

function categoryDefaultValue(categoryDefaults, type, category) {
  return numberValue(categoryDefaults[categoryKey(type, category)]);
}

function normalizeMovement(item) {
  return {
    id: typeof item?.id === "string" ? item.id : uid(),
    descrizione: item?.descrizione ?? item?.desc ?? "",
    importo: numberValue(item?.importo ?? item?.amount ?? item?.valore)
  };
}

function actualValue(row) {
  if (Array.isArray(row?.movimenti)) {
    return row.movimenti.reduce((sum, movement) => sum + numberValue(movement.importo), 0);
  }
  return numberValue(row?.effettivo);
}

function defaultCategory(type, categoryOptions = EMPTY_CATEGORY_OPTIONS) {
  return categoryOptions[type]?.[0] ?? "";
}

function categoryOptionsFor(row, categoryOptions) {
  const options = categoryOptions[row.tipo] ?? [];
  if (row.descrizione && !options.includes(row.descrizione)) {
    return [row.descrizione, ...options];
  }
  return options;
}

function categoryTargetTypes(key) {
  const group = CATEGORY_GROUPS.find((item) => item.key === key);
  return group?.types ?? [key];
}

function categoryGroupOptions(group, categoryOptions) {
  return [...(categoryOptions[group.types[0]] ?? [])].sort((a, b) =>
    a.localeCompare(b, "it-IT", { sensitivity: "base" })
  );
}

function nextCategoryForType(row, nextType, categoryOptions) {
  const nextOptions = categoryOptions[nextType] ?? [];
  if (nextOptions.includes(row.descrizione)) return row.descrizione;

  const currentIsPreset = (categoryOptions[row.tipo] ?? []).includes(row.descrizione);
  return currentIsPreset ? defaultCategory(nextType, categoryOptions) : row.descrizione;
}

function normalizeCategoryOptions(input) {
  const next = { ...EMPTY_CATEGORY_OPTIONS };

  if (!input || typeof input !== "object" || Array.isArray(input)) return next;

  const sourceVersion = Number(input.__version ?? 0);
  const customMode = input.__customMode === true;

  TYPES.forEach((type) => {
    if (!Array.isArray(input[type])) return;
    const clean = input[type].map((category) => String(category).trim()).filter(Boolean);
    const legacyDefaults =
      !customMode && sourceVersion < 5 ? LEGACY_DEFAULT_CATEGORY_SETS[type] : new Set();
    next[type] = Array.from(new Set(clean.filter((category) => !legacyDefaults.has(category))));
  });

  const legacySavings = Array.isArray(input?.Risparmio)
    ? input.Risparmio.map((category) => String(category).trim()).filter(Boolean)
    : [];
  const legacyFlowDefaults = !customMode && sourceVersion < 5 ? LEGACY_DEFAULT_CATEGORY_SETS.Ingresso : new Set();
  next.Ingresso = Array.from(
    new Set([
      ...(next.Ingresso ?? []),
      ...legacySavings.filter((category) => !legacyFlowDefaults.has(category))
    ])
  );

  return next;
}

function pruneLegacyDefaultCategories(categoryOptions) {
  return TYPES.reduce((acc, type) => {
    const options = categoryOptions[type] ?? [];
    acc[type] = options.filter((category) => !LEGACY_DEFAULT_CATEGORY_SETS[type].has(category));
    return acc;
  }, {});
}

function normalizeCategoryDefaults(input) {
  const values = input?.values && typeof input.values === "object" ? input.values : input;
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};

  return Object.entries(values).reduce((acc, [key, value]) => {
    const amount = numberValue(value);
    if (amount > 0) acc[key] = amount;
    return acc;
  }, {});
}

function normalizeTransaction(item) {
  const tipo = item?.tipo === "Risparmio" ? "Ingresso" : TYPES.includes(item?.tipo) ? item.tipo : "Necessario";
  const descrizione = item?.descrizione ?? item?.desc ?? "";
  const legacyActual = numberValue(item?.effettivo);
  const movimenti = Array.isArray(item?.movimenti)
    ? item.movimenti.map(normalizeMovement)
    : legacyActual > 0
      ? [{ id: uid(), descrizione: "Registrato", importo: legacyActual }]
      : [];

  return {
    id: typeof item?.id === "string" ? item.id : uid(),
    descrizione: descrizione || defaultCategory(tipo),
    tipo,
    atteso: numberValue(item?.atteso),
    effettivo: movimenti.reduce((sum, movement) => sum + movement.importo, 0),
    movimenti,
    note: item?.note ?? ""
  };
}

function normalizeDatabase(input) {
  const next = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) return next;

  Object.entries(input).forEach(([year, months]) => {
    if (!months || typeof months !== "object" || Array.isArray(months)) return;
    next[year] = {};

    Object.entries(months).forEach(([month, rows]) => {
      if (!MONTHS.includes(month) || !Array.isArray(rows)) return;
      next[year][month] = rows.map(normalizeTransaction);
    });
  });

  return next;
}

function getMonthRows(database, year, month) {
  return database?.[String(year)]?.[month] ?? [];
}

function computeTotals(rows) {
  return TYPES.reduce((acc, type) => {
    acc[type] = rows
      .filter((row) => row.tipo === type)
      .reduce(
        (sum, row) => ({
          atteso: sum.atteso + numberValue(row.atteso),
          effettivo: sum.effettivo + actualValue(row)
        }),
        { atteso: 0, effettivo: 0 }
      );
    return acc;
  }, {});
}

function computeMargin(totals, field) {
  return totals.Ingresso[field] - totals.Necessario[field] - totals.Sfizio[field];
}

function mergeDatabases(base, incoming) {
  const next = structuredClone(base);

  Object.entries(incoming).forEach(([year, months]) => {
    if (!next[year]) next[year] = {};

    Object.entries(months).forEach(([month, rows]) => {
      const existing = next[year][month] ?? [];
      const byId = new Map(existing.map((row) => [row.id, row]));
      rows.forEach((row) => byId.set(row.id, row));
      next[year][month] = Array.from(byId.values());
    });
  });

  return next;
}

function scrollToTop() {
  try {
    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    if (typeof document.documentElement.scrollTo === "function") {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    if (typeof document.body.scrollTo === "function") {
      document.body.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch {
    // Some embedded browser sandboxes expose scroll state as read-only.
  }
}

function App() {
  const today = currentDateParts();
  const [database, setDatabase] = useState({});
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [activeView, setActiveView] = useState("budget");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? "auto");
  const [categoryOptions, setCategoryOptions] = useState(() => {
    try {
      return normalizeCategoryOptions(JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY)));
    } catch {
      return normalizeCategoryOptions();
    }
  });
  const [categoryDefaults, setCategoryDefaults] = useState(() => {
    try {
      return normalizeCategoryDefaults(JSON.parse(localStorage.getItem(CATEGORY_DEFAULTS_STORAGE_KEY)));
    } catch {
      return {};
    }
  });
  const [legacyCategoriesPruned, setLegacyCategoriesPruned] = useState(
    () => localStorage.getItem(CATEGORIES_DEFAULTS_PRUNED_KEY) === "true"
  );
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef(null);
  const showPeriodControls = activeView === "budget";
  const isCurrentPeriod = selectedMonth === today.month && selectedYear === today.year;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDatabase(normalizeDatabase(JSON.parse(stored)));
      } catch {
        setDatabase({});
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const resolvedTheme = theme === "auto" ? (query?.matches ? "light" : "dark") : theme;
      document.documentElement.dataset.theme = resolvedTheme;
    };

    applyTheme();
    localStorage.setItem(THEME_KEY, theme);

    if (theme !== "auto" || !query) return undefined;
    query.addEventListener?.("change", applyTheme);
    return () => query.removeEventListener?.("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if (legacyCategoriesPruned) return;
    setCategoryOptions((current) => pruneLegacyDefaultCategories(current));
    localStorage.setItem(CATEGORIES_DEFAULTS_PRUNED_KEY, "true");
    setLegacyCategoriesPruned(true);
  }, [legacyCategoriesPruned]);

  useEffect(() => {
    const optionsToSave = legacyCategoriesPruned
      ? categoryOptions
      : pruneLegacyDefaultCategories(categoryOptions);
    localStorage.setItem(
      CATEGORY_STORAGE_KEY,
      JSON.stringify({ __version: 5, __customMode: true, ...optionsToSave })
    );
  }, [categoryOptions, legacyCategoriesPruned]);

  useEffect(() => {
    localStorage.setItem(
      CATEGORY_DEFAULTS_STORAGE_KEY,
      JSON.stringify({ __version: 1, values: categoryDefaults })
    );
  }, [categoryDefaults]);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  }, [database, isReady]);

  useEffect(() => {
    requestAnimationFrame(scrollToTop);
  }, [activeView, selectedMonth, selectedYear]);

  const yearOptions = useMemo(() => {
    const storedYears = Object.keys(database).map(Number).filter(Number.isFinite);
    const base = selectedYear || today.year;
    return Array.from(new Set([base - 1, base, base + 1, today.year, ...storedYears]))
      .sort((a, b) => a - b);
  }, [database, selectedYear, today.year]);

  const rows = useMemo(
    () => getMonthRows(database, selectedYear, selectedMonth),
    [database, selectedYear, selectedMonth]
  );

  const totals = useMemo(() => computeTotals(rows), [rows]);
  const hasRows = rows.length > 0;
  const expectedMargin = computeMargin(totals, "atteso");
  const actualMargin = computeMargin(totals, "effettivo");

  const dashboardData = useMemo(() => {
    return TYPES.reduce((acc, type) => {
      acc[type] = MONTHS.map((month) => {
        const monthTotals = computeTotals(getMonthRows(database, selectedYear, month));
        return {
          month: month.slice(0, 3),
          Atteso: monthTotals[type].atteso,
          Effettivo: monthTotals[type].effettivo
        };
      });
      return acc;
    }, {});
  }, [database, selectedYear]);

  function setRows(updater) {
    setDatabase((current) => {
      const year = String(selectedYear);
      const previousRows = current?.[year]?.[selectedMonth] ?? [];
      const nextRows = typeof updater === "function" ? updater(previousRows) : updater;

      return {
        ...current,
        [year]: {
          ...(current[year] ?? {}),
          [selectedMonth]: nextRows
        }
      };
    });
  }

  function addRow(type = "Necessario") {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: uid(),
        descrizione: defaultCategory(type, categoryOptions),
        tipo: type,
        atteso: 0,
        effettivo: 0,
        movimenti: [],
        note: ""
      }
    ]);
  }

  function setCategoryExpected(type, category, atteso) {
    setRows((currentRows) => {
      const matchIndexes = currentRows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.tipo === type && row.descrizione === category)
        .map(({ index }) => index);

      if (matchIndexes.length === 0) {
        return [
          ...currentRows,
          {
            id: uid(),
            descrizione: category,
            tipo: type,
            atteso,
            effettivo: 0,
            movimenti: [],
            note: ""
          }
        ];
      }

      const [primaryIndex, ...duplicateIndexes] = matchIndexes;
      return currentRows.map((row, index) => {
        if (index === primaryIndex) return { ...row, atteso };
        if (duplicateIndexes.includes(index)) return { ...row, atteso: 0 };
        return row;
      });
    });
  }

  function addCategoryMovement(type, category, movement) {
    const amount = numberValue(movement.importo);
    if (amount <= 0) return;

    setRows((currentRows) => {
      const index = currentRows.findIndex(
        (row) => row.tipo === type && row.descrizione === category
      );
      const newMovement = {
        id: uid(),
        descrizione: movement.descrizione.trim(),
        importo: amount
      };

      if (index < 0) {
        return [
          ...currentRows,
          {
            id: uid(),
            descrizione: category,
            tipo: type,
            atteso: 0,
            effettivo: amount,
            movimenti: [newMovement],
            note: ""
          }
        ];
      }

      return currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const movimenti = [...(row.movimenti ?? []), newMovement];
        return { ...row, movimenti, effettivo: movimenti.reduce((sum, item) => sum + item.importo, 0) };
      });
    });
  }

  function deleteCategoryMovement(rowId, movementId) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) return row;
        const movimenti = (row.movimenti ?? []).filter((movement) => movement.id !== movementId);
        return { ...row, movimenti, effettivo: movimenti.reduce((sum, item) => sum + item.importo, 0) };
      })
    );
  }

  function updateRow(id, patch) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function deleteRow(id) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  }

  function copyRowToYear(row) {
    setDatabase((current) => {
      const year = String(selectedYear);
      const nextYear = { ...(current[year] ?? {}) };

      MONTHS.forEach((month) => {
        const rowsForMonth = [...(nextYear[month] ?? [])];
        const matchIndex = rowsForMonth.findIndex(
          (item) =>
            item.descrizione.trim().toLowerCase() === row.descrizione.trim().toLowerCase() &&
            item.tipo === row.tipo
        );
        const copy = { ...row, id: month === selectedMonth ? row.id : uid() };

        if (matchIndex >= 0) {
          rowsForMonth[matchIndex] = {
            ...rowsForMonth[matchIndex],
            descrizione: row.descrizione,
            tipo: row.tipo,
            atteso: row.atteso,
            effettivo: row.effettivo,
            movimenti: row.movimenti ?? [],
            note: row.note
          };
        } else {
          rowsForMonth.push(copy);
        }

        nextYear[month] = rowsForMonth;
      });

      return { ...current, [year]: nextYear };
    });
  }

  function shiftMonth(direction) {
    const index = MONTHS.indexOf(selectedMonth);
    const nextIndex = index + direction;

    if (nextIndex < 0) {
      setSelectedYear((year) => year - 1);
      setSelectedMonth(MONTHS[11]);
      return;
    }

    if (nextIndex > 11) {
      setSelectedYear((year) => year + 1);
      setSelectedMonth(MONTHS[0]);
      return;
    }

    setSelectedMonth(MONTHS[nextIndex]);
  }

  function goToCurrentPeriod() {
    setSelectedMonth(today.month);
    setSelectedYear(today.year);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(database, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budgeter-${selectedYear}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = normalizeDatabase(JSON.parse(String(reader.result)));
        const mode = window.confirm(
          "Premi OK per unire i dati importati. Premi Annulla per sostituire tutto il database locale."
        );
        setDatabase((current) => (mode ? mergeDatabases(current, incoming) : incoming));
      } catch {
        window.alert("File JSON non valido.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function clearData() {
    if (window.confirm("Vuoi cancellare definitivamente tutti i dati locali di Budgeter?")) {
      setDatabase({});
    }
  }

  function addCategory(type, value) {
    const category = value.trim();
    if (!category) return false;
    const targetTypes = categoryTargetTypes(type);
    const currentOptions = targetTypes.flatMap((targetType) => categoryOptions[targetType] ?? []);
    const alreadyExists = currentOptions.some(
      (item) => item.toLocaleLowerCase("it-IT") === category.toLocaleLowerCase("it-IT")
    );

    if (alreadyExists) return false;

    setCategoryOptions((current) => {
      const next = { ...current };
      targetTypes.forEach((targetType) => {
        next[targetType] = [...(current[targetType] ?? []), category];
      });

      return {
        ...next
      };
    });

    return true;
  }

  function setCategoryDefaultExpected(type, category, value) {
    const amount = numberValue(value);
    setCategoryDefaults((current) => {
      const key = categoryKey(type, category);
      const next = { ...current };
      if (amount > 0) {
        next[key] = amount;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function removeCategory(type, category) {
    const targetTypes = categoryTargetTypes(type);

    setCategoryOptions((current) => {
      const next = { ...current };
      targetTypes.forEach((targetType) => {
        next[targetType] = (current[targetType] ?? []).filter((item) => item !== category);
      });

      return next;
    });

    setCategoryDefaults((current) => {
      const next = { ...current };
      targetTypes.forEach((targetType) => {
        delete next[categoryKey(targetType, category)];
      });
      return next;
    });
  }

  function resetCategories() {
    if (window.confirm("Vuoi ripristinare le categorie predefinite?")) {
      setCategoryOptions(normalizeCategoryOptions());
      setCategoryDefaults({});
    }
  }

  return (
    <>
      <header className="app-bar">
        <button className="icon-button desktop-only" onClick={() => setDrawerOpen(true)} aria-label="Apri menu">
          <Menu size={20} />
        </button>
        <div className="brand">
          <img src="/logo.png" alt="" />
          <div>
            <strong>Budgeter</strong>
            <span>Dati solo locali</span>
          </div>
        </div>
        <div className="app-bar-spacer" />
        {showPeriodControls && (
          <div className={`period-picker appbar-period desktop-period-picker ${!isCurrentPeriod ? "away" : ""}`}>
            <div className={`desktop-current-period-slot ${!isCurrentPeriod ? "visible" : ""}`}>
              {!isCurrentPeriod && (
                <button className="ghost-button current-period-button" onClick={goToCurrentPeriod}>
                  <CalendarDays size={18} />
                  Mese corrente
                </button>
              )}
            </div>
            <button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Mese precedente">
              <ChevronLeft size={18} />
            </button>
            <div className="desktop-period-fields" aria-label="Periodo selezionato">
              <label className="period-field period-field-month">
                <span>Mese</span>
                <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} aria-label="Mese">
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
              <label className="period-field period-field-year">
                <span>Anno</span>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  aria-label="Anno"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Mese successivo">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </header>

      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <div className="brand">
            <img src="/logo.png" alt="" />
            <div>
              <strong>Budgeter</strong>
              <span>Menu</span>
            </div>
          </div>
          <button className="icon-button" onClick={() => setDrawerOpen(false)} aria-label="Chiudi menu">
            <X size={18} />
          </button>
        </div>
        <NavItems activeView={activeView} setActiveView={setActiveView} close={() => setDrawerOpen(false)} />
      </aside>
      {drawerOpen && <button className="scrim" onClick={() => setDrawerOpen(false)} aria-label="Chiudi menu" />}

      <main className="app-shell">
        {showPeriodControls && (
          <section className="mobile-period surface">
            <button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Mese precedente">
              <ChevronLeft size={18} />
            </button>
            <div>
              <span>Periodo</span>
              <strong>
                {selectedMonth} {selectedYear}
              </strong>
            </div>
            <button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Mese successivo">
              <ChevronRight size={18} />
            </button>
            {!isCurrentPeriod && (
              <button className="ghost-button current-period-button" onClick={goToCurrentPeriod}>
                <CalendarDays size={18} />
                Mese corrente
              </button>
            )}
          </section>
        )}

        {activeView === "budget" && (
          <BudgetView
            rows={rows}
            totals={totals}
            expectedMargin={expectedMargin}
            actualMargin={actualMargin}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            categoryOptions={categoryOptions}
            categoryDefaults={categoryDefaults}
            setCategoryExpected={setCategoryExpected}
            addCategoryMovement={addCategoryMovement}
            deleteCategoryMovement={deleteCategoryMovement}
          />
        )}

        {activeView === "dashboard" && (
          <DashboardView
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            yearOptions={yearOptions}
            dashboardData={dashboardData}
          />
        )}

        {activeView === "categories" && (
          <CategoriesView
            categoryOptions={categoryOptions}
            categoryDefaults={categoryDefaults}
            addCategory={addCategory}
            removeCategory={removeCategory}
            setCategoryDefaultExpected={setCategoryDefaultExpected}
          />
        )}

        {activeView === "settings" && (
          <SettingsView
            database={database}
            theme={theme}
            setTheme={setTheme}
            exportData={exportData}
            importData={importData}
            clearData={clearData}
            fileInputRef={fileInputRef}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <NavItems activeView={activeView} setActiveView={setActiveView} compact />
      </nav>
    </>
  );
}

function NavItems({ activeView, setActiveView, close, compact = false }) {
  const activeIndex = Math.max(
    0,
    VIEW_ITEMS.findIndex((item) => item.id === activeView)
  );

  return (
    <div
      className={compact ? "nav-items compact" : "nav-items"}
      style={compact ? { "--active-index": activeIndex } : undefined}
    >
      {VIEW_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            className={active ? "active" : ""}
            onClick={() => {
              setActiveView(item.id);
              scrollToTop();
              close?.();
            }}
          >
            <span>
              <Icon size={compact ? 20 : 19} />
            </span>
            <strong>{item.label}</strong>
          </button>
        );
      })}
    </div>
  );
}

function categoriesForBudgetType(type, categoryOptions, rows) {
  return Array.from(
    new Set([
      ...(categoryOptions[type] ?? []),
      ...rows
        .filter((row) => row.tipo === type && row.descrizione && hasMeaningfulBudgetRow(row))
        .map((row) => row.descrizione)
    ])
  ).sort((a, b) => a.localeCompare(b, "it-IT", { sensitivity: "base" }));
}

function hasMeaningfulBudgetRow(row) {
  return numberValue(row.atteso) > 0 || actualValue(row) > 0 || (row.movimenti ?? []).length > 0;
}

function getCategoryBudget(rows, type, category) {
  const matches = rows.filter((row) => row.tipo === type && row.descrizione === category);
  const movements = matches.flatMap((row) =>
    (row.movimenti ?? []).map((movement) => ({ ...movement, rowId: row.id }))
  );

  return {
    id: matches[0]?.id,
    tipo: type,
    descrizione: category,
    atteso: matches.reduce((sum, row) => sum + numberValue(row.atteso), 0),
    effettivo: movements.reduce((sum, movement) => sum + numberValue(movement.importo), 0),
    movimenti: movements
  };
}

function BudgetView({
  rows,
  totals,
  selectedMonth,
  selectedYear,
  categoryOptions,
  categoryDefaults,
  setCategoryExpected,
  addCategoryMovement,
  deleteCategoryMovement
}) {
  const [openTypes, setOpenTypes] = useState({});
  const [categoryQueries, setCategoryQueries] = useState({});
  const [collapseToken, setCollapseToken] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const hasOpenAccordions = TYPES.some((type) => openTypes[type]);
  const guideItems = useMemo(
    () =>
      TYPES.flatMap((type) =>
        categoriesForBudgetType(type, categoryOptions, rows).map((category) => ({
          type,
          category
        }))
      ),
    [categoryOptions, rows]
  );

  function toggleType(type) {
    setOpenTypes((current) => ({ ...current, [type]: !current[type] }));
  }

  function collapseAll() {
    setOpenTypes({});
    setCollapseToken((current) => current + 1);
  }

  return (
    <div className="page-grid">
      <section className="card editor-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Budget operativo</span>
            <h1>
              {selectedMonth} {selectedYear}
            </h1>
          </div>
          {hasOpenAccordions && (
            <button className="primary-button" onClick={collapseAll}>
              <X size={18} />
              Collassa
            </button>
          )}
        </div>

        <section className={`budget-prep ${guideOpen ? "open" : ""}`}>
          {!guideOpen ? (
            <>
              <div className="budget-prep-copy">
                <div className="expected-guide-icon">
                  <Target size={22} />
                </div>
                <div>
                  <span className="eyebrow">Prepara il budget</span>
                  <strong>Prepara il budget di {selectedMonth}</strong>
                  <p>
                    La guida ti accompagna categoria per categoria: puoi confermare il valore di default
                    o scrivere un importo diverso solo per questo mese.
                  </p>
                </div>
              </div>
              <button className="primary-button" onClick={() => setGuideOpen(true)}>
                <CalendarDays size={18} />
                Avvia guida attesi
              </button>
            </>
          ) : (
            <ExpectedGuide
              items={guideItems}
              rows={rows}
              categoryDefaults={categoryDefaults}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              setCategoryExpected={setCategoryExpected}
              onClose={() => setGuideOpen(false)}
            />
          )}
        </section>

        <div className="budget-accordion-list">
          {TYPES.map((type) => {
            const isOpen = !!openTypes[type];
            const typeTotals = totals[type];
            const categories = categoriesForBudgetType(type, categoryOptions, rows);
            const query = categoryQueries[type] ?? "";
            const filteredCategories = categories.filter((category) =>
              category.toLocaleLowerCase("it-IT").includes(query.trim().toLocaleLowerCase("it-IT"))
            );
            const TypeIcon = TYPE_META[type].icon;

            return (
              <article
                className={`budget-accordion ${isOpen ? "open" : ""}`}
                key={type}
                style={{ "--accent": TYPE_META[type].color }}
              >
                <button className="budget-accordion-trigger" onClick={() => toggleType(type)}>
                  <div className="metric-icon">
                    <TypeIcon size={21} />
                  </div>
                  <div>
                    <span className="eyebrow">{TYPE_META[type].label}</span>
                    <strong>{filteredCategories.length} categorie</strong>
                  </div>
                  <div className="budget-accordion-totals">
                    <span>
                      <small>Atteso</small>
                      <strong>{formatter.format(typeTotals.atteso)}</strong>
                    </span>
                    <span>
                      <small>Registrato</small>
                      <strong>{formatter.format(typeTotals.effettivo)}</strong>
                    </span>
                  </div>
                  <ChevronDown size={20} />
                </button>

                <div className="budget-accordion-panel">
                  <div className="budget-accordion-panel-inner">
                    <label className="category-search">
                      <Search size={17} />
                      <input
                        value={query}
                        onChange={(event) =>
                          setCategoryQueries((current) => ({ ...current, [type]: event.target.value }))
                        }
                        placeholder={`Cerca in ${TYPE_META[type].label.toLocaleLowerCase("it-IT")}`}
                      />
                    </label>
                    <div className="budget-category-list">
                      {filteredCategories.length === 0 && (
                        <div className="movement-empty">
                          {categories.length === 0
                            ? "Nessuna categoria creata. Aggiungila dalla pagina Categorie."
                            : "Nessuna categoria trovata."}
                        </div>
                      )}
                      {filteredCategories.map((category) => {
                        const budget = getCategoryBudget(rows, type, category);

                        return (
                          <BudgetCategoryRow
                            key={`${type}-${category}`}
                            type={type}
                            category={category}
                            budget={budget}
                            setCategoryExpected={setCategoryExpected}
                            addCategoryMovement={addCategoryMovement}
                            deleteCategoryMovement={deleteCategoryMovement}
                            collapseToken={collapseToken}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ExpectedGuide({
  items,
  rows,
  categoryDefaults,
  selectedMonth,
  selectedYear,
  setCategoryExpected,
  onClose
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const current = items[Math.min(step, Math.max(items.length - 1, 0))];
  const budget = current ? getCategoryBudget(rows, current.type, current.category) : null;
  const defaultExpected = current
    ? categoryDefaultValue(categoryDefaults, current.type, current.category)
    : 0;
  const suggestedValue = budget?.atteso > 0 ? budget.atteso : defaultExpected;
  const isLastStep = step >= items.length - 1;
  const guideGroups = TYPES.map((type) => {
    const groupItems = items.filter((item) => item.type === type);
    return {
      type,
      label: TYPE_META[type].label,
      count: groupItems.length,
      startIndex: items.findIndex((item) => item.type === type)
    };
  });
  const currentGroupItems = current ? items.filter((item) => item.type === current.type) : [];
  const currentGroupStep = current
    ? currentGroupItems.findIndex((item) => item.category === current.category) + 1
    : 0;
  const currentGroup = current
    ? guideGroups.find((group) => group.type === current.type)
    : null;
  const CurrentIcon = current ? TYPE_META[current.type].icon : CalendarDays;
  const nextGroup = guideGroups.find(
    (group) => group.startIndex > step && group.startIndex >= 0
  );
  const isLastInGroup = currentGroupStep >= currentGroupItems.length;
  const progress =
    currentGroupItems.length > 0
      ? Math.round((currentGroupStep / currentGroupItems.length) * 100)
      : 0;

  useEffect(() => {
    setStep(0);
  }, [selectedMonth, selectedYear, items.length]);

  useEffect(() => {
    setDraft(suggestedValue > 0 ? String(suggestedValue) : "");
  }, [current?.type, current?.category, suggestedValue]);

  if (!current || !budget) {
    return (
      <article className="expected-guide">
        <div>
          <span className="eyebrow">Guida attesi</span>
          <strong>Nessuna categoria disponibile</strong>
        </div>
        <button className="ghost-button" onClick={onClose}>
          <X size={18} />
          Chiudi
        </button>
      </article>
    );
  }

  function saveAndContinue() {
    setCategoryExpected(current.type, current.category, numberValue(draft));
    if (isLastStep) {
      onClose();
      return;
    }
    setStep((currentStep) => currentStep + 1);
  }

  return (
    <article className="expected-guide" style={{ "--guide-progress": `${progress}%` }}>
      <div className="expected-guide-toolbar">
        <button
          className="ghost-button"
          onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
          disabled={step === 0}
        >
          <ChevronLeft size={18} />
          Indietro
        </button>
        <span className="status-pill">
          {currentGroup?.label} {currentGroupStep} di {currentGroupItems.length}
        </span>
        <button className="icon-button" onClick={onClose} aria-label="Chiudi guida attesi">
          <X size={18} />
        </button>
      </div>

      <div className="expected-guide-groups" role="tablist" aria-label="Gruppi guida attesi">
        {guideGroups.map((group) => (
          <button
            key={group.type}
            type="button"
            className={current?.type === group.type ? "active" : ""}
            onClick={() => group.startIndex >= 0 && setStep(group.startIndex)}
            disabled={group.startIndex < 0}
          >
            <span>{group.label}</span>
            <strong>{group.count}</strong>
          </button>
        ))}
      </div>

      <div className="expected-guide-progress" aria-label={`Avanzamento guida ${progress}%`}>
        <span />
      </div>

      <div className="expected-guide-head">
        <div className="expected-guide-category">
          <div className="metric-icon" style={{ "--accent": TYPE_META[current.type].color }}>
            <CurrentIcon size={20} />
          </div>
          <div>
            <small>{TYPE_META[current.type].label}</small>
            <strong>{current.category}</strong>
          </div>
        </div>
        <small>
          {selectedMonth} {selectedYear}
        </small>
      </div>

      <div className="expected-guide-body">
        <button
          className="expected-guide-stat expected-guide-default"
          type="button"
          onClick={() => setDraft(String(defaultExpected || ""))}
        >
          <span>Default categoria</span>
          <strong>{formatter.format(defaultExpected)}</strong>
          <small>Clicca qui per riportare il valore del mese al default.</small>
        </button>
        <label className="expected-guide-input highlighted">
          <span>Atteso per questo mese</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <small>Scrivi l'importo da salvare per questa categoria.</small>
        </label>
      </div>

      <div className="expected-guide-actions">
        <button className="primary-button" onClick={saveAndContinue}>
          {isLastStep ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
          {isLastStep
            ? "Completa"
            : isLastInGroup && nextGroup
              ? `Salva e passa a ${nextGroup.label}`
              : "Salva e continua"}
        </button>
      </div>
    </article>
  );
}

function BudgetCategoryRow({
  type,
  category,
  budget,
  setCategoryExpected,
  addCategoryMovement,
  deleteCategoryMovement,
  collapseToken
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [movementDescription, setMovementDescription] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const isIncome = type === "Ingresso";
  const movementLabel = isIncome ? "entrata" : "spesa";
  const movementLabelPlural = isIncome ? "Entrate registrate" : "Spese registrate";

  useEffect(() => {
    setIsOpen(false);
  }, [collapseToken]);

  function submitMovement(event) {
    event.preventDefault();
    addCategoryMovement(type, category, {
      descrizione: movementDescription,
      importo: movementAmount
    });
    setMovementDescription("");
    setMovementAmount("");
  }

  return (
    <article className={`budget-category-row ${isOpen ? "open" : ""}`}>
      <div className="budget-category-top">
        <button
          className="budget-category-trigger"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <div>
            <strong>{category}</strong>
            <span>{TYPE_META[type].label}</span>
          </div>
          <div className="budget-category-summary">
            <span className="summary-pill expected">
              <small>Atteso</small>
              <strong>{formatter.format(budget.atteso)}</strong>
            </span>
            <span className="summary-pill actual">
              <small>{isIncome ? "Registrato" : "Speso"}</small>
              <strong>{formatter.format(budget.effettivo)}</strong>
            </span>
          </div>
          <ChevronDown size={19} />
        </button>
      </div>

      <div className="budget-category-panel">
        <div className="budget-category-panel-inner">
          <div className="category-workflow">
            <section className="category-step category-plan-step">
              <div className="category-step-head">
                <span>1</span>
                <div>
                  <strong>Budget previsto</strong>
                  <small>Importo atteso per questa categoria</small>
                </div>
              </div>
              <div className="budget-category-values">
                <label>
                  <span>Atteso mensile</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={numberInputValue(budget.atteso)}
                    onChange={(event) => setCategoryExpected(type, category, numberValue(event.target.value))}
                  />
                </label>
              </div>
            </section>

            <section className="category-step category-movement-step">
              <div className="category-step-head">
                <span>2</span>
                <div>
                  <strong>Registra {movementLabel}</strong>
                  <small>{movementLabelPlural}: {formatter.format(budget.effettivo)}</small>
                </div>
              </div>
              <form className="movement-form" onSubmit={submitMovement}>
                <label>
                  <span>Descrizione</span>
                  <input
                    value={movementDescription}
                    onChange={(event) => setMovementDescription(event.target.value)}
                    placeholder={isIncome ? "Es. Stipendio" : "Es. Supermercato"}
                  />
                </label>
                <label>
                  <span>Importo</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={movementAmount}
                    onChange={(event) => setMovementAmount(event.target.value)}
                  />
                </label>
                <button className="primary-button" type="submit">
                  <Plus size={18} />
                  Aggiungi {movementLabel}
                </button>
              </form>
            </section>
          </div>

          <div className="movement-list">
            <div className="movement-list-head">
              <strong>Movimenti registrati</strong>
              <span>{budget.movimenti.length}</span>
            </div>
            {budget.movimenti.length === 0 ? (
              <div className="movement-empty">
                Nessun movimento registrato per questa categoria.
              </div>
            ) : (
              budget.movimenti.map((movement) => (
                <div className="movement-item" key={`${movement.rowId}-${movement.id}`}>
                  <span>{movement.descrizione || "Movimento"}</span>
                  <strong>{formatter.format(movement.importo)}</strong>
                  <button
                    className="icon-button danger"
                    onClick={() => deleteCategoryMovement(movement.rowId, movement.id)}
                    aria-label={`Elimina movimento ${movement.descrizione || movement.importo}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ type, totals }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <article className="metric-card" style={{ "--accent": meta.color }}>
      <div className="metric-icon">
        <Icon size={21} />
      </div>
      <span>{meta.label}</span>
      <strong>{formatter.format(totals.effettivo)}</strong>
      <small>Atteso {formatter.format(totals.atteso)}</small>
    </article>
  );
}

function EmptyBudget({ addRow }) {
  return (
    <div className="empty-state">
      <span className="eyebrow">Primo inserimento</span>
      <h2>Costruisci il mese in pochi tocchi</h2>
      <p>
        Scegli categorie predefinite per entrate e risparmi, spese necessarie e sfizi.
        Le voci ricorrenti possono essere copiate in tutti i mesi dell'anno.
      </p>
      <div className="empty-actions">
        <button className="primary-button" onClick={() => addRow("Ingresso")}>
          <Plus size={18} />
          Aggiungi ingresso/risparmio
        </button>
        <button className="ghost-button" onClick={() => addRow("Necessario")}>
          <Plus size={18} />
          Aggiungi spesa
        </button>
      </div>
      <div className="steps">
        <span>1. Inserisci il valore atteso</span>
        <span>2. Aggiorna il reale durante il mese</span>
        <span>3. Controlla scostamenti e margine</span>
      </div>
    </div>
  );
}

function TransactionRow({ row, categoryOptions, updateRow, deleteRow, copyRowToYear }) {
  const overspent = row.tipo !== "Ingresso" && numberValue(row.effettivo) > numberValue(row.atteso);
  const rowCategoryOptions = categoryOptionsFor(row, categoryOptions);

  return (
    <article className={`transaction-row ${overspent ? "overspent" : ""}`}>
      <label>
        <span>Categoria</span>
        <select
          value={row.descrizione}
          onChange={(event) => updateRow(row.id, { descrizione: event.target.value })}
        >
          {rowCategoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Gruppo</span>
        <select
          value={row.tipo}
          onChange={(event) => {
            const nextType = event.target.value;
            updateRow(row.id, {
              tipo: nextType,
              descrizione: nextCategoryForType(row, nextType, categoryOptions)
            });
          }}
        >
          {BUDGET_TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label>
        <span>Atteso</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={numberInputValue(row.atteso)}
          onChange={(event) => updateRow(row.id, { atteso: numberValue(event.target.value) })}
        />
      </label>
      <label>
        <span>Effettivo</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={numberInputValue(row.effettivo)}
          onChange={(event) => updateRow(row.id, { effettivo: numberValue(event.target.value) })}
        />
      </label>
      <label>
        <span>Note</span>
        <input
          value={row.note}
          onChange={(event) => updateRow(row.id, { note: event.target.value })}
          placeholder="Opzionale"
        />
      </label>
      <div className="row-actions">
        {overspent && (
          <span className="alert-pill" title="Effettivo superiore all'atteso">
            <AlertTriangle size={15} />
          </span>
        )}
        <button className="icon-button" onClick={() => copyRowToYear(row)} aria-label="Copia in tutti i mesi">
          <Copy size={17} />
        </button>
        <button className="icon-button danger" onClick={() => deleteRow(row.id)} aria-label="Elimina voce">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}

function DashboardView({ selectedYear, setSelectedYear, yearOptions, dashboardData }) {
  const [expandedChart, setExpandedChart] = useState(null);

  useEffect(() => {
    if (!expandedChart) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setExpandedChart(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedChart]);

  const expandedMeta = expandedChart ? TYPE_META[expandedChart] : null;
  const sortedYearOptions = [...yearOptions].sort((a, b) => a - b);
  const previousYear = sortedYearOptions[sortedYearOptions.indexOf(selectedYear) - 1] ?? selectedYear - 1;
  const nextYear = sortedYearOptions[sortedYearOptions.indexOf(selectedYear) + 1] ?? selectedYear + 1;

  return (
    <>
      <section className="dashboard-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Reporting annuale</span>
            <h1>Andamento {selectedYear}</h1>
          </div>
          <div className="dashboard-year-switcher" aria-label="Anno dashboard">
            <button className="icon-button" onClick={() => setSelectedYear(previousYear)} aria-label="Anno precedente">
              <ChevronLeft size={18} />
            </button>
            <div>
              <span>Anno</span>
              <strong>{selectedYear}</strong>
            </div>
            <button className="icon-button" onClick={() => setSelectedYear(nextYear)} aria-label="Anno successivo">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="charts-grid">
          {TYPES.map((type) => (
            <ChartPanel
              key={type}
              type={type}
              data={dashboardData[type]}
              onExpand={() => setExpandedChart(type)}
            />
          ))}
        </div>
      </section>

      {expandedChart && (
        <div className="chart-fullscreen" role="dialog" aria-modal="true" aria-label={`Grafico ${expandedMeta.label}`}>
          <div className="chart-fullscreen-panel">
            <div className="chart-fullscreen-head">
              <div>
                <span className="eyebrow">{expandedMeta.label}</span>
                <h2>Atteso vs reale {selectedYear}</h2>
              </div>
              <button className="icon-button" onClick={() => setExpandedChart(null)} aria-label="Chiudi grafico">
                <X size={20} />
              </button>
            </div>
            <BudgetLineChart type={expandedChart} data={dashboardData[expandedChart]} height="100%" expanded />
          </div>
        </div>
      )}
    </>
  );
}

function ChartPanel({ type, data, onExpand }) {
  return (
    <article className="chart-panel">
      <div className="chart-panel-head">
        <div>
          <span className="eyebrow">{TYPE_META[type].label}</span>
          <h2>Atteso vs reale</h2>
        </div>
        <button className="icon-button" onClick={onExpand} aria-label={`Apri grafico ${TYPE_META[type].label} a tutto schermo`}>
          <Maximize2 size={18} />
        </button>
      </div>
      <BudgetLineChart type={type} data={data} height={250} />
    </article>
  );
}

function BudgetLineChart({ type, data, height, expanded = false }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={expanded ? { top: 24, right: 34, left: 8, bottom: 18 } : { top: 16, right: 18, left: -12, bottom: 4 }}
      >
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke="var(--muted)" tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          formatter={(value) => formatter.format(value)}
          contentStyle={{
            border: "1px solid var(--line)",
            borderRadius: 18,
            background: "var(--surface-container)",
            color: "var(--text)",
            boxShadow: "var(--shadow)"
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="Atteso" stroke="var(--warning)" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="Effettivo" stroke={TYPE_META[type].color} strokeWidth={3} dot={{ r: expanded ? 4 : 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CategoriesView({
  categoryOptions,
  categoryDefaults,
  addCategory,
  removeCategory,
  setCategoryDefaultExpected
}) {
  const [drafts, setDrafts] = useState(() =>
    CATEGORY_GROUPS.reduce((acc, group) => ({ ...acc, [group.key]: "" }), {})
  );

  function submitCategory(groupKey, event) {
    event.preventDefault();
    const added = addCategory(groupKey, drafts[groupKey] ?? "");
    if (added) {
      setDrafts((current) => ({ ...current, [groupKey]: "" }));
    }
  }

  return (
    <section className="categories-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Categorie entrate e uscite</span>
          <h1>Categorie</h1>
        </div>
      </div>

      <div className="categories-grid">
        {CATEGORY_GROUPS.map((group) => {
          const groupOptions = categoryGroupOptions(group, categoryOptions);
          const targetType = group.types[0];

          return (
          <article className="category-panel" key={group.key} style={{ "--accent": group.color }}>
            <div className="category-panel-head">
              <span className="eyebrow">{group.label}</span>
              <strong>{groupOptions.length}</strong>
            </div>

            <div className="category-list">
              {groupOptions.length === 0 && (
                <div className="category-empty">Nessuna categoria. Aggiungi la prima qui sotto.</div>
              )}
              {groupOptions.map((category) => (
                <div className="category-item" key={category}>
                  <strong>{category}</strong>
                  <label>
                    <span>Atteso default</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={numberInputValue(categoryDefaultValue(categoryDefaults, targetType, category))}
                      onChange={(event) =>
                        setCategoryDefaultExpected(targetType, category, event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCategory(group.key, category)}
                    aria-label={`Rimuovi ${category}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <form className="category-form" onSubmit={(event) => submitCategory(group.key, event)}>
              <input
                value={drafts[group.key] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [group.key]: event.target.value }))
                }
                placeholder={`Nuova categoria ${group.label.toLocaleLowerCase("it-IT")}`}
              />
              <button className="primary-button" type="submit">
                <Plus size={18} />
                Aggiungi
              </button>
            </form>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function SettingsView({ database, theme, setTheme, exportData, importData, clearData, fileInputRef }) {
  const years = Object.keys(database).length;
  const months = Object.values(database).reduce((sum, year) => sum + Object.keys(year).length, 0);
  const rows = Object.values(database).reduce(
    (sum, year) => sum + Object.values(year).reduce((monthSum, entries) => monthSum + entries.length, 0),
    0
  );

  return (
    <section className="settings-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Preferenze e backup</span>
          <h1>Impostazioni</h1>
        </div>
      </div>

      <div className="data-stats">
        <MetricStat label="Anni" value={years} />
        <MetricStat label="Mesi" value={months} />
        <MetricStat label="Voci" value={rows} />
      </div>

      <div className="settings-list">
        <SettingsRow
          icon={Palette}
          title="Tema"
          description="Scegli il tema dell'interfaccia."
          action={
            <div className="segment theme-segment" role="group" aria-label="Tema">
              <button
                className={theme === "auto" ? "active" : ""}
                onClick={() => setTheme("auto")}
                type="button"
              >
                Auto
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
                type="button"
              >
                Scuro
              </button>
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
                type="button"
              >
                Chiaro
              </button>
            </div>
          }
        />
        <SettingsRow
          icon={Database}
          title="Dati locali"
          description="Budgeter usa localStorage. Nessuna voce viene inviata a server esterni."
          action={
            <span className="status-pill">
              <CheckCircle2 size={15} />
              Offline Ready
            </span>
          }
        />
        <SettingsRow
          icon={Download}
          title="Esporta backup"
          description="Scarica un JSON con tutto il database locale."
          action={
            <button className="primary-button" onClick={exportData}>
              <Download size={18} />
              Esporta
            </button>
          }
        />
        <SettingsRow
          icon={FileUp}
          title="Importa backup"
          description="Unisci o sostituisci i dati partendo da un file JSON."
          action={
            <>
              <input ref={fileInputRef} type="file" accept="application/json" onChange={importData} hidden />
              <button className="ghost-button" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={18} />
                Importa
              </button>
            </>
          }
        />
        <SettingsRow
          icon={Settings}
          title="Cancella dati"
          description="Rimuove definitivamente il database locale da questo browser."
          action={
            <button className="ghost-button danger" onClick={clearData}>
              <Trash2 size={18} />
              Cancella
            </button>
          }
        />
      </div>
    </section>
  );
}

function MetricStat({ label, value }) {
  return (
    <article className="metric-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SettingsRow({ icon: Icon, title, description, action }) {
  return (
    <article className="settings-row">
      <div className="settings-icon">
        <Icon size={21} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="settings-action">{action}</div>
    </article>
  );
}

export default App;
