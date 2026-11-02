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
        className="mb-4 flex flex-wrap gap-1"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: isActive
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                marginBottom: -1,
              }}
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
