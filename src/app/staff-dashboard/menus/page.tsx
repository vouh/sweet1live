"use client";

import { useCallback, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { confirmDelete } from "@/components/admin/AdminTableTools";
import {
  AdminErrorModal,
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
import {
  adminApi,
  formatDateTime,
  formatMoney,
  type AdminMenuCategory,
  type AdminMenuItem,
} from "@/lib/adminApi";
import {
  MAX_MENU_IMAGES,
  MAX_MENU_IMAGE_MB,
  MENU_FIELD_LIMITS,
  validateMenuImageFile,
} from "@/lib/menuFormLimits";

type Draft = {
  course: string;
  name: string;
  description: string;
  tag: string;
  price: string;
  sort_order: string;
  images: string[];
  ingredients: string;
  nutrition: string;
};

const EMPTY: Draft = {
  course: "",
  name: "",
  description: "",
  tag: "",
  price: "",
  sort_order: "0",
  images: [],
  ingredients: "",
  nutrition: "",
};

function toDraft(item: AdminMenuItem): Draft {
  return {
    course: item.course,
    name: item.name,
    description: item.description,
    tag: item.tag,
    price: (item.price_pence / 100).toFixed(2),
    sort_order: String(item.sort_order),
    images: item.images,
    ingredients: item.ingredients,
    nutrition: item.nutrition,
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
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminMenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const result = await adminApi.menus({ q: search });
    setItems(result);
    return result;
  }, [search]);

  const { error, initialising, reload, refreshing } = useAdminResource(load, [search]);

  const loadCategories = useCallback(() => adminApi.menuCategories(), []);
  const {
    data: categories,
    reload: reloadCategories,
    refreshing: refreshingCategories,
  } = useAdminResource(loadCategories, []);

  const handleRefresh = useCallback(() => {
    reload();
    reloadCategories();
  }, [reload, reloadCategories]);

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
    return {
      dishes: list.length,
      active: active.length,
      courses: new Set(list.map((item) => item.course)).size,
      // Combined face value of everything currently on the public menu —
      // a straightforward finance figure, unlike an average that a single
      // £240 bottle of wine would badly skew.
      publicValue: active.reduce((sum, item) => sum + item.price_pence, 0),
      currency: list[0]?.currency ?? "gbp",
    };
  }, [items]);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({ ...EMPTY, course: categories?.[0]?.name ?? "" });
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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_MENU_IMAGES - draft.images.length;
    if (remaining <= 0) {
      setNotice(`You can add up to ${MAX_MENU_IMAGES} photos per dish.`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const file of picked) {
      const problem = validateMenuImageFile(file);
      if (problem) errors.push(problem);
      else valid.push(file);
    }
    if (errors.length > 0) {
      setNotice(errors.join(" "));
    }
    if (valid.length === 0) return;

    setUploading(true);
    setNotice(null);
    try {
      const uploads = await Promise.all(valid.map((file) => adminApi.uploadMenuImage(file)));
      setDraft((current) => ({
        ...current,
        images: [...current.images, ...uploads.map((u) => u.url)],
      }));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setDraft((current) => ({ ...current, images: current.images.filter((i) => i !== url) }));
  }

  async function save() {
    if (!draft.name.trim() || !draft.course.trim()) {
      setNotice("A dish needs both a category and a name.");
      return;
    }
    setSaving(true);
    setNotice(null);
    const body = {
      course: draft.course.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      tag: "",
      price_pence: toPence(draft.price),
      sort_order: Number(draft.sort_order) || 0,
      images: draft.images,
      ingredients: draft.ingredients.trim(),
      nutrition: draft.nutrition.trim(),
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
    const nextActive = !item.is_active;
    setItems((current) =>
      (current ?? []).map((row) => (row.id === item.id ? { ...row, is_active: nextActive } : row))
    );
    // The detail modal holds its own copy of the item, so it needs the same
    // update or it would keep showing the pre-toggle state until re-opened.
    setViewing((current) =>
      current && current.id === item.id ? { ...current, is_active: nextActive } : current
    );
    try {
      await adminApi.updateMenuItem(item.id, { is_active: nextActive });
    } catch (err) {
      setItems((current) =>
        (current ?? []).map((row) =>
          row.id === item.id ? { ...row, is_active: item.is_active } : row
        )
      );
      setViewing((current) =>
        current && current.id === item.id ? { ...current, is_active: item.is_active } : current
      );
      setNotice(err instanceof Error ? err.message : "Could not update that dish.");
    }
  }

  /** Returns whether the dish was actually deleted (false if cancelled or the write failed). */
  async function remove(item: AdminMenuItem): Promise<boolean> {
    if (!(await confirmDelete(`dish "${item.name}"`))) return false;
    setNotice(null);
    const snapshot = items ?? [];
    setItems(snapshot.filter((row) => row.id !== item.id));
    try {
      await adminApi.deleteMenuItem(item.id);
      reloadCategories();
      return true;
    } catch (err) {
      setItems(snapshot);
      setNotice(err instanceof Error ? err.message : "Could not remove that dish.");
      return false;
    }
  }

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader
        title="Menus"
        onRefresh={handleRefresh}
        refreshing={refreshing || refreshingCategories}
        actions={
          <>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="admin-icon-btn"
              aria-label="Menu settings"
              title="Menu settings"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button type="button" onClick={startCreate} className="admin-btn-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add dish
            </button>
          </>
        }
      />

      <StatGrid>
        <StatCard icon="restaurant_menu" tone="terracotta" label="Dishes" value={totals.dishes} />
        <StatCard icon="visibility" tone="gold" label="Public" value={totals.active} />
        <StatCard
          icon="format_list_numbered"
          tone="chocolate"
          label="Categories"
          value={totals.courses}
        />
        <StatCard
          icon="payments"
          tone="rose"
          label="Card value"
          value={formatMoney(totals.publicValue, totals.currency)}
        />
      </StatGrid>

      {notice && !(creating || editing) && (
        <AdminNotice message={notice} onDismiss={() => setNotice(null)} />
      )}

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search dishes" />
      </AdminToolbar>

      {(creating || editing) && (
        <DishFormModal
          editing={Boolean(editing)}
          draft={draft}
          setDraft={setDraft}
          categories={categories ?? []}
          saving={saving}
          uploading={uploading}
          notice={notice}
          onDismissNotice={() => setNotice(null)}
          fileInputRef={fileInputRef}
          onFiles={handleFiles}
          onRemoveImage={removeImage}
          onSave={save}
          onClose={cancel}
        />
      )}

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
                    className="admin-table-row px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4 cursor-pointer"
                    onClick={() => setViewing(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setViewing(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${item.name}`}
                  >
                    {item.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element -- externally hosted Supabase Storage URLs
                      <img
                        src={item.images[0]}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    )}
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
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setViewing(item)}
                        className="admin-icon-btn admin-icon-btn--view"
                        title="View all details"
                        aria-label={`View details for ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        className={`admin-icon-btn admin-icon-btn--hide${item.is_active ? "" : " admin-icon-btn--hide-off"}`}
                        title={item.is_active ? "Hide from the public menu" : "Show on the public menu"}
                        aria-label={item.is_active ? `Hide ${item.name}` : `Show ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.is_active ? "public_off" : "restaurant_menu"}
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
                        className="admin-icon-btn"
                        title={`Delete ${item.name}`}
                        aria-label={`Delete ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {settingsOpen && (
        <MenuSettingsModal
          categories={categories ?? []}
          onClose={() => setSettingsOpen(false)}
          onChanged={reloadCategories}
        />
      )}

      {viewing && (
        <DishDetailModal
          item={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            startEdit(viewing);
            setViewing(null);
          }}
          onToggleActive={() => toggleActive(viewing)}
          onDelete={async () => {
            if (await remove(viewing)) setViewing(null);
          }}
        />
      )}
    </>
  );
}

function DishDetailModal({
  item,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  item: AdminMenuItem;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-4 bg-[#1a100c]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-detail-title"
        className="admin-panel w-[min(96vw,1100px)] max-h-[90dvh] overflow-y-auto p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 id="dish-detail-title" className="font-headline-lg text-[26px] truncate">
              {item.name}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={item.course} tone="accent" />
              {item.tag && <StatusBadge status={item.tag} tone="accent" />}
              <StatusBadge
                status={item.is_active ? "public" : "hidden"}
                tone={item.is_active ? "positive" : "neutral"}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="admin-icon-btn shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {item.images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {item.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- externally hosted Supabase Storage URLs
              <img key={url} src={url} alt="" className="w-24 h-24 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
          <DetailBlock label="Category" value={item.course} />
          <DetailBlock label="Price" value={formatMoney(item.price_pence, item.currency)} />
          <DetailBlock label="Sort order" value={String(item.sort_order)} />
          <DetailBlock label="Description" value={item.description || "—"} span />
          <DetailBlock label="Ingredients" value={item.ingredients || "—"} span />
          <DetailBlock label="Nutritional value" value={item.nutrition || "—"} span />
          <DetailBlock label="Added" value={formatDateTime(item.created_at)} />
          <DetailBlock label="Last updated" value={formatDateTime(item.updated_at)} />
          <DetailBlock label="ID" value={item.id} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-[var(--admin-border)]">
          <button type="button" onClick={onEdit} className="admin-btn-primary">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit dish
          </button>
          <button type="button" onClick={onToggleActive} className="admin-btn-ghost">
            <span className="material-symbols-outlined text-[18px]">
              {item.is_active ? "public_off" : "restaurant_menu"}
            </span>
            {item.is_active ? "Hide from public menu" : "Show on public menu"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="admin-btn-ghost !text-rose-600 hover:!border-rose-400 ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete dish
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  value,
  span = false,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "md:col-span-2 xl:col-span-3" : ""}>
      <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] mb-1">
        {label}
      </p>
      <p className="font-body-md text-sm text-[var(--admin-ink)] whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  );
}

function DishFormModal({
  editing,
  draft,
  setDraft,
  categories,
  saving,
  uploading,
  notice,
  onDismissNotice,
  fileInputRef,
  onFiles,
  onRemoveImage,
  onSave,
  onClose,
}: {
  editing: boolean;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  categories: AdminMenuCategory[];
  saving: boolean;
  uploading: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  onRemoveImage: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const canAddPhoto = draft.images.length < MAX_MENU_IMAGES;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-4 bg-[#1a100c]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-form-title"
        className="admin-panel w-[min(96vw,920px)] h-[92dvh] max-h-[92dvh] flex flex-col overflow-hidden p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5 shrink-0">
          <h2 id="dish-form-title" className="font-headline-lg text-[28px]">
            {editing ? "Edit dish" : "New dish"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="admin-icon-btn shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {notice && <AdminNotice message={notice} onDismiss={onDismissNotice} />}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label" htmlFor="menu-course">
                Category
              </label>
              <select
                id="menu-course"
                className="admin-field"
                value={draft.course}
                onChange={(e) => setDraft({ ...draft, course: e.target.value })}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-name">
                Name
              </label>
              <input
                id="menu-name"
                className="admin-field"
                maxLength={MENU_FIELD_LIMITS.dishName}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Truffle Arancini"
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-price">
                Price (£)
              </label>
              <input
                id="menu-price"
                className="admin-field"
                inputMode="decimal"
                maxLength={12}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="14.00"
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-order">
                Order
              </label>
              <input
                id="menu-order"
                className="admin-field"
                inputMode="numeric"
                maxLength={4}
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-label" htmlFor="menu-description">
                Description
              </label>
              <textarea
                id="menu-description"
                className="admin-field"
                rows={3}
                maxLength={MENU_FIELD_LIMITS.description}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="How it reads on the card."
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-ingredients">
                Ingredients <span className="opacity-60 normal-case">(optional)</span>
              </label>
              <textarea
                id="menu-ingredients"
                className="admin-field"
                rows={3}
                maxLength={MENU_FIELD_LIMITS.ingredients}
                value={draft.ingredients}
                onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                placeholder="Arborio rice, wild mushroom, truffle, parmesan"
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="menu-nutrition">
                Nutritional value <span className="opacity-60 normal-case">(optional)</span>
              </label>
              <input
                id="menu-nutrition"
                className="admin-field"
                maxLength={MENU_FIELD_LIMITS.nutrition}
                value={draft.nutrition}
                onChange={(e) => setDraft({ ...draft, nutrition: e.target.value })}
                placeholder="450 kcal · 12g protein · 18g fat"
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-label">Photos</label>
              <div className="flex flex-wrap items-center gap-3">
                {draft.images.map((url) => (
                  <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted Supabase Storage URLs */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(url)}
                      aria-label="Remove photo"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
                {canAddPhoto && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-lg border border-dashed border-[var(--admin-border)] flex flex-col items-center justify-center gap-0.5 text-[var(--admin-muted)] hover:border-[var(--admin-gold)] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {uploading ? "progress_activity" : "add_a_photo"}
                    </span>
                    <span className="text-[9px]">{uploading ? "…" : "Add"}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>
              <p className="text-xs text-[var(--admin-muted)] mt-2">
                Up to {MAX_MENU_IMAGES} photos, {MAX_MENU_IMAGE_MB}MB each (JPEG, PNG, WebP, GIF). The
                first photo is the main image.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[var(--admin-border)] shrink-0">
          <button type="button" onClick={onSave} disabled={saving} className="admin-btn-primary">
            {saving ? "Saving…" : editing ? "Save changes" : "Add to menu"}
          </button>
          <button type="button" onClick={onClose} className="admin-btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function isDuplicateCategoryName(
  name: string,
  categories: AdminMenuCategory[],
  excludeId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  return categories.some(
    (category) =>
      category.id !== excludeId && category.name.trim().toLowerCase() === normalized
  );
}

function MenuSettingsModal({
  categories,
  onClose,
  onChanged,
}: {
  categories: AdminMenuCategory[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addCategory() {
    const name = newName.trim();
    if (!name) return;
    if (isDuplicateCategoryName(name, categories)) {
      setError(`"${name}" already exists. Choose a different name.`);
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await adminApi.createMenuCategory(name);
      setNewName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that category.");
    } finally {
      setAdding(false);
    }
  }

  function startRename(category: AdminMenuCategory) {
    setRenamingId(category.id);
    setRenameValue(category.name);
  }

  async function saveRename(category: AdminMenuCategory) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === category.name) return;
    if (isDuplicateCategoryName(name, categories, category.id)) {
      setError(`"${name}" already exists. Choose a different name.`);
      return;
    }
    setBusyId(category.id);
    setError(null);
    try {
      await adminApi.updateMenuCategory(category.id, { name });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename that category.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCategory(category: AdminMenuCategory) {
    if (category.dish_count > 0) {
      setError(
        `${category.dish_count} dish${category.dish_count === 1 ? "" : "es"} still use "${category.name}". Delete or move those dishes first.`
      );
      return;
    }
    if (!(await confirmDelete(`category "${category.name}"`))) return;
    setBusyId(category.id);
    setError(null);
    try {
      await adminApi.deleteMenuCategory(category.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that category.");
    } finally {
      setBusyId(null);
    }
  }

  const addNameClash = isDuplicateCategoryName(newName, categories);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-4 bg-[#1a100c]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-settings-title"
        className="admin-panel w-[min(96vw,1400px)] h-[92dvh] max-h-[92dvh] flex flex-col overflow-hidden p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6 shrink-0">
          <h2 id="menu-settings-title" className="font-headline-lg text-[28px]">
            Menu settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu settings"
            className="admin-icon-btn shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && <AdminNotice message={error} onDismiss={() => setError(null)} />}

        <section className="flex-1 min-h-0 overflow-y-auto">
          <h3 className="font-headline-md text-[18px] mb-4">Categories</h3>

          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="admin-field flex-1 min-w-[220px]"
                value={newName}
                maxLength={MENU_FIELD_LIMITS.categoryName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCategory();
                }}
                placeholder="New category, e.g. Desserts"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={adding || !newName.trim() || addNameClash}
                className="admin-btn-primary"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add category
              </button>
            </div>
            {addNameClash && (
              <p className="text-xs text-rose-600 mt-2">
                That name is already used by another category.
              </p>
            )}
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No categories yet — add the first one above.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-[var(--admin-border)] px-4 py-3 flex items-center gap-3"
                >
                  {renamingId === category.id ? (
                    <input
                      autoFocus
                      className="admin-field flex-1"
                      maxLength={MENU_FIELD_LIMITS.categoryName}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(category);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={() => saveRename(category)}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className="block font-body-md text-sm truncate">{category.name}</span>
                      {category.dish_count > 0 && (
                        <span className="block text-xs text-[var(--admin-muted)] mt-0.5">
                          {category.dish_count} dish{category.dish_count === 1 ? "" : "es"}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => startRename(category)}
                    disabled={busyId === category.id}
                    className="admin-icon-btn"
                    aria-label={`Rename ${category.name}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={busyId === category.id || category.dish_count > 0}
                    className="admin-icon-btn disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      category.dish_count > 0
                        ? `Cannot delete — ${category.dish_count} dish${category.dish_count === 1 ? "" : "es"} assigned`
                        : `Delete ${category.name}`
                    }
                    aria-label={
                      category.dish_count > 0
                        ? `Cannot delete ${category.name} — dishes still assigned`
                        : `Delete ${category.name}`
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
