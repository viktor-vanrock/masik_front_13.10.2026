/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { ROUTES } from './routes.constants';
import { LayoutWrapper } from "../components/layout/Layout";

import { BenchmarksCatalogue } from "@/pages/BenchmarksCatalogue";
import { Guide } from "@/pages/Guide";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Profile } from "@/pages/Profile";
import { Forbidden } from "@/pages/Forbidden";

import { AdminGuard } from "@/components/layout/AdminGuard";
import { AuthGuard } from "@/components/layout/AuthGuard";

// Lazy — loaded only when their route is matched (code-splitting).
const BenchmarkDetail = lazy(() =>
  import("@/pages/BenchmarkDetail").then((m) => ({ default: m.BenchmarkDetail })),
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const CreateBenchmark = lazy(() =>
  import("@/pages/BenchmarkCreate").then((m) => ({ default: m.CreateBenchmark })),
);
const NewBenchmark = lazy(() =>
  import("@/pages/NewBenchmark").then((m) => ({ default: m.NewBenchmark })),
);
const AdminPanel = lazy(() =>
  import("@/pages/AdminPanel").then((m) => ({ default: m.AdminPanel })),
);
const EditBenchmark = lazy(() =>
  import("@/pages/EditBenchmark").then((m) => ({ default: m.EditBenchmark })),
);
const AdminSettings = lazy(() =>
  import("@/pages/AdminSettings").then((m) => ({ default: m.AdminSettings })),
);

const withSuspense = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export const routes: RouteObject[] = [
  {
    element: <LayoutWrapper />,
    children: [
      { path: ROUTES.HOME, element: <BenchmarksCatalogue /> },
      { path: ROUTES.GUIDE, element: <Guide /> },
      { path: ROUTES.BENCHMARK(":id"), element: withSuspense(<BenchmarkDetail />) },
      { path: ROUTES.DASHBOARD, element: withSuspense(<Dashboard />) },
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
      { path: ROUTES.FORBIDDEN, element: <Forbidden /> },
      {
        element: <AuthGuard />,
        children: [
          { path: ROUTES.PROFILE, element: <Profile /> },
          { path: ROUTES.CREATE, element: withSuspense(<CreateBenchmark />) },
          { path: ROUTES.ADD_BENCHMARK, element: withSuspense(<NewBenchmark />) },
        ],
      },
    ],
  },
  {
    element: <AdminGuard />,
    children: [
      {
        element: <LayoutWrapper />,
        children: [
          { path: ROUTES.ADMIN, element: withSuspense(<AdminPanel />) },
          { path: ROUTES.ADMIN_EDIT(":id"), element: withSuspense(<EditBenchmark />) },
          { path: ROUTES.ADMIN_SETTINGS(":category", ":type"), element: withSuspense(<AdminSettings />) },
        ],
      },
    ],
  },
];
