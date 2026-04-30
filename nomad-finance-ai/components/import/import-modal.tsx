"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FileDropzone } from "@/components/import/file-dropzone";
import {
  ImportPreviewTable,
  type ImportPreviewRow,
} from "@/components/import/import-preview-table";
import {
  importTransactions,
  type ImportTransactionsResult,
} from "@/app/actions/import-transactions";
import { DEMO_USER_ID } from "@/lib/demo";
import { detectFormat } from "@/lib/csv/detect-format";
import { parseGenericRows } from "@/lib/csv/parsers/generic";
import { parseRevolutRows } from "@/lib/csv/parsers/revolut";
import { parseWiseRows } from "@/lib/csv/parsers/wise";
import type {
  CSVFormat,
  ImportCategory,
  ParseResult,
  ParsedTransaction,
} from "@/lib/csv/types";
import { useDemoMode } from "@/lib/demo-context";
import { useWallets } from "@/lib/hooks/use-wallets";
import type { Transaction } from "@/types/database.types";

const importFormSchema = z.object({
  file: z.custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose a CSV file to import."
  ),
});

type ImportFormValues = z.infer<typeof importFormSchema>;
type ImportStep = "upload" | "categorizing" | "preview" | "success";
type CategorizationResult = {
  index: number;
  category: ImportCategory;
  confidence: number;
};

function parseRows(format: CSVFormat, rows: Record<string, unknown>[]) {
  switch (format) {
    case "revolut":
      return parseRevolutRows(rows);
    case "wise":
      return parseWiseRows(rows);
    case "generic":
      return parseGenericRows(rows);
  }
}

function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        try {
          const headers = result.meta.fields ?? [];
          const format = detectFormat(headers);
          const rows = result.data.filter((row) =>
            Object.values(row).some((value) => String(value ?? "").trim() !== "")
          );
          const transactions = parseRows(format, rows);
          const errors = result.errors.map((error) => ({
            row: error.row ?? 0,
            message: error.message,
          }));

          const skippedInvalidRows = rows.length - transactions.length;
          if (skippedInvalidRows > 0) {
            errors.push({
              row: 0,
              message: `${skippedInvalidRows} row(s) were skipped because required fields were missing or invalid.`,
            });
          }

          resolve({
            transactions,
            errors,
            format,
            totalRows: rows.length,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
    });
  });
}

function formatFormatName(format: CSVFormat): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

async function categorizeTransactions(
  transactions: ParsedTransaction[]
): Promise<CategorizationResult[]> {
  try {
    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    });

    if (!response.ok) throw new Error("Categorization failed");
    const data = (await response.json()) as CategorizationResult[];
    if (!Array.isArray(data)) throw new Error("Invalid categorization response");
    return data;
  } catch {
    return transactions.map((_, index) => ({
      index,
      category: "Other",
      confidence: 0,
    }));
  }
}

