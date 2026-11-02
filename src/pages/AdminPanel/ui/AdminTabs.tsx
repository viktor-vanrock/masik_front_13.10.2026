import { useState } from "react";
import { useManagementBenchmarksQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { AdminBenchmarksTab } from "./AdminBenchmarksTab";
import { AdminValidationTab } from "./AdminValidationTab";
import { AdminCategoriesTab } from "./categories/AdminCategoriesTab";
import { AdminDictionariesTab } from "./AdminDictionariesTab";
import { AdminAnalyticsTab } from "./analytics/AdminAnalyticsTab";
import { AdminUsersTab } from './access/AdminUsersTab';
import { AdminApiKeysTab } from './access/AdminApiKeysTab';
import { isAdminRole, isSuperUserRole } from '@/utils/auth/roles';

type AdminTab =
  | 'benchmarks'
  | 'validation'
  | 'categories'
  | 'dictionaries'
  | 'analytics'
  | 'users'
  | 'apiKeys';

export function AdminTabs() {
  const { t, userRole } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('benchmarks');

  const { data } = useManagementBenchmarksQuery({ limit: 100 });
  const pendingValidation = (data?.data ?? []).filter(
    (b) => b.validationStatus === 'validation',
  ).length;

  const tabs: Array<{
    id: AdminTab;
    label: string;
    badge?: number;
  }> = [
    { id: 'benchmarks', label: t.admin.tabBenchmarks },
    { id: 'categories', label: t.admin.categories.tabLabel },
    { id: 'dictionaries', label: t.admin.tabDictionaries },
    { id: 'analytics', label: t.admin.analytics.tabLabel },
    ...(isSuperUserRole(userRole)
      ? [{ id: 'users' as const, label: t.admin.tabUsers }]
      : []),
    ...(isAdminRole(userRole)
      ? [{ id: 'apiKeys' as const, label: t.admin.tabApiKeys }]
      : []),
    {
      id: 'validation',
      label: t.admin.tabValidation,
      badge: pendingValidation > 0 ? pendingValidation : undefined,
    },
  ];

  return (
    <div>
      <div
        className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl border border-[#acb3cf33] bg-[#1d202f73] p-1 max-[700px]:w-full"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-[14px] py-[9px] text-[14px] font-semibold text-[#acb3cf] transition-colors hover:bg-[#ffffff14] hover:text-[#f2f3fc] aria-pressed:bg-[#3a425d] aria-pressed:text-[#f2f3fc] max-[700px]:px-[10px] max-[700px]:py-2"
              aria-pressed={isActive}
            >
              {tab.label}

              {tab.badge && (
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: '#fff'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Контент табов */}
      <div className="tab-content">
        {activeTab === 'benchmarks' && <AdminBenchmarksTab />}
        {activeTab === 'categories' && <AdminCategoriesTab />}
        {activeTab === 'dictionaries' && <AdminDictionariesTab />}
        {activeTab === 'validation' && <AdminValidationTab />}
        {activeTab === 'analytics' && <AdminAnalyticsTab />}
        {activeTab === 'users' && isSuperUserRole(userRole) && <AdminUsersTab />}
        {activeTab === 'apiKeys' && isAdminRole(userRole) && <AdminApiKeysTab />}
      </div>
    </div>
  );
}
