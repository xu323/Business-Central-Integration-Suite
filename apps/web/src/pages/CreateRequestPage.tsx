import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

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
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: "",
    requester: "demo.user",
    department: "IT",
    vendor_no: "V0001",
    vendor_name: "Acme IT Supplies",
    currency_code: "TWD",
    required_date: "",
  });
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);

  const updateLine = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        required_date: form.required_date ? new Date(form.required_date).toISOString() : null,
        lines: lines.map((line, idx) => ({
          line_no: (idx + 1) * 10000,
          ...line,
        })),
      };
      const created = await api.createRequest(payload);
      navigate(`/requests/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const total = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Create Purchase Request</h2>
        <p className="text-sm text-slate-500 mt-1">
          Save the request as Draft, then submit for approval.
        </p>
      </div>

      {error && (
        <div className="card p-4 border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Office laptops Q2"
                required
              />
            </div>
            <div>
              <label className="label">Required Date</label>
              <input
                type="date"
                className="input"
                value={form.required_date}
                onChange={(e) => setForm({ ...form, required_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Requester</label>
              <input
                className="input"
                value={form.requester}
                onChange={(e) => setForm({ ...form, requester: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Department</label>
              <input
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Vendor No.</label>
              <input
                className="input"
                value={form.vendor_no}
                onChange={(e) => setForm({ ...form, vendor_no: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Vendor Name</label>
              <input
                className="input"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Currency</label>
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
            <h3 className="text-sm font-semibold text-slate-700">Lines</h3>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setLines([...lines, emptyLine()])}
            >
              ➕ Add Line
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left py-2">Item No.</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-left py-2">UoM</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const amount = line.quantity * line.unit_price;
                  return (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-2 pr-2">
                        <input
                          className="input"
                          value={line.item_no}
                          onChange={(e) => updateLine(idx, { item_no: e.target.value })}
                          placeholder="ITEM-XXX"
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
                            className="text-rose-500 text-xs hover:underline"
                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td colSpan={5} className="py-3 text-right text-slate-600">
                    Total
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
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
