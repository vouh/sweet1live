"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  AdminErrorModal,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  AdminToolbar,
  StatusBadge,
  useAdminResource,
} from "@/components/admin/AdminUI";
import {
  AdminBulkBar,
  AdminDetailModal,
  AdminRowCheckbox,
  AdminSelectHeader,
  confirmDelete,
  staffMemberDetailFields,
  useBulkSelect,
} from "@/components/admin/AdminTableTools";
import {
  adminApi,
  type AdminAuditLog,
  type AdminPermission,
  type AdminRole,
  type AdminStaffMember,
} from "@/lib/adminApi";
import {
  INPUT_LIMITS,
  validateJobTitle,
  validateLocation,
  validateName,
  validateNotes,
  validatePhone,
} from "@/lib/inputValidation";
import { isStrongPassword, passwordIssues } from "@/lib/passwordPolicy";

type Tab = "staff" | "roles" | "audit";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("staff");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(() => adminApi.rbacPermissions(), []);
  const { data: permissions, initialising: loadingPerms } = useAdminResource(loadPermissions, []);

  const loadRoles = useCallback(() => adminApi.rbacRoles(), []);
  const {
    data: roles,
    reload: reloadRoles,
    initialising: loadingRoles,
    refreshing: refreshingRoles,
  } = useAdminResource(loadRoles, []);

  const loadStaff = useCallback(() => adminApi.rbacStaff(), []);
  const {
    data: staffList,
    reload: reloadStaff,
    initialising: loadingStaff,
    refreshing: refreshingStaff,
  } = useAdminResource(loadStaff, []);

  const loadAudit = useCallback(() => adminApi.rbacAuditLogs(), []);
  const {
    data: auditLogs,
    reload: reloadAudit,
    initialising: loadingAudit,
    refreshing: refreshingAudit,
  } = useAdminResource(loadAudit, []);

  const permsByCategory = useMemo(() => {
    const map = new Map<string, AdminPermission[]>();
    for (const perm of permissions ?? []) {
      const list = map.get(perm.category) ?? [];
      list.push(perm);
      map.set(perm.category, list);
    }
    return [...map.entries()];
  }, [permissions]);

  if (loadingPerms || loadingRoles || loadingStaff || loadingAudit) return <AdminLoading label="Loading settings…" />;

  return (
    <>
      <AdminPageHeader title="Settings" blurb="Roles, permissions, staff accounts, and security history." />

      <AdminToolbar>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={tab === "staff" ? "admin-btn-primary text-sm" : "admin-btn-ghost text-sm"}
          >
            Staff accounts
          </button>
          <button
            type="button"
            onClick={() => setTab("roles")}
            className={tab === "roles" ? "admin-btn-primary text-sm" : "admin-btn-ghost text-sm"}
          >
            Roles & permissions
          </button>
          <button
            type="button"
            onClick={() => setTab("audit")}
            className={tab === "audit" ? "admin-btn-primary text-sm" : "admin-btn-ghost text-sm"}
          >
            Audit trail
          </button>
        </div>
      </AdminToolbar>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}
      <AdminErrorModal error={error} onRetry={() => setError(null)} />

      {tab === "staff" ? (
        <StaffPanel
          staffList={staffList ?? []}
          roles={roles ?? []}
          refreshing={refreshingStaff}
          onRefresh={reloadStaff}
          onError={setError}
          onNotice={setNotice}
        />
      ) : tab === "roles" ? (
        <RolesPanel
          roles={roles ?? []}
          permsByCategory={permsByCategory}
          staffList={staffList ?? []}
          refreshing={refreshingRoles}
          onRefresh={reloadRoles}
          onError={setError}
          onNotice={setNotice}
        />
      ) : (
        <AuditPanel logs={auditLogs ?? []} refreshing={refreshingAudit} onRefresh={reloadAudit} />
      )}
    </>
  );
}

