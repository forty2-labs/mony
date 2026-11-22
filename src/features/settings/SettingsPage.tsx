import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { normaliseTransferNames, type ProfilePatch } from '@/features/profile/api';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { Modal } from '@/shared/components/Modal';
import { PageHeader } from '@/shared/components/PageHeader';
import { Select } from '@/shared/components/Select';
import { useToast } from '@/shared/components/Toast';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

import { deleteAccount, downloadBlob, exportAllData } from './accountData';
import { isDemoAccount } from './demoAccount';

const TIMEOUT_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 240, label: '4 hours' },
  { value: 0, label: 'Never' },
];

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-content-muted">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
      {children}
    </h2>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const demo = isDemoAccount(user);
  const toast = useToast();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  const [transferNames, setTransferNames] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const savedNames = profile.data?.internal_transfer_names.join(', ') ?? '';
  useEffect(() => setTransferNames(savedNames), [savedNames]);

  const save = (patch: ProfilePatch, message: string) =>
    updateProfile.mutate(patch, {
      onSuccess: () => toast.success(message),
      onError: () => toast.error('Couldn’t save that setting. Please try again.'),
    });

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAllData();
      downloadBlob(blob, `mony-export-${new Date().toISOString().slice(0, 10)}.json`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage appearance, account and your data." />

      <div className="space-y-6">
        <section>
          <SectionTitle>Appearance</SectionTitle>
          <div className="card divide-y divide-border">
            <Row title="Theme" description="Light, dark, or follow your system.">
              <ThemeToggle />
            </Row>
          </div>
        </section>

        <section>
          <SectionTitle>Account</SectionTitle>
          <div className="card divide-y divide-border">
            <Row title="Email">
              <span className="text-sm text-content-muted">{user?.email}</span>
            </Row>
            <Row title="Base currency" description="Totals and budgets are shown in this currency.">
              <span className="text-sm text-content-muted">{BASE_CURRENCY}</span>
            </Row>
            <Row title="Auto-logout" description="Sign out after this long without activity.">
              <Select
                aria-label="Auto-logout"
                value={profile.data?.inactivity_timeout_minutes ?? ''}
                disabled={!profile.data || updateProfile.isPending}
                onChange={(v) =>
                  save({ inactivity_timeout_minutes: Number(v) }, 'Auto-logout updated.')
                }
                wrapperClassName="w-40"
              >
                {TIMEOUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Row>
          </div>
        </section>

        <section>
          <SectionTitle>Imports</SectionTitle>
          <form
            className="card space-y-3 px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              save(
                { internal_transfer_names: normaliseTransferNames(transferNames) },
                'Transfer names saved.',
              );
            }}
          >
            <div>
              <label htmlFor="transferNames" className="text-sm font-medium">
                Your own account names
              </label>
              <p className="mt-0.5 text-xs text-content-muted">
                Names that appear on statements when you move money between your own accounts
                (usually your own name). Matching rows are left unticked during import so transfers
                aren’t counted as spending. Separate names with commas.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="transferNames"
                className="input"
                placeholder="e.g. Jane Doe, J DOE"
                maxLength={1000}
                value={transferNames}
                onChange={(e) => setTransferNames(e.target.value)}
                disabled={!profile.data}
              />
              <button
                type="submit"
                className="btn-primary shrink-0"
                disabled={!profile.data || updateProfile.isPending || transferNames === savedNames}
              >
                Save
              </button>
            </div>
          </form>
        </section>

        <section>
          <SectionTitle>Your data</SectionTitle>
          <div className="card divide-y divide-border">
            <Row
              title="Export all data"
              description="Download everything stored in your account as a JSON file."
            >
              <button
                className="btn-ghost border border-border"
                onClick={() => void onExport()}
                disabled={exporting}
              >
                {exporting ? 'Preparing…' : 'Export'}
              </button>
            </Row>
            <Row title="Sign out" description="End this session on this device.">
              <button onClick={() => void signOut()} className="btn-ghost border border-border">
                Sign out
              </button>
            </Row>
            <Row
              title="Delete account"
              description={
                demo
                  ? 'This is the shared demo account, so it can’t be deleted. Create your own account to try this.'
                  : 'Permanently delete your account and all of your data. This can’t be undone.'
              }
            >
              <button
                className="btn-ghost border border-danger/40 text-danger"
                onClick={() => setDeleteOpen(true)}
                disabled={demo}
              >
                Delete account
              </button>
            </Row>
          </div>
        </section>
      </div>

      <DeleteAccountModal
        open={deleteOpen}
        email={user?.email ?? ''}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function DeleteAccountModal({
  open,
  email,
  onClose,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
}) {
  const { signOut } = useAuth();
  const toast = useToast();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped('');
      setNeedsReauth(false);
    }
  }, [open]);

  const matches = email !== '' && typed.trim().toLowerCase() === email.toLowerCase();

  const onDelete = async () => {
    setBusy(true);
    try {
      const result = await deleteAccount(typed);
      if (result === 'reauthenticate') setNeedsReauth(true);
      else if (result === 'mismatch') toast.error('That email doesn’t match your account.');
      else if (result === 'demo') toast.error('The demo account can’t be deleted.');
      else {
        // The server has already removed the user; clear the local session too.
        await signOut().catch(() => {});
        toast.success('Your account and all of its data have been deleted.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Delete your account?">
      {needsReauth ? (
        <div className="space-y-4 text-sm">
          <p>
            For your security, deleting an account needs a recent sign-in. Sign in again, then come
            back to Settings to delete your account.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => void signOut()}>
              Sign in again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <p>
            This permanently deletes your account and everything in it: transactions, categories,
            budgets, loans, savings goals, subscriptions and import settings. It can’t be undone, so
            consider exporting your data first.
          </p>
          <div>
            <label htmlFor="confirmEmail" className="mb-1.5 block font-medium">
              Type <span className="font-mono">{email}</span> to confirm
            </label>
            <input
              id="confirmEmail"
              className="input"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn-primary bg-danger hover:bg-danger/90"
              onClick={() => void onDelete()}
              disabled={!matches || busy}
            >
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
