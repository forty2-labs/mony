import { useRef, useState } from 'react';

import monzoLogo from '@/assets/monzo.svg';
import revolutLogo from '@/assets/revolut.svg';
import wiseLogo from '@/assets/wise.png';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';

import type { BulkImportPayload } from './api';
import { AutoLogo, BankLogo } from './BankLogo';
import { useBulkImport } from './hooks';
import { ImportReviewModal } from './ImportReviewModal';
import { type ParseOutcome, PARSERS, parseStatement } from './parsers';

/** Real brand marks, shown as a faint corner watermark per card. */
const LOGOS: Record<string, string> = {
  monzo: monzoLogo,
  revolut: revolutLogo,
  wise: wiseLogo,
};

interface FormatOption {
  id: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: 'auto', description: 'Guess the bank from the file' },
  ...PARSERS.map((p) => ({ id: p.id, description: p.description })),
];

export function ImportPage() {
  const toast = useToast();
  const bulk = useBulkImport();
  const inputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<string>('auto');
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseStatement(text, format === 'auto' ? undefined : format);
      if (result.transactions.length === 0) {
        toast.error('No transactions found in that file.');
        return;
      }
      setOutcome(result);
      setReviewOpen(true);
      if (format === 'auto') setFormat(result.parserId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onConfirm = (payload: BulkImportPayload) => {
    bulk.mutate(payload, {
      onSuccess: (res) => {
        const parts = [];
        if (res.expenses) parts.push(`${res.expenses} expense${res.expenses === 1 ? '' : 's'}`);
        if (res.income) parts.push(`${res.income} income`);
        toast.success(`Imported ${parts.join(' and ') || 'nothing'}.`);
        setReviewOpen(false);
        setOutcome(null);
        setFileName(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Import failed'),
    });
  };

  return (
    <div>
      <PageHeader title="Import" subtitle="Bring in transactions from a bank CSV statement." />

      {/* Step 1 — pick the source bank */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-content-muted">
          <span className="mr-1.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs">1</span>
          Choose your bank
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FORMAT_OPTIONS.map((opt) => {
            const selected = format === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                aria-pressed={selected}
                className={cn(
                  'group relative flex flex-col gap-2.5 rounded-xl border text-left transition duration-300',
                  selected
                    ? 'border-brand bg-brand/5 ring-2 ring-brand/25'
                    : 'border-border hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft',
                )}
              >
                {selected && (
                  <span className="absolute -right-2 -top-2 z-20 grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-fg shadow-soft">
                    <Icon name="check" size={13} />
                  </span>
                )}
                <div className="overflow-hidden relative w-full h-full p-3 rounded-xl">
                  {LOGOS[opt.id] && (
                    <img
                      src={LOGOS[opt.id]}
                      alt=""
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 -rotate-[18deg] object-contain transition-opacity duration-300',
                        selected ? 'opacity-30' : 'opacity-[0.08] group-hover:opacity-25',
                      )}
                    />
                  )}
                  {opt.id === 'auto' ? <AutoLogo /> : <BankLogo id={opt.id} />}
                  <span className="px-0.5 text-xs text-content-muted">{opt.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — drop or choose the file */}
      <p className="mb-2 text-sm font-medium text-content-muted">
        <span className="mr-1.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs">2</span>
        Upload statement
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'card flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition',
          dragging ? 'border-brand bg-brand/5' : 'border-border',
        )}
      >
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name="import" size={28} />
        </span>
        <div>
          <p className="font-medium">Drop a CSV statement here</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">
            or choose a file to parse. Nothing is saved until you review and confirm.
          </p>
        </div>

        <button className="btn-primary mt-2" onClick={() => inputRef.current?.click()}>
          <Icon name="file" size={16} />
          Choose file
        </button>

        {fileName && (
          <p className="mt-1 text-xs text-content-muted">
            Last file: <span className="text-content">{fileName}</span>
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
      </div>

      <ImportReviewModal
        open={reviewOpen}
        outcome={outcome}
        onClose={() => setReviewOpen(false)}
        onConfirm={onConfirm}
        importing={bulk.isPending}
      />
    </div>
  );
}