function AuditPanel({
  logs,
  refreshing,
  onRefresh,
}: {
  logs: AdminAuditLog[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="admin-panel overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--admin-border)]">
        <div>
          <h2 className="font-headline-md text-[20px]">Major activity</h2>
          <p className="text-sm text-[var(--admin-muted)] mt-1">Logins, reset links, password updates, and deletions.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing} className="admin-btn-ghost text-sm">
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="font-label-caps text-[10px] tracking-[0.15em] uppercase text-[var(--admin-muted)]">
            <tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Account</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">IP address</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="admin-table-row">
                <td className="px-5 py-4 text-sm whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-5 py-4"><StatusBadge status={log.action.replaceAll(".", " ")} /></td>
                <td className="px-5 py-4 text-sm">{log.actor_email || "System"}</td>
                <td className="px-5 py-4 text-sm"><p>{log.target || "—"}</p>{log.detail && <p className="text-xs text-[var(--admin-muted)] mt-1">{log.detail}</p>}</td>
                <td className="px-5 py-4 text-sm numeral">{log.ip_address || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-[var(--admin-muted)]">No audit activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StaffPanel({
  staffList,
  roles,
  refreshing,
  onRefresh,
  onError,
  onNotice,
}: {
  staffList: AdminStaffMember[];
  roles: AdminRole[];
  refreshing: boolean;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tempPassword, setTempPassword] = useState("1234");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [grantSuper, setGrantSuper] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const staffIds = staffList.map((s) => s.id);
  const bulk = useBulkSelect(staffIds);

  const selectableRoles = roles.filter((r) => !r.is_super_admin);
  const passwordHint = !sendInvite ? passwordIssues(tempPassword) : [];

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = [
      validateName(name),
      validatePhone(phone),
      validateLocation(location),
      validateJobTitle(jobTitle),
      validateNotes(notes),
    ].filter(Boolean);
    if (fieldErrors.length > 0) {
      onError(fieldErrors[0]!);
      return;
    }
    if (!sendInvite && !isStrongPassword(tempPassword)) {
      onError("Password must meet strength requirements when skipping the invite email.");
      return;
    }
    setBusy(true);
    try {
      await adminApi.createStaff({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        job_title: jobTitle.trim(),
        notes: notes.trim(),
        temp_password: tempPassword,
        role_ids: roleIds,
        grant_super_admin: grantSuper,
        send_invite: sendInvite,
      });
      setCreating(false);
      setName("");
      setEmail("");
      setPhone("");
      setLocation("");
      setJobTitle("");
      setNotes("");
      setTempPassword("1234");
      setRoleIds([]);
      setGrantSuper(false);
      setSendInvite(true);
      onNotice(
        sendInvite
          ? grantSuper
            ? "Super admin invite sent — check email."
            : "Invite sent."
          : grantSuper
            ? "Super admin account created — share the password directly."
            : "Account created — they can sign in with the password you set."
      );
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    if (bulk.count === 0) return;
    if (!(await confirmDelete("staff account", bulk.count))) return;
    setBulkBusy(true);
    try {
      const result = await adminApi.bulkDeleteStaff(bulk.selectedIds);
      bulk.clear();
      onNotice(`Deleted ${result.deleted} account${result.deleted === 1 ? "" : "s"}.`);
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete accounts.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body-md text-sm text-[var(--admin-muted)]">
          Send an invite email, or create the account directly with a strong password you share yourself.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="admin-btn-ghost text-sm" disabled={refreshing}>
            Refresh
          </button>
          <button type="button" onClick={() => setCreating((v) => !v)} className="admin-btn-primary text-sm">
            {creating ? "Cancel" : "Add staff member"}
          </button>
        </div>
      </div>

      {creating && (
        <form onSubmit={createAccount} className="admin-panel p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Full name</span>
              <input required maxLength={INPUT_LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Email</span>
              <input required type="email" maxLength={INPUT_LIMITS.email} value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Phone</span>
              <input maxLength={INPUT_LIMITS.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-input mt-1 w-full" placeholder="+44 7700 900123" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Location</span>
              <input maxLength={INPUT_LIMITS.location} value={location} onChange={(e) => setLocation(e.target.value)} className="admin-input mt-1 w-full" placeholder="London, UK" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Job title</span>
              <input maxLength={INPUT_LIMITS.jobTitle} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="admin-input mt-1 w-full" placeholder="Floor manager" />
            </label>
            <label className="block md:col-span-2">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Notes</span>
              <textarea maxLength={INPUT_LIMITS.notes} value={notes} onChange={(e) => setNotes(e.target.value)} className="admin-input mt-1 w-full min-h-[72px]" placeholder="Shift preferences, emergency contact, etc." />
            </label>
            <label className="block md:col-span-2">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
                {sendInvite ? "Temporary password (for invite email)" : "Password"}
              </span>
              <input required maxLength={INPUT_LIMITS.password} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="admin-input mt-1 w-full" />
              {!sendInvite && passwordHint.length > 0 && (
                <ul className="text-xs text-[var(--admin-muted)] mt-2 list-disc pl-5 space-y-0.5">
                  {passwordHint.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="admin-panel px-4 py-3 flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="invite-mode"
                checked={sendInvite}
                onChange={() => setSendInvite(true)}
                className="h-4 w-4 accent-[var(--admin-accent)]"
              />
              <span className="text-sm">Send invite email (they set password via link)</span>
            </label>
            <label className="admin-panel px-4 py-3 flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="invite-mode"
                checked={!sendInvite}
                onChange={() => setSendInvite(false)}
                className="h-4 w-4 accent-[var(--admin-accent)]"
              />
              <span className="text-sm">Skip email — create account with password above</span>
            </label>
          </div>

          <div>
            <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {selectableRoles.map((role) => (
                <label key={role.id} className="admin-panel px-3 py-2 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleIds.includes(role.id)}
                    onChange={() =>
                      setRoleIds((current) =>
                        current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id]
                      )
                    }
                    className="h-4 w-4 accent-[var(--admin-accent)]"
                  />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="admin-panel px-4 py-3 flex items-start gap-3 border-l-4 border-l-rose-600 cursor-pointer">
            <input
              type="checkbox"
              checked={grantSuper}
              onChange={(e) => setGrantSuper(e.target.checked)}
              className="mt-1 h-4 w-4 accent-rose-600"
            />
            <span>
              <span className="font-headline-md text-sm block">Grant Super Admin</span>
              <span className="font-body-md text-xs text-[var(--admin-muted)]">
                Full access to this dashboard and all permissions. This account cannot demote you later.
              </span>
            </span>
          </label>

          <button type="submit" disabled={busy || (!sendInvite && !isStrongPassword(tempPassword))} className="admin-btn-primary">
            {busy ? "Saving…" : sendInvite ? "Create & send invite" : "Create account"}
          </button>
        </form>
      )}

      <AdminBulkBar count={bulk.count} onDelete={bulkDelete} onClear={bulk.clear} busy={bulkBusy} noun="account" />

      <section className="admin-panel overflow-hidden">
        <header className="admin-table-head px-5 py-3 flex items-center gap-3 border-b border-[var(--admin-border)]">
          <AdminSelectHeader
            checked={bulk.allSelected}
            indeterminate={bulk.someSelected && !bulk.allSelected}
            onChange={bulk.toggleAll}
          />
          <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
            Select accounts for bulk delete
          </span>
        </header>
        <ul>
          {staffList.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              selected={bulk.selected.has(member.id)}
              onToggle={() => bulk.toggle(member.id)}
              onRefresh={onRefresh}
              onError={onError}
              onNotice={onNotice}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function StaffRow({
  member,
  selected,
  onToggle,
  onRefresh,
  onError,
  onNotice,
}: {
  member: AdminStaffMember;
  selected: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: member.name,
    phone: member.phone ?? "",
    location: member.location ?? "",
    job_title: member.job_title ?? "",
    notes: member.notes ?? "",
  });

  const isSuspended = member.status === "suspended" || member.status === "disabled";

  async function resend() {
    setBusy(true);
    try {
      await adminApi.resendStaffInvite(member.id);
      onNotice(`Invite resent to ${member.email}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not resend invite.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirmDelete(`staff account "${member.name}"`))) return;
    setBusy(true);
    try {
      await adminApi.deleteStaff(member.id);
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete account.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSuspend() {
    setBusy(true);
    try {
      if (isSuspended) {
        await adminApi.reactivateStaff(member.id);
        onNotice(`${member.name} reactivated.`);
      } else {
        await adminApi.suspendStaff(member.id);
        onNotice(`${member.name} suspended.`);
      }
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update account status.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = [
      validateName(draft.name),
      validatePhone(draft.phone),
      validateLocation(draft.location),
      validateJobTitle(draft.job_title),
      validateNotes(draft.notes),
    ].filter(Boolean);
    if (fieldErrors.length > 0) {
      onError(fieldErrors[0]!);
      return;
    }
    setBusy(true);
    try {
      await adminApi.updateStaff(member.id, {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        location: draft.location.trim(),
        job_title: draft.job_title.trim(),
        notes: draft.notes.trim(),
      });
      setEditing(false);
      onNotice("Account details updated.");
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <li className="admin-table-row px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <AdminRowCheckbox checked={selected} onChange={onToggle} label={`Select ${member.name}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-headline-md text-[16px]">{member.name}</p>
            {member.is_super_admin && <StatusBadge status="Super Admin" tone="accent" />}
            <StatusBadge
              status={isSuspended ? "Suspended" : member.status}
              tone={member.status === "active" ? "positive" : isSuspended ? "negative" : "neutral"}
            />
            {member.must_reset_password && <StatusBadge status="Password reset required" tone="pending" />}
          </div>
          <p className="text-sm text-[var(--admin-muted)]">{member.email}</p>
          {(member.phone || member.location || member.job_title) && (
            <p className="text-xs text-[var(--admin-muted)] mt-1">
              {[member.job_title, member.location, member.phone].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-xs text-[var(--admin-muted)] mt-1">{member.roles.join(", ") || "No roles"}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => setViewing(true)} disabled={busy} className="admin-icon-btn admin-icon-btn--view" title="View details">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button type="button" onClick={() => setEditing(true)} disabled={busy} className="admin-icon-btn admin-icon-btn--accent" title="Edit details">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button type="button" onClick={toggleSuspend} disabled={busy} className="admin-btn-ghost text-sm">
            {isSuspended ? "Reactivate" : "Suspend"}
          </button>
          <button type="button" onClick={resend} disabled={busy} className="admin-btn-ghost text-sm">
            Resend invite
          </button>
          <button type="button" onClick={remove} disabled={busy} className="admin-btn-ghost text-sm text-rose-600">
            Delete
          </button>
        </div>
      </li>

      <AdminDetailModal
        open={viewing}
        title={member.name}
        fields={staffMemberDetailFields(member)}
        onClose={() => setViewing(false)}
      />

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45" onClick={() => setEditing(false)} role="presentation">
          <form
            className="admin-panel w-full max-w-lg p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEdit}
          >
            <h3 className="font-headline-md text-[20px]">Edit account</h3>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Full name</span>
              <input required maxLength={INPUT_LIMITS.name} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Phone</span>
              <input maxLength={INPUT_LIMITS.phone} value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Location</span>
              <input maxLength={INPUT_LIMITS.location} value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Job title</span>
              <input maxLength={INPUT_LIMITS.jobTitle} value={draft.job_title} onChange={(e) => setDraft((d) => ({ ...d, job_title: e.target.value }))} className="admin-input mt-1 w-full" />
            </label>
            <label className="block">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Notes</span>
              <textarea maxLength={INPUT_LIMITS.notes} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="admin-input mt-1 w-full min-h-[72px]" />
            </label>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="admin-btn-ghost">Cancel</button>
              <button type="submit" disabled={busy} className="admin-btn-primary">{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function RolesPanel({
  roles,
  permsByCategory,
  staffList,
  refreshing,
  onRefresh,
  onError,
  onNotice,
}: {
  roles: AdminRole[];
  permsByCategory: [string, AdminPermission[]][];
  staffList: AdminStaffMember[];
  refreshing: boolean;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [name, setName] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const editableRoles = roles.filter((r) => !r.is_super_admin);
  const registeredEmails = staffList.map((s) => s.email);

  function startCreate() {
    setEditing({ id: "", name: "", is_super_admin: false, permission_ids: [], member_emails: [], created_at: "" });
    setName("");
    setPermissionIds([]);
    setMemberEmails([]);
  }

  function startEdit(role: AdminRole) {
    setEditing(role);
    setName(role.name);
    setPermissionIds(role.permission_ids);
    setMemberEmails(role.member_emails);
  }

  function togglePerm(id: string) {
    setPermissionIds((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id]
    );
  }

  async function saveRole(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) {
        await adminApi.updateRole(editing.id, { name, permission_ids: permissionIds, member_emails: memberEmails });
        onNotice("Role updated.");
      } else {
        await adminApi.createRole({ name, permission_ids: permissionIds });
        onNotice("Role created.");
      }
      setEditing(null);
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save role.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRole(role: AdminRole) {
    if (!(await confirmDelete(`role "${role.name}"`))) return;
    setBusy(true);
    try {
      await adminApi.deleteRole(role.id);
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete role.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body-md text-sm text-[var(--admin-muted)]">
          Create roles and tick the permissions each role should have. Assign registered staff emails to a role.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="admin-btn-ghost text-sm" disabled={refreshing}>
            Refresh
          </button>
          <button type="button" onClick={startCreate} className="admin-btn-primary text-sm">
            Add role
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveRole} className="admin-panel p-6 space-y-5">
          <label className="block max-w-md">
            <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">Role name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="admin-input mt-1 w-full" placeholder="e.g. Manager" />
          </label>

          {permsByCategory.map(([category, perms]) => (
            <div key={category}>
              <p className="font-headline-md text-[15px] mb-2">{category}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((perm) => (
                  <label key={perm.id} className="admin-panel px-3 py-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionIds.includes(perm.id)}
                      onChange={() => togglePerm(perm.id)}
                      className="h-4 w-4 accent-[var(--admin-accent)]"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {editing.id && (
            <div>
              <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] mb-2">Staff on this role</p>
              <div className="flex flex-wrap gap-2">
                {registeredEmails.map((email) => (
                  <label key={email} className="admin-panel px-3 py-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberEmails.includes(email)}
                      onChange={() =>
                        setMemberEmails((current) =>
                          current.includes(email) ? current.filter((e) => e !== email) : [...current, email]
                        )
                      }
                      className="h-4 w-4 accent-[var(--admin-accent)]"
                    />
                    <span className="text-sm">{email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="admin-btn-primary">
              {busy ? "Saving…" : editing.id ? "Save role" : "Create role"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="admin-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="admin-panel overflow-hidden">
        <ul>
          {roles.map((role) => (
            <li key={role.id} className="admin-table-row px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-headline-md text-[16px]">{role.name}</p>
                  {role.is_super_admin && <StatusBadge status="All permissions" tone="accent" />}
                </div>
                <p className="text-sm text-[var(--admin-muted)]">
                  {role.permission_ids.length} permissions · {role.member_emails.length} members
                </p>
              </div>
              {!role.is_super_admin && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(role)} className="admin-btn-ghost text-sm">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeRole(role)} className="admin-btn-ghost text-sm text-rose-600">
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
