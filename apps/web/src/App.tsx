import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { RequestListPage } from "@/pages/RequestListPage";
import { CreateRequestPage } from "@/pages/CreateRequestPage";
import { RequestDetailPage } from "@/pages/RequestDetailPage";
import { AuditLogPage } from "@/pages/AuditLogPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/requests" element={<RequestListPage />} />
        <Route path="/requests/new" element={<CreateRequestPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
