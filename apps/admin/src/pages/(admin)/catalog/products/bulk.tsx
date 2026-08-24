import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  ImportColumnMapper,
  type ImportJob,
  ImportProgress,
  ImportResolvePanel,
  type ImportStep,
  ImportStepper,
  ImportSummary,
  type ImportTargetField,
  ImportUpload,
  type ResolveDecision,
  resolveImportJob,
  runImportJob,
  type UploadImportResult,
  type ValidateImportResult,
  validateImportJob,
} from "@/modules/imports";

export const Route = createFileRoute("/(admin)/catalog/products/bulk")({
  component: BulkImportPage,
});

/**
 * `runImportJob` runs every batch inside one request/response cycle and
 * returns the finished job — there's no separate in-flight state to poll for
 * (see `imports.service.ts: runJob`, which loops chunks synchronously
 * server-side). The "import" step therefore shows the pre-run counts while
 * the request is in flight, then jumps straight to "done" once it resolves.
 */
function BulkImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<ImportStep>("upload");
  const [upload, setUpload] = useState<UploadImportResult | null>(null);
  const [validation, setValidation] = useState<ValidateImportResult | null>(
    null,
  );
  const [decisions, setDecisions] = useState<{
    brandDecisions: ResolveDecision[];
    categoryDecisions: ResolveDecision[];
  }>({ brandDecisions: [], categoryDecisions: [] });
  const [pending, setPending] = useState(false);

  const activeJob: ImportJob | null = validation?.job ?? upload?.job ?? null;

  const stepCaption = (() => {
    if (step === "resolve" && validation) {
      const unresolved =
        validation.unresolvedBrands.length +
        validation.unresolvedCategories.length;
      return `${validation.readyProductCount} ready · ${unresolved} unresolved · ${validation.rowErrors.length} row errors`;
    }
    return undefined;
  })();

  const handleUploaded = (result: UploadImportResult) => {
    setUpload(result);
    setStep("map");
  };

  const handleValidate = async (
    columnMapping: Record<string, ImportTargetField>,
  ) => {
    if (!upload) return;
    setPending(true);
    try {
      const result = await validateImportJob(upload.job.id, columnMapping);
      setValidation(result);
      const hasUnresolved =
        result.unresolvedBrands.length > 0 ||
        result.unresolvedCategories.length > 0;
      if (hasUnresolved) {
        setStep("resolve");
      } else {
        await startImport(upload.job.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not validate the sheet.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleResolveContinue = async () => {
    if (!upload) return;
    setPending(true);
    try {
      const result = await resolveImportJob(upload.job.id, decisions);
      setValidation((prev) =>
        prev
          ? {
              ...prev,
              job: result.job,
              readyProductCount: result.readyProductCount,
            }
          : prev,
      );
      await startImport(upload.job.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not apply decisions.",
      );
    } finally {
      setPending(false);
    }
  };

  const startImport = async (jobId: string) => {
    setStep("import");
    try {
      const { job } = await runImportJob(jobId);
      setValidation((prev) => (prev ? { ...prev, job } : prev));
      setUpload((prev) => (prev ? { ...prev, job } : prev));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      setStep("done");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import failed to run.",
      );
      setStep("resolve");
    }
  };

  const reset = () => {
    setStep("upload");
    setUpload(null);
    setValidation(null);
    setDecisions({ brandDecisions: [], categoryDecisions: [] });
  };

  return (
    <>
      <PageHeader
        title="Bulk import products"
        description="Upload a CSV or Excel sheet to create many products at once."
      />

      <div className="mt-2 mb-4">
        <ImportStepper current={step} caption={stepCaption} />
      </div>

      {step === "upload" && <ImportUpload onUploaded={handleUploaded} />}

      {step === "map" && upload && (
        <ImportColumnMapper
          headers={upload.headers}
          suggestedMapping={upload.suggestedMapping}
          sampleRows={upload.sampleRows}
          onBack={reset}
          onConfirm={handleValidate}
          pending={pending}
        />
      )}

      {step === "resolve" && validation && (
        <ImportResolvePanel
          unresolvedBrands={validation.unresolvedBrands}
          unresolvedCategories={validation.unresolvedCategories}
          rowErrors={validation.rowErrors}
          readyProductCount={validation.readyProductCount}
          onDecisionsChange={setDecisions}
          onBack={() => setStep("map")}
          onContinue={handleResolveContinue}
          pending={pending}
        />
      )}

      {step === "import" && (
        <ImportProgress
          rowCount={validation?.readyProductCount ?? activeJob?.totalRows ?? 0}
        />
      )}

      {step === "done" && activeJob && (
        <ImportSummary
          job={activeJob}
          onImportAnother={reset}
          onGoToProducts={() => navigate({ to: "/catalog/products" })}
        />
      )}
    </>
  );
}
