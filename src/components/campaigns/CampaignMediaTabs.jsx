import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Plus,
  Save,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { LIVE_SPOT_SEED } from "@/lib/liveSpotSeed.js";
import { uid } from "@/lib/id.js";
import { cn } from "@/lib/cn.js";
import { Button } from "@/components/ui/Button.jsx";
import { Card } from "@/components/ui/Card.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useToast } from "@/components/ui/Toast.jsx";

const STORAGE_KEY = "setanta.campaign.live-spots.v4";
const LEGACY_STORAGE_KEY = "setanta.campaign.live-spots.v1";

// Две таблицы Live Spot отличаются только каналом — выносим общее в подпись
// группы, чтобы не повторять «LIVE SPOT —» в каждой вкладке.
const CAMPAIGN_TABS = [
  { value: "spot1", label: "Setanta Sports 1", group: "Live spot" },
  { value: "spot2", label: "Setanta Sports 2", group: "Live spot" },
  { value: "ss1uzb", label: "SS1", group: "UZB TV" },
  { value: "ss2uzb", label: "SS2", group: "UZB TV" },
  { value: "promo1", label: "SS1", group: "Event promo" },
  { value: "promo2", label: "SS2", group: "Event promo" },
  { value: "channels", label: "Total Spot statistic" },
  { value: "social", label: "Social media" },
  { value: "stats", label: "Total statistics" },
];

/** Соседние вкладки с одинаковым group собираем в одну секцию. */
function groupTabs(tabs) {
  return tabs.reduce((groups, tab) => {
    const last = groups[groups.length - 1];
    if (tab.group && last?.name === tab.group) last.items.push(tab);
    else groups.push({ name: tab.group ?? null, items: [tab] });
    return groups;
  }, []);
}

const TABLE_META = {
  spot1: {
    title: "LIVE SPOT — SETANTA SPORTS 1",
    subtitle: "Канал S1 · все размещения и расписание прямых эфиров",
  },
  spot2: {
    title: "LIVE SPOT — SETANTA SPORTS 2",
    subtitle: "Канал S2 · расписание прямых эфиров",
  },
};

const COLUMNS = [
  { key: "date", label: "Дата", className: "min-w-[112px]" },
  { key: "time", label: "Время GMT+4", className: "min-w-[90px]" },
  {
    key: "tournament",
    label: "Турнир",
    className: "w-[140px] min-w-[140px] max-w-[140px]",
  },
  {
    key: "event",
    label: "Событие",
    className: "w-[240px] min-w-[240px] max-w-[240px]",
  },
  { key: "channel", label: "Канал", className: "min-w-[70px]" },
  { key: "pre", label: "Pre", className: "min-w-[62px]", live: true },
  { key: "mid1", label: "Mid 1", className: "min-w-[62px]", live: true },
  { key: "mid2", label: "Mid 2", className: "min-w-[62px]", live: true },
  { key: "post", label: "Post", className: "min-w-[62px]", live: true },
  { key: "views", label: "Просмотры", className: "min-w-[112px]", live: true },
];

// Заголовки, которые узнаём в загружаемом файле.
const HEADER_ALIASES = {
  date: ["дата", "date"],
  time: ["время", "время gmt+4", "time"],
  tournament: ["турнир", "лига", "tournament", "league"],
  event: ["событие", "матч", "event", "match"],
  channel: ["канал", "channel"],
  pre: ["pre", "пре"],
  mid1: ["mid 1", "mid1"],
  mid2: ["mid 2", "mid2"],
  post: ["post", "пост"],
  views: ["просмотры", "views"],
};

const pad = (n) => String(n).padStart(2, "0");

