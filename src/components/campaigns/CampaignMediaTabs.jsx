import { useEffect, useRef, useState } from "react";
import { Check, Plus, Save, Settings2, Trash2, X } from "lucide-react";
import { LIVE_SPOT_SEED } from "@/lib/liveSpotSeed.js";
import { uid } from "@/lib/id.js";
import { cn } from "@/lib/cn.js";
import { Button } from "@/components/ui/Button.jsx";
import { Card } from "@/components/ui/Card.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const STORAGE_KEY = "setanta.campaign.live-spots.v3";
const LEGACY_STORAGE_KEY = "setanta.campaign.live-spots.v1";

const CAMPAIGN_TABS = [
  { value: "spot1", label: "LIVE SPOT — SETANTA SPORTS 1" },
  { value: "spot2", label: "LIVE SPOT — SETANTA SPORTS 2" },
  {
    value: "channels",
    label: "SETANTA SPORTS 1 | SETANTA SPORTS 2",
  },
  { value: "social", label: "SOCIAL MEDIA" },
  { value: "stats", label: "TOTAL STATISTICS" },
];

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
  return (
    <div className="mb-4 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
      <div className="flex min-w-max gap-1.5">
        {CAMPAIGN_TABS.map((tab) => (
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
        ))}
      </div>
    </div>
  );
}

export function EditableSpotTable({ tableKey }) {
  const { isAdvertiser } = useAuth();
  const [rows, setRows] = useState(() => loadRows(tableKey));
  const [pendingScrollRowId, setPendingScrollRowId] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle");
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

  return (
    <Card className="overflow-hidden">
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
        {/* Рекламодатель видит медиаплан только для чтения. */}
        {!isAdvertiser && (
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        )}
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
