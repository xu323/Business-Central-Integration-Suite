import { Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useCurrentUser } from "@/auth/useCurrentUser";
import { InlineSpinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatError, notify } from "@/lib/notify";

interface LineForm {
  item_no: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
}

const emptyLine = (): LineForm => ({
  item_no: "",
  description: "",
  quantity: 1,
  unit_of_measure: "PCS",
  unit_price: 0,
});

export function CreateRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: "",
    department: user?.department ?? "",
    vendor_no: "",
    vendor_name: "",
    currency_code: "TWD",
    required_date: "",
  });
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);

  const updateLine = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        requester: user.id,
        vendor_name: form.vendor_name,
        required_date: form.required_date ? new Date(form.required_date).toISOString() : null,
        lines: lines.map((line, idx) => ({
          line_no: (idx + 1) * 10000,
          ...line,
        })),
      };
      const created = await api.createRequest(payload);
      notify.success(t("notify.created", { number: created.number }), {
        action: {
          label: t("notify.viewAction"),
          onClick: () => navigate(`/requests/${created.id}`),
        },
      });
      navigate(`/requests/${created.id}`);
    } catch (err) {
      const { code, message } = formatError(err);
      notify.error(t("notify.errorWithCode", { code, message }));
    } finally {
      setSubmitting(false);
    }
  };

  const total = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-neutral-190">{t("create.title")}</h2>
        <p className="text-sm text-neutral-130 mt-1">{t("create.subtitle")}</p>
        {user && (
          <p className="text-xs text-neutral-130 mt-1.5">
            {t("create.identityHint", { name: user.name })}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label label-required">{t("create.fields.description")}</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("create.placeholders.description")}
                required
              />
            </div>
            <div>
              <label className="label">{t("create.fields.requiredDate")}</label>
              <input
                type="date"
                className="input"
                value={form.required_date}
                onChange={(e) => setForm({ ...form, required_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t("create.fields.requester")}</label>
              <input
                className="input bg-neutral-10 cursor-not-allowed"
                value={user?.name ?? ""}
                readOnly
                disabled
                aria-label={t("create.fields.requester")}
              />
            </div>
            <div>
              <label className="label">{t("create.fields.department")}</label>
              <input
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
              <div>
                <label className="label">{t("create.fields.vendorNo")}</label>
                <input
                  className="input"
                  value={form.vendor_no}
                  onChange={(e) => setForm({ ...form, vendor_no: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t("create.fields.vendorName")}</label>
                <input
                  className="input"
                  value={form.vendor_name}
                  onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                  placeholder={t("create.placeholders.vendorSearch")}
                />
              </div>
              <button
                type="button"
                className="btn-outline h-[38px]"
                title={t("common.search")}
                onClick={() =>
                  // TODO: backend endpoint /api/vendors/search — Phase 4 will replace with VendorLookupDialog
                  notify.info(t("common.search"), { description: t("common.featureStub") })
                }
              >
                <Search size={16} strokeWidth={1.75} />
                {t("common.search")}
              </button>
            </div>
            <div>
              <label className="label">{t("create.fields.currency")}</label>
              <input
                className="input"
                value={form.currency_code}
                onChange={(e) => setForm({ ...form, currency_code: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-160">{t("create.lines")}</h3>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setLines([...lines, emptyLine()])}
            >
              <Plus size={14} strokeWidth={1.75} />
              {t("create.addLine")}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold text-neutral-130">
                <tr className="border-b border-neutral-20">
                  <th className="text-left py-2">{t("create.lineColumns.itemNo")}</th>
                  <th className="text-left py-2">{t("create.lineColumns.description")}</th>
                  <th className="text-right py-2">{t("create.lineColumns.quantity")}</th>
                  <th className="text-left py-2">{t("create.lineColumns.uom")}</th>
                  <th className="text-right py-2">{t("create.lineColumns.unitPrice")}</th>
                  <th className="text-right py-2">{t("create.lineColumns.amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const amount = line.quantity * line.unit_price;
                  return (
                    <tr key={idx} className="border-t border-neutral-20">
                      <td className="py-2 pr-2">
                        <input
                          className="input"
                          value={line.item_no}
                          onChange={(e) => updateLine(idx, { item_no: e.target.value })}
                          placeholder={t("create.placeholders.itemNo")}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="input"
                          value={line.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2 w-24">
                        <input
                          type="number"
                          className="input text-right"
                          value={line.quantity}
                          min={0}
                          onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-2 w-20">
                        <input
                          className="input"
                          value={line.unit_of_measure}
                          onChange={(e) => updateLine(idx, { unit_of_measure: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2 w-32">
                        <input
                          type="number"
                          className="input text-right"
                          value={line.unit_price}
                          min={0}
                          onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-medium">
                        {amount.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            className="text-danger hover:bg-danger-bg rounded p-1.5"
                            title={t("create.remove")}
                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={cn("border-t-2 border-neutral-40 font-semibold")}>
                  <td colSpan={5} className="py-3 text-right text-neutral-130">
                    {t("create.total")}
                  </td>
                  <td className="py-3 text-right">{total.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            <X size={14} strokeWidth={1.75} />
            {t("create.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting || !user}>
            {submitting && <InlineSpinner />}
            {submitting ? t("create.saving") : t("create.saveDraft")}
          </button>
        </div>
      </form>
    </div>
  );
}
