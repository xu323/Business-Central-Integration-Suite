import { Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { AuditLogPage } from "@/pages/AuditLogPage";
import { CreateRequestPage } from "@/pages/CreateRequestPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RequestDetailPage } from "@/pages/RequestDetailPage";
import { RequestListPage } from "@/pages/RequestListPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/requests" element={<RequestListPage />} />
        <Route path="/requests/new" element={<CreateRequestPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
