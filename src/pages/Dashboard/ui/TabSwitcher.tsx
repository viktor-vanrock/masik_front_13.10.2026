import { useApp } from "@/hooks/useApp";
import { DASHBOARD_TABS } from "../consts";
import type { DashboardTabType } from "../types";

interface Props {
  activeTab: DashboardTabType;
  setActiveTab: (tab: DashboardTabType) => void;
}

export const TabSwitcher = ({ activeTab, setActiveTab }: Props) => {
  const { t } = useApp();
  const labels = {
    table: t.dashboard.scoreTable,
    bar: t.dashboard.barChart,
    radar: t.dashboard.radarChart,
  };

  return (
    <div
      className="flex gap-1 rounded-xl p-1 w-fit"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {DASHBOARD_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeTab === tab ? 'var(--bg-blue-tint)' : 'transparent',
            color: activeTab === tab ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
          }}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}