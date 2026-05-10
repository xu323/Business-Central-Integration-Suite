import { Compass, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Breadcrumb } from "@/components/Breadcrumb";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[{ label: t("breadcrumb.dashboard"), to: "/" }, { label: "404" }]}
      />
      <div className="card p-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="rounded-full bg-brand-50 p-4 text-brand-600 mb-3">
          <Compass size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-semibold text-neutral-190">404</h1>
        <p className="mt-2 text-sm text-neutral-130">{t("notFound.body")}</p>
        <p className="mt-1 text-xs font-mono text-neutral-90">{t("notFound.path", { path: window.location.pathname })}</p>
        <div className="mt-6 flex items-center gap-2">
          <Link to="/" className="btn-primary">
            <Home size={14} strokeWidth={1.75} />
            {t("notFound.backHome")}
          </Link>
          <Link to="/requests" className="btn-secondary">
            {t("breadcrumb.requests")}
          </Link>
        </div>
      </div>
    </div>
  );
}
