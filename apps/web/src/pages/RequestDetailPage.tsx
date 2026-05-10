import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Check,
  Copy,
  Download,
  Printer,
  RefreshCw,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import { hasRole, useCurrentUser, type UserRole } from "@/auth/useCurrentUser";
import { ApprovalTimeline } from "@/components/ApprovalTimeline";
import { Avatar } from "@/components/Avatar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { InlineSpinner } from "@/components/Spinner";
import {
  HighRiskBadge,
  StatusBadge,
} from "@/components/StatusBadge";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { exportPdf } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatError, notify } from "@/lib/notify";
import { pushRecent } from "@/lib/recent";
import type { AuditLog, PurchaseRequest } from "@/types";

type WorkflowOp = "submit" | "approve" | "reject" | "sync";

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [r, l] = await Promise.all([
        api.getRequest(id),
        api.listAuditLogs({ target_id: id }),
      ]);
      setRequest(r);
      setLogs(l);
      pushRecent({ id: r.id, number: r.number, description: r.description });
    } catch (e) {
      const { code, message } = formatError(e);
      notify.error(t("notify.errorWithCode", { code, message }));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const action = async (op: WorkflowOp) => {
    if (!request || !user) return;
    setBusy(op);
    try {
      let updated: PurchaseRequest;
      switch (op) {
        case "submit":
          updated = await api.submitRequest(request.id, user.id);
          notify.success(t("notify.submitted", { number: updated.number }));
          break;
        case "approve":
          updated = await api.approveRequest(request.id, user.id, comment);
          notify.success(t("notify.approved", { number: updated.number }));
          break;
        case "reject":
          updated = await api.rejectRequest(request.id, user.id, comment);
          notify.success(t("notify.rejected", { number: updated.number }));
          break;
        case "sync":
          updated = await api.syncRequest(request.id);
          notify.success(t("notify.synced", { number: updated.number }));
          break;
      }
      await refresh();
    } catch (e) {
      const { code, message } = formatError(e);
      notify.error(t("notify.errorWithCode", { code, message }), {
        action: { label: t("notify.retryAction"), onClick: () => void action(op) },
      });
    } finally {
      setBusy("");
    }
  };

  const onDelete = async () => {
    if (!request) return;
    setDeleting(true);
    try {
      await api.deleteRequest(request.id);
      notify.success(t("notify.deleted", { number: request.number }));
      navigate("/requests");
    } catch (e) {
      const { code, message } = formatError(e);
      notify.error(t("notify.errorWithCode", { code, message }));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const onCopyAsNew = () => {
    if (!request) return;
    navigate(`/requests/new?clone=${request.id}`);
  };

  const onDownloadPdf = () => {
    if (!request) return;
    exportPdf(
      request.lines,
      [
        { header: t("detail.lineColumns.item"), accessor: (l) => l.item_no },
        { header: t("detail.lineColumns.description"), accessor: (l) => l.description },
        { header: t("detail.lineColumns.qty"), accessor: (l) => l.quantity },
        { header: t("detail.lineColumns.unitPrice"), accessor: (l) => l.unit_price.toLocaleString() },
        { header: t("detail.lineColumns.amount"), accessor: (l) => l.line_amount.toLocaleString() },
      ],
      `purchase-request-${request.number}`,
      {
        title: `${t("requestList.title")} · ${request.number}`,
        subtitle: `${request.vendor_name || request.vendor_no} · ${formatCurrency(
          request.total_amount,
          request.currency_code,
        )} · ${t(`status.${request.status}`)}`,
      },
    );
  };

  if (loading) return <DetailSkeleton />;
  if (!request) return null;

  const canSubmit = request.status === "Draft";
  const canDecide = request.status === "Submitted";
  const canSync = request.status === "Approved";
  const canDelete = request.status === "Draft" || request.status === "Rejected";

  const isApprover = hasRole(user, "Approver");
  const isRequester = hasRole(user, "Requester") || hasRole(user, "Admin");

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.dashboard"), to: "/" },
          { label: t("breadcrumb.requests"), to: "/requests" },
          { label: request.number },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-neutral-190 flex items-center gap-3 flex-wrap">
            {request.number}
            <StatusBadge status={request.status} />
            {request.high_risk && <HighRiskBadge value />}
          </h2>
          <p className="text-sm text-neutral-130 mt-1">{request.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-130">{t("detail.total")}</div>
          <div className="text-2xl font-semibold text-neutral-190 tabular-nums">
            {formatCurrency(request.total_amount, request.currency_code)}
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div className="flex items-center gap-2 flex-wrap" data-no-print="true">
        <Link to="/requests" className="btn-subtle">
          ← {t("detail.back")}
        </Link>
        <span className="w-px h-5 bg-neutral-30 mx-1" />
        <button type="button" className="btn-secondary" onClick={onCopyAsNew}>
          <Copy size={14} strokeWidth={1.75} />
          {t("detail_v2.copyAsNew")}
        </button>
        <button type="button" className="btn-secondary" onClick={onDownloadPdf}>
          <Download size={14} strokeWidth={1.75} />
          {t("detail_v2.downloadPdf")}
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Printer size={14} strokeWidth={1.75} />
          {t("table.print")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Field label={t("detail.fields.requester")} value={request.requester} />
            <Field label={t("detail.fields.department")} value={request.department} />
            <Field
              label={t("detail.fields.vendor")}
              value={request.vendor_name || request.vendor_no}
            />
            <Field label={t("detail.fields.documentDate")} value={formatDate(request.document_date)} />
            <Field label={t("detail.fields.requiredDate")} value={formatDate(request.required_date)} />
            <Field label={t("detail.fields.currency")} value={request.currency_code} />
            <Field label={t("detail.fields.submittedAt")} value={formatDate(request.submitted_at)} />
            <Field label={t("detail.fields.approver")} value={request.approver || "—"} />
            <Field label={t("detail.fields.decidedAt")} value={formatDate(request.decided_at)} />
            <Field label={t("detail.fields.bcDocumentId")} value={request.bc_document_id || "—"} />
            <Field label={t("detail.fields.syncedAt")} value={formatDate(request.synced_at)} />
            <Field label={t("detail.fields.comment")} value={request.approval_comment || "—"} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-190 mb-2">{t("detail.lines")}</h3>
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold text-neutral-130 border-b border-neutral-30">
                <tr>
                  <th className="text-left py-2">{t("detail.lineColumns.item")}</th>
                  <th className="text-left py-2">{t("detail.lineColumns.description")}</th>
                  <th className="text-right py-2">{t("detail.lineColumns.qty")}</th>
                  <th className="text-right py-2">{t("detail.lineColumns.unitPrice")}</th>
                  <th className="text-right py-2">{t("detail.lineColumns.amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20">
                {request.lines.map((line) => (
                  <tr key={line.id} className="row-standard">
                    <td className="py-2 font-mono text-xs">{line.item_no}</td>
                    <td className="py-2">{line.description}</td>
                    <td className="py-2 text-right tabular-nums">{line.quantity}</td>
                    <td className="py-2 text-right tabular-nums">{line.unit_price.toLocaleString()}</td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      {line.line_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Tooltip.Provider delayDuration={200}>
          <div className="card p-4 space-y-4" data-no-print="true">
            <h3 className="text-sm font-semibold text-neutral-190">{t("detail.workflowActions")}</h3>

            {user && (
              <div className="rounded border border-brand-100 bg-brand-50 px-3 py-2 flex items-center gap-2">
                <Avatar id={user.id} name={user.name} size="sm" />
                <div className="text-xs text-neutral-160 leading-tight">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-neutral-130">
                    {t("detail.identityHint", {
                      name: user.name,
                      roles: user.roles.join(" · "),
                    })}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label">{t("detail.comment")}</label>
              <textarea
                className="input min-h-[80px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("detail.commentPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                className="btn-primary col-span-2"
                disabled={!canSubmit || !isRequester || busy !== ""}
                requireRole={!isRequester ? ("Requester" as UserRole) : null}
                onClick={() => action("submit")}
                busy={busy === "submit"}
              >
                <SendHorizontal size={14} strokeWidth={1.75} />
                {t("detail.submit")}
              </ActionButton>
              <ActionButton
                className="btn-success"
                disabled={!canDecide || !isApprover || busy !== ""}
                requireRole={!isApprover ? ("Approver" as UserRole) : null}
                onClick={() => action("approve")}
                busy={busy === "approve"}
              >
                <Check size={14} strokeWidth={2} />
                {t("detail.approve")}
              </ActionButton>
              <ActionButton
                className="btn-danger"
                disabled={!canDecide || !isApprover || busy !== ""}
                requireRole={!isApprover ? ("Approver" as UserRole) : null}
                onClick={() => action("reject")}
                busy={busy === "reject"}
              >
                <X size={14} strokeWidth={2} />
                {t("detail.reject")}
              </ActionButton>
              <ActionButton
                className="btn-outline col-span-2"
                disabled={!canSync || busy !== ""}
                requireRole={null}
                onClick={() => action("sync")}
                busy={busy === "sync"}
              >
                <RefreshCw
                  size={14}
                  strokeWidth={1.75}
                  className={cn(busy === "sync" && "animate-spin")}
                />
                {t("detail.syncToBC")}
              </ActionButton>
              {canDelete && (
                <button
                  type="button"
                  className="btn-outline col-span-2 text-danger border-danger-border hover:bg-danger-bg"
                  disabled={busy !== ""}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                  {t("detail.delete")}
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-130">{t("detail.transitionsHint")}</p>
          </div>
        </Tooltip.Provider>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-neutral-190 mb-3">
          {t("detail_v2.approvalTimeline")}
        </h3>
        <ApprovalTimeline logs={logs} />
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("detail.deleteDialog.title")}
        description={t("detail.deleteDialog.body", {
          number: request.number,
          amount: formatCurrency(request.total_amount, request.currency_code),
          lineCount: request.lines.length,
        })}
        destructive
        confirmationText={request.number}
        confirmationLabel={t("detail.deleteDialog.confirmation", { number: request.number })}
        confirmLabel={t("detail.deleteDialog.confirm")}
        loading={deleting}
        onConfirm={onDelete}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-neutral-130">{label}</div>
      <div className="mt-0.5 text-neutral-190 break-words">{value || "—"}</div>
    </div>
  );
}

function ActionButton({
  className,
  disabled,
  requireRole,
  onClick,
  busy,
  children,
}: {
  className: string;
  disabled: boolean;
  requireRole: UserRole | null;
  onClick: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const button = (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {busy ? <InlineSpinner /> : children}
    </button>
  );
  if (!requireRole || !disabled) return button;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span tabIndex={0} className="contents">
          {button}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          className="z-50 rounded bg-neutral-190 text-white text-xs px-2 py-1 shadow"
        >
          {t("detail.roleRequired", { role: requireRole })}
          <Tooltip.Arrow className="fill-neutral-190" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