export function ImportModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] =
    useState<ImportTransactionsResult | null>(null);
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();
  const { data: wallets } = useWallets();
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
  });

  // #region agent log
  fetch('http://127.0.0.1:7275/ingest/7034276d-4c3f-45c5-87de-28cdb9aa5856',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'84e12d'},body:JSON.stringify({sessionId:'84e12d',runId:'pre-fix',hypothesisId:'H1,H3',location:'components/import/import-modal.tsx:ImportModal:render',message:'ImportModal render',data:{runtime:typeof window==='undefined'?'server':'client',open,step,isDemo,hasWallets:wallets!==undefined,walletCount:wallets?.length??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const button = triggerButtonRef.current;
    // #region agent log
    fetch('http://127.0.0.1:7275/ingest/7034276d-4c3f-45c5-87de-28cdb9aa5856',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'84e12d'},body:JSON.stringify({sessionId:'84e12d',runId:'post-fix',hypothesisId:'H1,H4',location:'components/import/import-modal.tsx:ImportModal:mounted-trigger',message:'ImportModal trigger mounted',data:{isMounted,ariaControls:button?.getAttribute('aria-controls')??null,ariaExpanded:button?.getAttribute('aria-expanded')??null,dataState:button?.getAttribute('data-state')??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [isMounted]);

  const mutation = useMutation<
    ImportTransactionsResult,
    Error,
    ParsedTransaction[]
  >({
    mutationFn: async (transactions) => {
      if (!isDemo) {
        return importTransactions(transactions);
      }

      const walletByCurrency = new Map(
        (wallets ?? []).map((wallet) => [wallet.currency, wallet])
      );
      const errors: string[] = [];
      let inserted = 0;

      for (const [index, transaction] of transactions.entries()) {
        if (walletByCurrency.has(transaction.currency)) {
          inserted++;
          continue;
        }

        errors.push(
          `Row ${index + 1}: no wallet found for ${transaction.currency}; skipped.`
        );
      }

      return { inserted, skipped: transactions.length - inserted, errors };
    },
    onSuccess: (result, transactions) => {
      if (isDemo) {
        const walletByCurrency = new Map(
          (wallets ?? []).map((wallet) => [wallet.currency, wallet])
        );
        const importedTransactions: Transaction[] = transactions.flatMap(
          (transaction, index) => {
            const wallet = walletByCurrency.get(transaction.currency);
            if (!wallet) return [];

            return {
              id: `demo-import-${Date.now()}-${index}`,
              user_id: DEMO_USER_ID,
              wallet_id: wallet.id,
              type: transaction.type,
              amount: Math.abs(transaction.amount),
              currency: wallet.currency,
              category: transaction.category ?? "Other",
              description: transaction.description || null,
              date: transaction.date.slice(0, 10),
              created_at: new Date().toISOString(),
            };
          }
        );

        queryClient.setQueryData<Transaction[]>(
          ["transactions", true],
          (current) => [...importedTransactions, ...(current ?? [])]
        );
      }

      setImportResult(result);
      setStep("success");
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ["transactions", isDemo] });
        queryClient.invalidateQueries({ queryKey: ["wallets", isDemo] });
      }
    },
  });

  const reset = () => {
    form.reset();
    mutation.reset();
    setStep("upload");
    setParseResult(null);
    setPreviewRows([]);
    setParseError(null);
    setImportResult(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleFileAccepted = async (file: File) => {
    form.setValue("file", file, { shouldValidate: true });
    setParseError(null);
    setParseResult(null);
    setPreviewRows([]);

    try {
      const result = await parseCsvFile(file);
      if (result.transactions.length === 0) {
        setParseError("No importable transactions were found in this CSV.");
        return;
      }
      setParseResult(result);
      setStep("categorizing");

      const categories = await categorizeTransactions(result.transactions);
      const byIndex = new Map(categories.map((item) => [item.index, item]));
      setPreviewRows(
        result.transactions.map((tx, index) => {
          const suggestion = byIndex.get(index);
          const confidence = suggestion?.confidence ?? 0;
          return {
            ...tx,
            category: suggestion?.category ?? "Other",
            confidence,
            needs_review: confidence < 0.7,
          };
        })
      );
      setStep("preview");
    } catch (error) {
      setStep("upload");
      setParseError(
        error instanceof Error ? error.message : "Unable to parse this CSV file."
      );
    }
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;
    mutation.mutate(previewRows);
  };

  const handleCategoryChange = (index: number, category: ImportCategory) => {
    setPreviewRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, category, needs_review: false, confidence: 1 }
          : row
      )
    );
  };

  if (!isMounted) {
    return (
      <Button
        ref={triggerButtonRef}
        type="button"
        className="border border-[#b8956a]/30 bg-[#b8956a] text-[#171412] shadow-sm hover:bg-[#c6a276]"
        aria-disabled="true"
      >
        <Upload className="size-4" aria-hidden="true" />
        Import CSV
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          ref={triggerButtonRef}
          type="button"
          className="border border-[#b8956a]/30 bg-[#b8956a] text-[#171412] shadow-sm hover:bg-[#c6a276]"
        >
          <Upload className="size-4" aria-hidden="true" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#b8956a]/20 bg-[#171412] text-[#f7efe3] shadow-2xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#f7efe3]">
            Import transactions
          </DialogTitle>
          <DialogDescription className="text-[#f7efe3]/60">
            Upload a CSV from Revolut, Wise, or a generic bank export. AI will
            suggest categories before you confirm the import.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <Form {...form}>
            <form className="space-y-4">
              <FileDropzone
                onFileAccepted={handleFileAccepted}
                disabled={mutation.isPending}
              />
              {form.formState.errors.file?.message && (
                <p className="text-sm text-red-300">
                  {form.formState.errors.file.message}
                </p>
              )}
              {parseError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{parseError}</p>
                </div>
              )}
            </form>
          </Form>
        )}

        {step === "categorizing" && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#b8956a]/20 bg-[#211d1a] p-8 text-center">
            <div className="relative flex size-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#b8956a]/20 border-t-[#b8956a]" />
              <div className="size-8 rounded-full bg-[#b8956a]/10" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[#f7efe3]">
              AI is categorizing your transactions...
            </h3>
            <p className="mt-2 max-w-sm text-sm text-[#f7efe3]/60">
              This usually takes a few seconds. Low-confidence suggestions will
              be marked for review before import.
            </p>
          </div>
        )}

        {step === "preview" && parseResult && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#b8956a]/20 bg-[#211d1a] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#b8956a]">
                  Preview
                </p>
                <p className="mt-1 text-lg font-semibold text-[#f7efe3]">
                  {previewRows.length} transactions ready to import
                </p>
              </div>
              <div className="text-sm text-[#f7efe3]/60">
                Format: {formatFormatName(parseResult.format)} - Total rows:{" "}
                {parseResult.totalRows}
              </div>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="rounded-2xl border border-[#b8956a]/20 bg-[#b8956a]/10 p-4 text-sm text-[#f7efe3]/75">
                <p className="font-medium text-[#f7efe3]">Parse notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {parseResult.errors.slice(0, 3).map((error, index) => (
                    <li key={`${error.row}-${index}`}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <ImportPreviewTable
              transactions={previewRows}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        )}

        {step === "success" && importResult && (
          <div className="rounded-3xl border border-[#b8956a]/20 bg-[#211d1a] p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-[#f7efe3]">
              Import complete
            </h3>
            <p className="mt-2 text-[#f7efe3]/60">
              {importResult.inserted} inserted - {importResult.skipped} skipped
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#b8956a]/20 bg-[#171412] p-4 text-left text-sm text-[#f7efe3]/70">
                <p className="font-medium text-[#f7efe3]">Notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-3">
          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="border-[#f7efe3]/20 bg-transparent text-[#f7efe3] hover:bg-[#f7efe3]/10 hover:text-[#f7efe3]"
                onClick={() => setStep("upload")}
                disabled={mutation.isPending}
              >
                Back
              </Button>
              <Button
                type="button"
                className="bg-[#b8956a] text-[#171412] hover:bg-[#c6a276]"
                onClick={handleConfirmImport}
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Confirm import
              </Button>
            </>
          )}

          {step === "success" && (
            <Button
              type="button"
              className="bg-[#b8956a] text-[#171412] hover:bg-[#c6a276]"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
