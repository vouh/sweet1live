"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminError,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  AdminSearch,
  AdminToolbar,
  StatCard,
  StatGrid,
  StatusBadge,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import { adminApi, formatMoney, type AdminMenuItem } from "@/lib/adminApi";

type Draft = {
  course: string;
  name: string;
  description: string;
  tag: string;
  price: string;
  sort_order: string;
};

const EMPTY: Draft = { course: "", name: "", description: "", tag: "", price: "", sort_order: "0" };

function toDraft(item: AdminMenuItem): Draft {
  return {
    course: item.course,
    name: item.name,
    description: item.description,
    tag: item.tag,
    price: (item.price_pence / 100).toFixed(2),
    sort_order: String(item.sort_order),
  };
}

/** "12.50" / "12,50" / "£12.50" → 1250. Staff type prices in pounds; the DB keeps pence. */
function toPence(price: string): number {
  const parsed = Number(price.replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export default function AdminMenusPage() {
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [items, setItems] = useState<AdminMenuItem[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  // Deleting is irreversible, so the button arms first and deletes on the second click.
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.menus({ q: search });
    setItems(result);
    return result;
  }, [search]);

  const { error, initialising, reload } = useAdminResource(load, [search]);

  const courses = useMemo(() => {
    const grouped = new Map<string, AdminMenuItem[]>();
    for (const item of items ?? []) {
      const list = grouped.get(item.course) ?? [];
      list.push(item);
      grouped.set(item.course, list);
    }
    return [...grouped.entries()];
  }, [items]);

  const totals = useMemo(() => {
    const list = items ?? [];
    const active = list.filter((item) => item.is_active);
    const prices = active.map((item) => item.price_pence).filter((price) => price > 0);
    return {
      dishes: list.length,
      active: active.length,
      courses: new Set(list.map((item) => item.course)).size,
      average: prices.length
        ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
        : 0,
      currency: list[0]?.currency ?? "gbp",
    };
  }, [items]);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({ ...EMPTY, course: courses[0]?.[0] ?? "" });
  }

  function startEdit(item: AdminMenuItem) {
    setCreating(false);
    setEditing(item.id);
    setDraft(toDraft(item));
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
    setDraft(EMPTY);
  }

  async function save() {
    if (!draft.name.trim() || !draft.course.trim()) {
      setNotice("A dish needs both a course and a name.");
      return;
    }
    setSaving(true);
    setNotice(null);
    const body = {
      course: draft.course.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      tag: draft.tag.trim().toUpperCase(),
      price_pence: toPence(draft.price),
      sort_order: Number(draft.sort_order) || 0,
    };
    try {
      if (editing) {
        await adminApi.updateMenuItem(editing, body);
      } else {
        await adminApi.createMenuItem(body);
      }
      cancel();
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save that dish.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: AdminMenuItem) {
    setNotice(null);
    setItems((current) =>
      (current ?? []).map((row) =>
        row.id === item.id ? { ...row, is_active: !row.is_active } : row
      )
    );
    try {
      await adminApi.updateMenuItem(item.id, { is_active: !item.is_active });
    } catch (err) {
      setItems((current) =>
        (current ?? []).map((row) =>
          row.id === item.id ? { ...row, is_active: item.is_active } : row
        )
      );
      setNotice(err instanceof Error ? err.message : "Could not update that dish.");
    }
  }

  async function remove(item: AdminMenuItem) {
    if (armedDelete !== item.id) {
      setArmedDelete(item.id);
      return;
    }
    setArmedDelete(null);
    setNotice(null);
    const snapshot = items ?? [];
    setItems(snapshot.filter((row) => row.id !== item.id));
    try {
      await adminApi.deleteMenuItem(item.id);
    } catch (err) {
      setItems(snapshot);
      setNotice(err instanceof Error ? err.message : "Could not remove that dish.");
    }
  }

  if (error) return <AdminError message={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader
        title="Menus"
        blurb="The kitchen and cellar list, stored in the menu_items table. Edits save straight to the database."
        actions={
          <button type="button" onClick={startCreate} className="admin-btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add dish
          </button>
        }
      />

      <StatGrid>
        <StatCard icon="restaurant_menu" tone="terracotta" label="Dishes" value={totals.dishes} />
        <StatCard icon="visibility" tone="gold" label="On the card" value={totals.active} />
        <StatCard icon="format_list_numbered" tone="chocolate" label="Courses" value={totals.courses} />
        <StatCard
          icon="sell"
          tone="rose"
          label="Average price"
          value={formatMoney(totals.average, totals.currency)}
        />
      </StatGrid>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      {(creating || editing) && (
        <div className="admin-panel p-6 mb-5">
          <h3 className="font-headline-md text-[20px] mb-5">
            {editing ? "Edit dish" : "New dish"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="admin-label" htmlFor="menu-course">Course</label>
              <input
                id="menu-course"
                className="admin-field"
                list="menu-courses"
                value={draft.course}
                onChange={(e) => setDraft({ ...draft, course: e.target.value })}
                placeholder="Small Plates"
              />
              <datalist id="menu-courses">
                {courses.map(([course]) => (
                  <option key={course} value={course} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="admin-label" htmlFor="menu-name">Name</label>
              <input
                id="menu-name"
                className="admin-field"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Truffle Arancini"
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-price">Price (£)</label>
              <input
                id="menu-price"
                className="admin-field"
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="14.00"
              />
            </div>
            <div className="md:col-span-3">
              <label className="admin-label" htmlFor="menu-description">Description</label>
              <textarea
                id="menu-description"
                className="admin-field"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="How it reads on the card."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-label" htmlFor="menu-tag">Tag</label>
                <input
                  id="menu-tag"
                  className="admin-field"
                  maxLength={4}
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                  placeholder="VG"
                />
              </div>
              <div>
                <label className="admin-label" htmlFor="menu-order">Order</label>
                <input
                  id="menu-order"
                  className="admin-field"
                  inputMode="numeric"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button type="button" onClick={save} disabled={saving} className="admin-btn-primary">
              {saving ? "Saving…" : editing ? "Save changes" : "Add to menu"}
            </button>
            <button type="button" onClick={cancel} className="admin-btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search dishes" />
      </AdminToolbar>

      {initialising ? (
        <AdminLoading label="Loading the card…" />
      ) : courses.length === 0 ? (
        <div className="admin-panel p-12 text-center text-[var(--admin-muted)]">
          <span className="material-symbols-outlined text-[30px] opacity-50 block mb-2">
            restaurant_menu
          </span>
          {query ? "No dishes match that search." : "The menu is empty — add the first dish."}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {courses.map(([course, dishes]) => (
            <section key={course} className="admin-panel overflow-hidden">
              <header className="admin-table-head px-5 py-4 flex items-center justify-between gap-3">
                <h3 className="font-headline-md text-[18px]">{course}</h3>
                <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
                  {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}
                </span>
              </header>
              <ul>
                {dishes.map((item) => (
                  <li
                    key={item.id}
                    className="admin-table-row px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-headline-md text-[16px]">{item.name}</p>
                        {item.tag && <StatusBadge status={item.tag} tone="accent" />}
                        {!item.is_active && <StatusBadge status="hidden" tone="neutral" />}
                      </div>
                      <p className="font-body-md text-sm text-[var(--admin-muted)] mt-1">
                        {item.description || "No description yet."}
                      </p>
                    </div>
                    <p className="font-headline-md text-[18px] sm:w-24 sm:text-right whitespace-nowrap">
                      {formatMoney(item.price_pence, item.currency)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        className="admin-icon-btn"
                        title={item.is_active ? "Hide from the menu" : "Show on the menu"}
                        aria-label={item.is_active ? `Hide ${item.name}` : `Show ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.is_active ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="admin-icon-btn admin-icon-btn--accent"
                        aria-label={`Edit ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        onBlur={() => setArmedDelete((id) => (id === item.id ? null : id))}
                        className={`admin-icon-btn ${
                          armedDelete === item.id ? "admin-icon-btn--armed" : ""
                        }`}
                        title={
                          armedDelete === item.id
                            ? "Click again to delete"
                            : `Delete ${item.name}`
                        }
                        aria-label={
                          armedDelete === item.id
                            ? `Confirm deleting ${item.name}`
                            : `Delete ${item.name}`
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {armedDelete === item.id ? "delete_forever" : "delete"}
                        </span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
