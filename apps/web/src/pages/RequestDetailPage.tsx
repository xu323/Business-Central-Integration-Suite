import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { HighRiskBadge, StatusBadge, SyncStatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import type { AuditLog, PurchaseRequest } from "@/types";

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actor, setActor] = useState<string>("manager");
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState<string>("");

  const refresh = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const [r, l] = await Promise.all([
        api.getRequest(id),
        api.listAuditLogs({ target_id: id }),
      ]);
      setRequest(r);
      setLogs(l);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const action = async (op: "submit" | "approve" | "reject" | "sync" | "delete") => {
    if (!request) return;
    setBusy(op);
    setError("");
    try {
      switch (op) {
        case "submit":
          await api.submitRequest(request.id, actor || request.requester);
          break;
        case "approve":
          await api.approveRequest(request.id, actor || "approver", comment);
          break;
        case "reject":
          await api.rejectRequest(request.id, actor || "approver", comment);
          break;
        case "sync":
          await api.syncRequest(request.id);
          break;
        case "delete":
          if (!confirm("Delete this request?")) {
            setBusy("");
            return;
          }
          await api.deleteRequest(request.id);
          navigate("/requests");
          return;
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (loading) return <Spinner />;
  if (error && !request) {
    return <div className="card p-6 border-rose-200 bg-rose-50 text-rose-700">{error}</div>;
  }
  if (!request) return null;

  const canSubmit = request.status === "Draft";
  const canDecide = request.status === "Submitted";
  const canSync = request.status === "Approved";
  const canDelete = request.status === "Draft" || request.status === "Rejected";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/requests" className="text-xs text-brand-600 hover:underline">
            ← Back to list
          </Link>
          <h2 className="text-xl font-semibold text-slate-800 mt-1 flex items-center gap-3">
            {request.number}
            <StatusBadge status={request.status} />
            {request.high_risk && <HighRiskBadge value />}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{request.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-semibold text-slate-800">
            {formatCurrency(request.total_amount, request.currency_code)}
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Field label="Requester" value={request.requester} />
            <Field label="Department" value={request.department} />
            <Field label="Vendor" value={request.vendor_name || request.vendor_no} />
            <Field label="Document Date" value={formatDate(request.document_date)} />
            <Field label="Required Date" value={formatDate(request.required_date)} />
            <Field label="Currency" value={request.currency_code} />
            <Field label="Submitted At" value={formatDate(request.submitted_at)} />
            <Field label="Approver" value={request.approver || "—"} />
            <Field label="Decided At" value={formatDate(request.decided_at)} />
            <Field
              label="BC Document ID"
              value={request.bc_document_id || "—"}
            />
            <Field label="Synced At" value={formatDate(request.synced_at)} />
            <Field label="Comment" value={request.approval_comment || "—"} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Lines</h3>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 font-mono text-xs">{line.item_no}</td>
                    <td className="py-2">{line.description}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">{line.unit_price.toLocaleString()}</td>
                    <td className="py-2 text-right font-medium">
                      {line.line_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Workflow Actions</h3>
          <div>
            <label className="label">Actor</label>
            <input
              className="input"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea
              className="input min-h-[80px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary col-span-2"
              disabled={!canSubmit || busy !== ""}
              onClick={() => action("submit")}
            >
              {busy === "submit" ? "…" : "📨 Submit"}
            </button>
            <button
              className="btn-success"
              disabled={!canDecide || busy !== ""}
              onClick={() => action("approve")}
            >
              {busy === "approve" ? "…" : "✓ Approve"}
            </button>
            <button
              className="btn-danger"
              disabled={!canDecide || busy !== ""}
              onClick={() => action("reject")}
            >
              {busy === "reject" ? "…" : "✗ Reject"}
            </button>
            <button
              className="btn-outline col-span-2"
              disabled={!canSync || busy !== ""}
              onClick={() => action("sync")}
            >
              {busy === "sync" ? "…" : "🔄 Sync to Business Central"}
            </button>
            {canDelete && (
              <button
                className="btn-outline col-span-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                disabled={busy !== ""}
                onClick={() => action("delete")}
              >
                Delete
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Allowed transitions: Draft → Submitted → (Approved | Rejected) → Synced.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Audit Trail</h3>
        {logs.length === 0 ? (
          <div className="text-sm text-slate-500">No audit entries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Actor</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Sync</th>
                <th className="text-left py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 text-xs text-slate-500">{formatDate(log.timestamp)}</td>
                  <td className="py-2">{log.actor}</td>
                  <td className="py-2 font-mono text-xs">{log.action}</td>
                  <td className="py-2">
                    <SyncStatusBadge status={log.sync_status} />
                  </td>
                  <td className="py-2 text-xs text-rose-600">{log.error_message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800 break-words">{value || "—"}</div>
    </div>
  );
}