/** Ячейку приводим к строке: даты и время Excel отдаёт объектами Date. */
function cellText(value, key) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return key === "time"
      ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
      : `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  }
  return String(value).trim();
}

/** Ищем строку заголовков; если её нет — читаем колонки по порядку. */
function columnMap(sheet) {
  for (const [index, row] of sheet.slice(0, 5).entries()) {
    const map = {};
    row.forEach((cell, column) => {
      const text = String(cell ?? "").trim().toLowerCase();
      if (!text) return;
      const found = Object.entries(HEADER_ALIASES).find(([, aliases]) =>
        aliases.includes(text),
      );
      if (found && map[found[0]] === undefined) map[found[0]] = column;
    });
    if (Object.keys(map).length >= 2) return { map, headerIndex: index };
  }
  const map = {};
  COLUMNS.forEach((column, index) => {
    map[column.key] = index;
  });
  return { map, headerIndex: -1 };
}

/** Строки таблицы из листа Excel. */
function rowsFromSheet(sheet, tableKey) {
  const { map, headerIndex } = columnMap(sheet);
  const fallbackChannel = tableKey === "spot2" ? "S2" : "S1";

  return sheet
    .slice(headerIndex + 1)
    .map((row) => {
      const value = (key) =>
        map[key] === undefined ? "" : cellText(row[map[key]], key);
      return {
        id: uid("spot"),
        date: value("date"),
        time: value("time"),
        tournament: value("tournament"),
        event: value("event"),
        channel: value("channel") || fallbackChannel,
        pre: value("pre") || "30",
        mid1: value("mid1") || "15",
        mid2: value("mid2") || "15",
        post: value("post") || "30",
        views: value("views"),
      };
    })
    .filter((row) => row.date || row.time || row.tournament || row.event);
}

function cloneSeed(tableKey) {
  return LIVE_SPOT_SEED[tableKey].map((row) => ({ ...row }));
}

function loadRows(tableKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(saved[tableKey])) return saved[tableKey];

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
    let migratedRows;

    if (tableKey === "spot1") {
      const seedRows = cloneSeed("spot1");
      const campaignRows = Array.isArray(legacy.campaign)
        ? legacy.campaign
        : seedRows.filter((row) => row.id.startsWith("campaign-"));
      const spotRows = Array.isArray(legacy.spot1)
        ? legacy.spot1
        : seedRows.filter((row) => !row.id.startsWith("campaign-"));
      migratedRows = [...campaignRows, ...spotRows];
    } else {
      migratedRows = Array.isArray(legacy[tableKey])
        ? legacy[tableKey]
        : cloneSeed(tableKey);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...saved, [tableKey]: migratedRows }),
    );
    return migratedRows;
  } catch {
    return cloneSeed(tableKey);
  }
}

function persistRows(tableKey, rows) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...saved, [tableKey]: rows }),
    );
  } catch {
    // При переполнении хранилища изменения останутся в текущей сессии.
  }
}

export function CampaignTabs({ value, onChange }) {
  const renderTab = (tab) => (
    <button
      key={tab.value}
      type="button"
      onClick={() => onChange(tab.value)}
      className={cn(
        "rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors focus-ring",
        value === tab.value
          ? "bg-indigo-500 text-ink shadow-soft"
          : "text-ink-muted hover:bg-paper hover:text-ink",
      )}
    >
      {tab.label}
    </button>
  );

  return (
    <div className="mb-4 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
      <div className="flex min-w-max items-center gap-1.5">
        {groupTabs(CAMPAIGN_TABS).map((group) =>
          group.name ? (
            <div
              key={group.name}
              className="flex items-center gap-1.5 rounded-xl bg-paper/80 py-1 pl-3 pr-1"
            >
              <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                {group.name}
              </span>
              {group.items.map(renderTab)}
            </div>
          ) : (
            group.items.map(renderTab)
          ),
        )}
      </div>
    </div>
  );
}

export function EditableSpotTable({ tableKey }) {
  const { isAdvertiser, isViewer, canEdit } = useAuth()
  // Рекламодателю и наблюдателю таблица доступна только на просмотр.
  const readOnly = isAdvertiser || !canEdit
  const toast = useToast();
  const [rows, setRows] = useState(() => loadRows(tableKey));
  const [pendingScrollRowId, setPendingScrollRowId] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const rowRefs = useRef(new Map());
  const originalRowsRef = useRef(null);
  const saveFeedbackTimeoutRef = useRef(null);
  const meta = TABLE_META[tableKey];

  useEffect(() => {
    if (!pendingScrollRowId) return;

    const frame = requestAnimationFrame(() => {
      const row = rowRefs.current.get(pendingScrollRowId);
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedRowId(pendingScrollRowId);
      setPendingScrollRowId(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [pendingScrollRowId, rows]);

  useEffect(() => {
    if (!highlightedRowId) return;
    const timeout = window.setTimeout(() => setHighlightedRowId(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [highlightedRowId]);

  useEffect(
    () => () => window.clearTimeout(saveFeedbackTimeoutRef.current),
    [],
  );

  const commit = (nextRows) => {
    setRows(nextRows);
    setIsDirty(true);
    setSaveState("idle");
  };

  const updateCell = (rowId, field, value) => {
    commit(
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const createRow = () => {
    const channel = tableKey === "spot2" ? "S2" : "S1";
    return {
      id: uid("spot"),
      date: "",
      time: "",
      tournament: "",
      event: "",
      channel,
      pre: "30",
      mid1: "15",
      mid2: "15",
      post: "30",
      views: "",
    };
  };

  const addRow = () => {
    const newRow = createRow();
    commit([...rows, newRow]);
    setPendingScrollRowId(newRow.id);
  };

  const insertRowAfter = (rowIndex) => {
    const newRow = createRow();
    const nextRows = [...rows];
    nextRows.splice(rowIndex + 1, 0, newRow);
    commit(nextRows);
    setPendingScrollRowId(newRow.id);
  };

  const beginEditing = () => {
    originalRowsRef.current = rows.map((row) => ({ ...row }));
    setIsEditing(true);
    setSaveState("idle");
  };

  const cancelEditing = () => {
    if (originalRowsRef.current) {
      setRows(originalRowsRef.current.map((row) => ({ ...row })));
    }
    originalRowsRef.current = null;
    setIsEditing(false);
    setIsDirty(false);
    setSaveState("idle");
  };

  const showSavedState = () => {
    window.clearTimeout(saveFeedbackTimeoutRef.current);
    setSaveState("saved");
    saveFeedbackTimeoutRef.current = window.setTimeout(
      () => setSaveState("idle"),
      1800,
    );
  };

  const saveChanges = () => {
    persistRows(tableKey, rows);
    originalRowsRef.current = null;
    setIsEditing(false);
    setIsDirty(false);
    showSavedState();
  };

  const removeRow = (rowId) => {
    commit(rows.filter((row) => row.id !== rowId));
  };

  /** Excel из проводника: читаем лист и подставляем строки в таблицу. */
  const importFile = async (file) => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error("Нужен файл .xlsx");
      return;
    }
    setIsImporting(true);
    try {
      // Парсер тянем только когда он реально нужен.
      const { parseXlsx } = await import("@/lib/xlsx.js");
      const sheet = await parseXlsx(file);
      const imported = rowsFromSheet(sheet, tableKey);
      if (!imported.length) {
        toast.error("В файле не нашлось строк с данными");
        return;
      }
      if (!isEditing) originalRowsRef.current = rows.map((row) => ({ ...row }));
      setRows(imported);
      setIsEditing(true);
      setIsDirty(true);
      setSaveState("idle");
      toast.success(`Загружено строк: ${imported.length}`);
    } catch {
      toast.error("Не удалось прочитать файл");
    } finally {
      setIsImporting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;
    importFile(e.dataTransfer.files?.[0]);
  };

  /** Выгрузка текущего медиаплана в .xlsx. */
  const download = async () => {
    const { buildXlsx, downloadBlob } = await import("@/lib/xlsx.js");
    const blob = buildXlsx({
      sheetName: tableKey === "spot2" ? "Live spot S2" : "Live spot S1",
      rows: [
        COLUMNS.map((column) => column.label),
        ...rows.map((row) => COLUMNS.map((column) => row[column.key])),
      ],
    });
    downloadBlob(blob, `${meta.title}.xlsx`);
  };

  const onDragOver = (e) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <Card
      className="relative overflow-hidden"
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          importFile(file);
        }}
      />
      {isDragging && !readOnly && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/85 backdrop-blur-[1px]">
          <p className="flex items-center gap-2 text-sm font-medium text-indigo-900">
            <FileSpreadsheet size={18} />
            Отпустите файл — заполним таблицу
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-br from-surface via-indigo-50 to-indigo-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-800">
            Media plan
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">
            {meta.title}
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">{meta.subtitle}</p>
        </div>
        {/* Рекламодатель и наблюдатель видят медиаплан только для чтения,
            но выгрузка отчёта доступна наблюдателю — это не правка. */}
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={isEditing ? cancelEditing : beginEditing}
              >
                {isEditing ? <X size={15} /> : <Settings2 size={15} />}
                {isEditing ? "Отменить" : "Редактировать"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload size={15} />
                {isImporting ? "Загружаем…" : "Импорт Excel"}
              </Button>
            </>
          )}
          {(!readOnly || isViewer) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={download}
              disabled={!rows.length}
            >
              <Download size={15} />
              Скачать
            </Button>
          )}
          {!readOnly && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={addRow}
                disabled={!isEditing}
              >
                <Plus size={15} />
                Добавить строку
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={!isEditing || !isDirty}
              >
                {saveState === "saved" ? <Check size={15} /> : <Save size={15} />}
                {saveState === "saved"
                  ? "Изменения сохранены"
                  : "Сохранить изменения"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse text-sm",
            isEditing ? "min-w-[1090px]" : "min-w-[998px]",
          )}
        >
          <thead>
            <tr className="bg-indigo-500 text-[11px] font-semibold uppercase tracking-wider text-ink">
              <th className="w-12 px-2 py-3 text-center">№</th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "border-l border-black/10 px-2 py-3 text-left",
                    column.className,
                    column.live && "bg-[#ff665f]/90 text-center",
                  )}
                >
                  {column.label}
                </th>
              ))}
              {isEditing && (
                <th className="sticky right-0 z-20 w-[92px] min-w-[92px] border-l border-black/10 bg-indigo-500 px-2 py-3 text-center shadow-[-8px_0_16px_rgba(22,22,28,0.08)]">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows.length && (
              <tr>
                <td
                  colSpan={COLUMNS.length + (isEditing ? 2 : 1)}
                  className="px-4 py-12 text-center"
                >
                  <FileSpreadsheet
                    size={26}
                    className="mx-auto text-ink-muted"
                  />
                  <p className="mt-3 text-sm font-medium text-ink-soft">
                    Таблица пустая
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {readOnly
                      ? "Размещения появятся после загрузки медиаплана."
                      : "Перетащите сюда файл .xlsx — строки подставятся автоматически."}
                  </p>
                </td>
              </tr>
            )}
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(row.id, node);
                  else rowRefs.current.delete(row.id);
                }}
                className={cn(
                  "group transition-all duration-500 hover:bg-paper/70",
                  highlightedRowId === row.id &&
                    "bg-indigo-100 shadow-[inset_4px_0_0_#FFD106]",
                )}
              >
                <td className="relative px-2 py-1.5 text-center text-[11px] text-ink-muted tnum">
                  {rowIndex + 1}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => insertRowAfter(rowIndex)}
                      aria-label={`Добавить строку после ${rowIndex + 1}`}
                      title={`Добавить строку после ${rowIndex + 1}`}
                      className="absolute -bottom-3 left-1/2 z-20 inline-flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-indigo-500 text-ink opacity-0 shadow-soft transition-all hover:scale-110 group-hover:opacity-100 focus:opacity-100 focus-ring"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </td>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-l border-line px-1.5 py-1",
                      column.live && "bg-danger/[0.045]",
                    )}
                  >
                    <input
                      value={row[column.key]}
                      readOnly={!isEditing}
                      onChange={(event) =>
                        updateCell(row.id, column.key, event.target.value)
                      }
                      aria-label={`${column.label}, строка ${rowIndex + 1}`}
                      className={cn(
                        "h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[12px] text-ink outline-none transition-colors",
                        isEditing
                          ? "hover:border-line hover:bg-surface focus:border-indigo-400 focus:bg-surface focus:ring-2 focus:ring-indigo-200"
                          : "cursor-default",
                        column.live && "text-center font-semibold tnum",
                      )}
                    />
                  </td>
                ))}
                {isEditing && (
                  <td
                    className={cn(
                      "sticky right-0 z-10 w-[92px] min-w-[92px] border-l border-line bg-surface px-2 py-1 text-center shadow-[-8px_0_16px_rgba(22,22,28,0.05)] transition-colors group-hover:bg-paper",
                      highlightedRowId === row.id && "bg-indigo-100",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Удалить строку ${rowIndex + 1}`}
                      title="Удалить"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger opacity-60 transition hover:bg-danger hover:text-white group-hover:opacity-100 focus:opacity-100 focus-ring"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-paper/70 font-semibold text-ink">
              <td colSpan={6} className="px-4 py-3 text-right text-[12px]">
                Итого размещений
              </td>
              <td className="px-2 py-3 text-center tnum">{rows.length}</td>
              <td className="px-2 py-3 text-center tnum">{rows.length}</td>
              <td className="px-2 py-3 text-center tnum">{rows.length}</td>
              <td className="px-2 py-3 text-center tnum">{rows.length}</td>
              <td className="px-2 py-3 text-center text-[12px] tnum">
                {rows.length * 4} вставок
              </td>
              {isEditing && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
