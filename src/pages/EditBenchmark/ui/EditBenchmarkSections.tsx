import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { BenchmarkType } from '@/types';
import { useUpdateBenchmarkMutation } from '@/api/catalog';
import { ApiException } from '@/services/http';
import { useApiError } from '@/hooks/useApiError';
import { useApp } from '@/hooks/useApp';
import { useBenchmarkForm } from '../hooks/useBenchmarkForm';
import { buildPatchDiff } from '../utils/buildPatchDiff';
import { BasicInfoSection } from './BasicInfoSection';
import { SuiteSection } from './SuiteSection';
import { InstructionsSection } from './InstructionsSection';
import { TaxonomySection } from './TaxonomySection';
import { AbilityTaxonsSection } from './AbilityTaxonsSection';
import { ParametersSection } from './ParametersSection';
import { SizesSection } from './SizesSection';
import { DomainsSection } from './DomainsSection';
import { CodebaseSection } from './CodebaseSection';
import { ReferencesSection } from './ReferencesSection';
import { GigaMetricSection } from './GigaMetricSection';
import { ExamplesSection } from './ExamplesSection';
import { SaveButton } from './SaveButton';

interface Props {
  benchmark: BenchmarkType;
}

export const EditBenchmarkSections = ({ benchmark }: Props) => {
  const { t, lang } = useApp();
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const navigate = useNavigate();
  const updateMutation = useUpdateBenchmarkMutation();
  const { serverError, handleError } = useApiError();
  const { formData, actions, setters } = useBenchmarkForm(benchmark);

  const handleSave = async () => {
    const patch = buildPatchDiff(formData, benchmark);

    if (Object.keys(patch).length === 0) {
      navigate(`/benchmark/${benchmark.id}`);
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: benchmark.id, patch });
      navigate(`/benchmark/${benchmark.id}`);
    } catch (e) {
      if (e instanceof ApiException && e.status === 404) { setNotFound(true); return; }
      handleError(e, { fallback: t.common.errors.saveFailed, onForbidden: () => setForbidden(true) });
    }
  };

  if (forbidden) return <Navigate to="/forbidden" replace />;
  if (notFound) return <Navigate to="/admin" replace />;

  const isPending = updateMutation.isPending;
  const displayTitle = lang === 'en' ? formData.nameEn : formData.name;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} />
        {t.admin.title}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t.admin.editTitle}
          </h1>
          <p className="text-sm mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
            {displayTitle}
          </p>
        </div>
        <SaveButton saved={false} onClick={handleSave} disabled={isPending} />
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          {serverError}
        </div>
      )}

      <div className="space-y-5">
        <SuiteSection
          suiteId={formData.suiteId}
          onSuiteIdChange={setters.setSuiteId}
        />

        <BasicInfoSection
          name={formData.name}
          nameEn={formData.nameEn}
          description={formData.description}
          descriptionEn={formData.descriptionEn}
          metrics={formData.metrics}
          onNameChange={setters.setName}
          onNameEnChange={setters.setNameEn}
          onDescriptionChange={setters.setDescription}
          onDescriptionEnChange={setters.setDescriptionEn}
          onMetricsChange={setters.setMetrics}
        />

        <InstructionsSection
          instructions={formData.instructions}
          instructionsEn={formData.instructionsEn}
          onInstructionsChange={setters.setInstructions}
          onInstructionsEnChange={setters.setInstructionsEn}
        />

        <TaxonomySection
          macroGroupId={formData.macroGroupId}
          subGroupIds={formData.subGroupIds}
          onMacroGroupChange={(id) => {
            setters.setMacroGroupId(id);
            setters.setSubGroupIds([]);
          }}
          onSubGroupToggle={actions.toggleSubGroupId}
        />

        <AbilityTaxonsSection
          abilityTaxonIds={formData.abilityTaxonIds}
          onToggle={actions.toggleAbilityTaxonId}
        />

        <ParametersSection
          taskTypeId={formData.taskTypeId}
          modalityIds={formData.modalityIds}
          languageId={formData.languageId}
          difficultyId={formData.difficultyId}
          capabilityIds={formData.capabilityIds}
          onTaskTypeChange={setters.setTaskTypeId}
          onModalityToggle={actions.toggleModalityId}
          onLanguageChange={setters.setLanguageId}
          onDifficultyChange={setters.setDifficultyId}
          onCapabilityToggle={actions.toggleCapabilityId}
        />

        <SizesSection
          sizeInSamples={formData.sizeInSamples}
          medianWords={formData.medianWords}
          reqMin={formData.reqMin}
          reqMedian={formData.reqMedian}
          reqMax={formData.reqMax}
          respMin={formData.respMin}
          respMedian={formData.respMedian}
          respMax={formData.respMax}
          onSizeChange={setters.setSizeInSamples}
          onMedianWordsChange={setters.setMedianWords}
          onReqMinChange={setters.setReqMin}
          onReqMedianChange={setters.setReqMedian}
          onReqMaxChange={setters.setReqMax}
          onRespMinChange={setters.setRespMin}
          onRespMedianChange={setters.setRespMedian}
          onRespMaxChange={setters.setRespMax}
        />

        <DomainsSection
          domainIds={formData.domainIds}
          subdomainIds={formData.subdomainIds}
          onDomainToggle={actions.toggleDomainId}
          onSubdomainToggle={actions.toggleSubdomainId}
          onSubdomainsChange={setters.setSubdomainIds}
        />

        <CodebaseSection
          codebaseName={formData.codebaseName}
          codebaseUrl={formData.codebaseUrl}
          onNameChange={setters.setCodebaseName}
          onUrlChange={setters.setCodebaseUrl}
        />

        <ReferencesSection
          references={formData.references}
          onAdd={actions.addReference}
          onRemove={actions.removeReference}
          onUpdate={actions.updateReference}
        />

        <GigaMetricSection
          adapterName={formData.adapterName}
          adapterSetUrl={formData.adapterSetUrl}
          launchCommand={formData.launchCommand}
          onAdapterNameChange={setters.setAdapterName}
          onAdapterSetUrlChange={setters.setAdapterSetUrl}
          onLaunchCommandChange={setters.setLaunchCommand}
        />

        <ExamplesSection
          examples={formData.examples}
          onAdd={actions.addExample}
          onRemove={actions.removeExample}
          onUpdate={actions.updateExample}
        />

        <div className="flex justify-end pt-2">
          <SaveButton saved={false} onClick={handleSave} disabled={isPending} />
        </div>
      </div>
    </div>
  );
};
