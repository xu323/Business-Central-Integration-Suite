import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Save, Search, SendHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { useCurrentUser } from "@/auth/useCurrentUser";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Combobox } from "@/components/Combobox";
import { ItemLookupDialog } from "@/components/lookup/ItemLookupDialog";
import { VendorLookupDialog } from "@/components/lookup/VendorLookupDialog";
import {
  CURRENCIES,
  DEPARTMENTS,
  UOMS,
} from "@/components/lookup/sample-data";
import { InlineSpinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatError, notify } from "@/lib/notify";
import { formatDate } from "@/lib/format";

// ---------------------------------------------------------------- schema

function buildSchema(t: (k: string) => string) {
  return z.object({
    description: z.string().min(5, t("create_v2.validation.descriptionMin")),
    department: z.string().optional().default(""),
    vendor_no: z.string().min(1, t("create_v2.validation.vendorRequired")),
    vendor_name: z.string().optional().default(""),
    currency_code: z.string().default("TWD"),
    required_date: z.string().refine(
      (s) => !s || new Date(s) >= new Date(new Date().toISOString().slice(0, 10)),
      t("create_v2.validation.requiredDatePast"),
    ),
    internal_note: z.string().optional().default(""),
    external_note: z.string().optional().default(""),
    lines: z
      .array(
        z.object({
          item_no: z.string().default(""),
          description: z.string().default(""),
          quantity: z.number().positive(t("create_v2.validation.lineQuantity")),
          unit_of_measure: z.string().default("PCS"),
          unit_price: z.number().nonnegative(t("create_v2.validation.lineUnitPrice")),
        }),
      )
      .min(1, t("create_v2.validation.linesRequired")),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const emptyLine = (): FormValues["lines"][number] => ({
  item_no: "",
  description: "",
  quantity: 1,
  unit_of_measure: "PCS",
  unit_price: 0,
});

// ---------------------------------------------------------------- page

export function CreateRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [itemPickerIndex, setItemPickerIndex] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const draftTimer = useRef<number | null>(null);

  const schema = useMemo(() => buildSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      department: user?.department ?? "",
      vendor_no: "",
      vendor_name: "",
      currency_code: "TWD",
      required_date: "",
      internal_note: "",
      external_note: "",
      lines: [emptyLine()],
    },
    mode: "onBlur",
  });

  // If we're cloning an existing request via ?clone=<id>, pre-fill.
  useEffect(() => {
    const cloneId = searchParams.get("clone");
    if (!cloneId) return;
    api
      .getRequest(cloneId)
      .then((src) => {
        form.reset({
          description: src.description,
          department: src.department || user?.department || "",
          vendor_no: src.vendor_no,
          vendor_name: src.vendor_name,
          currency_code: src.currency_code || "TWD",
          required_date: "",
          internal_note: "",
          external_note: "",
          lines: src.lines.length
            ? src.lines.map((l) => ({
                item_no: l.item_no,
                description: l.description,
                quantity: l.quantity,
                unit_of_measure: l.unit_of_measure || "PCS",
                unit_price: l.unit_price,
              }))
            : [emptyLine()],
        });
      })
      .catch((e) => {
        const { code, message } = formatError(e);
        notify.error(t("notify.errorWithCode", { code, message }));
      });
  }, [searchParams, form, user?.department, t]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = form.watch("lines");

  const total = useMemo(
    () => lines.reduce((acc, l) => acc + (l.quantity || 0) * (l.unit_price || 0), 0),
    [lines],
  );

  // Auto-save draft mock — every 30s after a change. Persists to localStorage.
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      draftTimer.current = window.setTimeout(() => {
        try {
          window.localStorage.setItem("bcsuite.createDraft", JSON.stringify(values));
          setSavedAt(new Date());
        } catch {
          // localStorage might be full — silently ignore.
        }
      }, 30_000);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // ---------------- handlers ----------------

  const submit = async (values: FormValues, autoSubmit: boolean) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        requester: user.id,
        required_date: values.required_date ? new Date(values.required_date).toISOString() : null,
        lines: values.lines.map((line, idx) => ({ line_no: (idx + 1) * 10000, ...line })),
      };
      const created = await api.createRequest(payload);
      window.localStorage.removeItem("bcsuite.createDraft");
      if (autoSubmit) {
        try {
          await api.submitRequest(created.id, user.id);
          notify.success(t("notify.submitted", { number: created.number }));
        } catch (err) {
          // Created but submit failed — still navigate to draft.
          const { code, message } = formatError(err);
          notify.error(t("notify.errorWithCode", { code, message }));
        }
      } else {
        notify.success(t("notify.created", { number: created.number }), {
          action: {
            label: t("notify.viewAction"),
            onClick: () => navigate(`/requests/${created.id}`),
          },
        });
      }
      navigate(`/requests/${created.id}`);
    } catch (err) {
      const { code, message } = formatError(err);
      notify.error(t("notify.errorWithCode", { code, message }));
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveDraft = form.handleSubmit((v) => submit(v, false));
  const onSubmitForApproval = form.handleSubmit((v) => submit(v, true));

  return (
    <div className="space-y-4 max-w-4xl">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.dashboard"), to: "/" },
          { label: t("breadcrumb.requests"), to: "/requests" },
          { label: t("breadcrumb.createRequest") },
        ]}
      />

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-neutral-190">{t("create.title")}</h2>
          <p className="text-sm text-neutral-130 mt-1">{t("create.subtitle")}</p>
          {user && (
            <p className="text-xs text-neutral-130 mt-1.5">
              {t("create.identityHint", { name: user.name })}
            </p>
          )}
        </div>
        {savedAt && (
          <span className="text-xs text-success font-medium">
            {t("create_v2.savedAt", { time: formatDate(savedAt) })}
          </span>
        )}
      </div>

      <form className="space-y-4" noValidate>
        {/* General + vendor */}
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label={t("create.fields.description")}
              required
              error={form.formState.errors.description?.message}
            >
              <input
                className="input"
                placeholder={t("create.placeholders.description")}
                {...form.register("description")}
              />
            </Field>
            <Field
              label={t("create.fields.requiredDate")}
              error={form.formState.errors.required_date?.message}
            >
              <input type="date" className="input" {...form.register("required_date")} />
            </Field>
            <Field label={t("create.fields.requester")}>
              <input
                className="input bg-neutral-20 cursor-not-allowed"
                value={user?.name ?? ""}
                readOnly
                disabled
              />
            </Field>
            <Field label={t("create.fields.department")}>
              <Controller
                control={form.control}
                name="department"
                render={({ field }) => (
                  <Combobox
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    allowCustom
                    placeholder={t("filters.department")}
                  />
                )}
              />
            </Field>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
              <Field
                label={t("create.fields.vendorNo")}
                required
                error={form.formState.errors.vendor_no?.message}
              >
                <input
                  className="input"
                  {...form.register("vendor_no")}
                  placeholder="V-50000"
                />
              </Field>
              <Field label={t("create.fields.vendorName")}>
                <input
                  className="input"
                  {...form.register("vendor_name")}
                  placeholder={t("create.placeholders.vendorSearch")}
                />
              </Field>
              <button
                type="button"
                className="btn-secondary h-8"
                onClick={() => setVendorOpen(true)}
              >
                <Search size={14} strokeWidth={1.75} />
                {t("common.search")}
              </button>
            </div>

            <Field label={t("create.fields.currency")}>
              <Controller
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <Combobox
                    options={CURRENCIES.map((c) => ({
                      value: c.code,
                      label: c.code,
                      description: c.name,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>
        </div>

        {/* Lines */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-190">{t("create.lines")}</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => append(emptyLine())}
            >
              <Plus size={14} strokeWidth={1.75} />
              {t("create.addLine")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold text-neutral-130 border-b border-neutral-30">
                <tr>
                  <th className="text-left py-2 px-2 w-[160px]">{t("create.lineColumns.itemNo")}</th>
                  <th className="text-left py-2 px-2">{t("create.lineColumns.description")}</th>
                  <th className="text-right py-2 px-2 w-24">{t("create.lineColumns.quantity")}</th>
                  <th className="text-left py-2 px-2 w-20">{t("create.lineColumns.uom")}</th>
                  <th className="text-right py-2 px-2 w-32">{t("create.lineColumns.unitPrice")}</th>
                  <th className="text-right py-2 px-2 w-28">{t("create.lineColumns.amount")}</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20">
                {fields.map((field, idx) => {
                  const line = lines[idx] ?? emptyLine();
                  const amount = (line.quantity || 0) * (line.unit_price || 0);
                  return (
                    <tr key={field.id} className="row-standard align-middle">
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            className="input text-xs font-mono"
                            placeholder={t("create.placeholders.itemNo")}
                            {...form.register(`lines.${idx}.item_no`)}
                          />
                          <button
                            type="button"
                            title={t("common.search")}
                            className="btn-subtle h-8 w-8 px-0 shrink-0"
                            onClick={() => setItemPickerIndex(idx)}
                          >
                            <Search size={12} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <input className="input" {...form.register(`lines.${idx}.description`)} />
                      </td>
                      <td className="py-1.5 px-2">
                        <Controller
                          control={form.control}
                          name={`lines.${idx}.quantity`}
                          render={({ field: f }) => (
                            <NumericFormat
                              className="input text-right tabular-nums"
                              value={f.value}
                              thousandSeparator
                              allowNegative={false}
                              decimalScale={2}
                              onValueChange={(v) => f.onChange(v.floatValue ?? 0)}
                            />
                          )}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Controller
                          control={form.control}
                          name={`lines.${idx}.unit_of_measure`}
                          render={({ field: f }) => (
                            <Combobox
                              options={UOMS.map((u) => ({ value: u, label: u }))}
                              value={f.value}
                              onChange={f.onChange}
                              allowCustom
                            />
                          )}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Controller
                          control={form.control}
                          name={`lines.${idx}.unit_price`}
                          render={({ field: f }) => (
                            <NumericFormat
                              className="input text-right tabular-nums"
                              value={f.value}
                              thousandSeparator
                              allowNegative={false}
                              decimalScale={2}
                              onValueChange={(v) => f.onChange(v.floatValue ?? 0)}
                            />
                          )}
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium tabular-nums">
                        {amount.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            className="btn-subtle h-8 w-8 px-0 text-danger"
                            title={t("create.remove")}
                            onClick={() => remove(idx)}
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
                  <td colSpan={5} className="py-2.5 px-2 text-right text-neutral-130">
                    {t("create.total")}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    {total.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {form.formState.errors.lines && typeof form.formState.errors.lines.message === "string" && (
            <p className="field-error">
              <AlertCircle size={12} strokeWidth={2} />
              {form.formState.errors.lines.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("create_v2.internalNote")}>
            <textarea
              className="input min-h-[80px]"
              placeholder={t("create_v2.internalNotePlaceholder")}
              {...form.register("internal_note")}
            />
          </Field>
          <Field label={t("create_v2.externalNote")}>
            <textarea
              className="input min-h-[80px]"
              placeholder={t("create_v2.externalNotePlaceholder")}
              {...form.register("external_note")}
            />
          </Field>
        </div>

        {/* Footer actions */}
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
          <button
            type="button"
            className="btn-secondary"
            onClick={onSaveDraft}
            disabled={submitting}
          >
            {submitting ? <InlineSpinner /> : <Save size={14} strokeWidth={1.75} />}
            {t("create.saveDraft")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onSubmitForApproval}
            disabled={submitting}
          >
            {submitting ? <InlineSpinner /> : <SendHorizontal size={14} strokeWidth={1.75} />}
            {t("create_v2.submitForApproval")}
          </button>
        </div>
      </form>

      <VendorLookupDialog
        open={vendorOpen}
        onOpenChange={setVendorOpen}
        onSelect={(v) => {
          form.setValue("vendor_no", v.no, { shouldValidate: true });
          form.setValue("vendor_name", v.name, { shouldValidate: true });
        }}
      />
      <ItemLookupDialog
        open={itemPickerIndex !== null}
        onOpenChange={(open) => {
          if (!open) setItemPickerIndex(null);
        }}
        onSelect={(it) => {
          if (itemPickerIndex == null) return;
          form.setValue(`lines.${itemPickerIndex}.item_no`, it.no);
          form.setValue(`lines.${itemPickerIndex}.description`, it.name);
          form.setValue(`lines.${itemPickerIndex}.unit_of_measure`, it.uom);
          form.setValue(`lines.${itemPickerIndex}.unit_price`, it.unitPrice);
          setItemPickerIndex(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Field

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={cn("label", required && "label-required")}>{label}</label>
      {children}
      {error && (
        <p className="field-error">
          <AlertCircle size={12} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}
