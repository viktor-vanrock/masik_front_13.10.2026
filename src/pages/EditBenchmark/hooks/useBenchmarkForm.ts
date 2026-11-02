import type { BenchmarkType, BenchmarkExample } from '@/types';
import { useState } from 'react';
import type { BenchmarkFormData, FormActions } from '../types';

export function useBenchmarkForm(benchmark: BenchmarkType) {
  const [suiteId, setSuiteId] = useState(benchmark.suiteId);

  const [name, setName] = useState(benchmark.name);
  const [nameEn, setNameEn] = useState(benchmark.nameEn);
  const [description, setDescription] = useState(benchmark.description);
  const [descriptionEn, setDescriptionEn] = useState(benchmark.descriptionEn ?? '');
  const [metrics, setMetrics] = useState(benchmark.metrics.join(', '));
  const [instructions, setInstructions] = useState(benchmark.instructions ?? '');
  const [instructionsEn, setInstructionsEn] = useState(benchmark.instructionsEn ?? '');

  // Taxonomy — init from DictionaryRef
  const [macroGroupId, setMacroGroupId] = useState(benchmark.macroGroup?.id ?? '');
  const [subGroupIds, setSubGroupIds] = useState<string[]>(
    benchmark.subGroups.map((s) => s.id),
  );
  const [abilityTaxonIds, setAbilityTaxonIds] = useState<string[]>(
    benchmark.abilityTaxons.map((a) => a.id),
  );

  // Parameters — init from DictionaryRef
  const [taskTypeId, setTaskTypeId] = useState(benchmark.taskType?.id ?? '');
  const [modalityIds, setModalityIds] = useState<string[]>(
    benchmark.modalities.map((m) => m.id),
  );
  const [languageId, setLanguageId] = useState(benchmark.language?.id ?? '');
  const [difficultyId, setDifficultyId] = useState(benchmark.difficulty?.id ?? '');
  const [capabilityIds, setCapabilityIds] = useState<string[]>(
    benchmark.capabilities.map((c) => c.id),
  );

  // Sizes
  const [sizeInSamples, setSizeInSamples] = useState(String(benchmark.sizeInSamples ?? ''));
  const [medianWords, setMedianWords] = useState(String(benchmark.medianSampleSizeWords ?? ''));
  const [reqMin, setReqMin] = useState(String(benchmark.requestLengthDist?.min ?? ''));
  const [reqMedian, setReqMedian] = useState(String(benchmark.requestLengthDist?.median ?? ''));
  const [reqMax, setReqMax] = useState(String(benchmark.requestLengthDist?.max ?? ''));
  const [respMin, setRespMin] = useState(String(benchmark.responseLengthDist?.min ?? ''));
  const [respMedian, setRespMedian] = useState(String(benchmark.responseLengthDist?.median ?? ''));
  const [respMax, setRespMax] = useState(String(benchmark.responseLengthDist?.max ?? ''));

  // Domains — init from DictionaryRef
  const [domainIds, setDomainIds] = useState<string[]>(
    benchmark.domains.map((d) => d.id),
  );
  const [subdomainIds, setSubdomainIds] = useState<string[]>(
    benchmark.subdomains.map((s) => s.id),
  );

  const [codebaseName, setCodebaseName] = useState(benchmark.codebase?.name ?? '');
  const [codebaseUrl, setCodebaseUrl] = useState(benchmark.codebase?.url ?? '');

  const [references, setReferences] = useState<{ title: string; url: string }[]>(
    benchmark.references ?? [],
  );

  const [adapterName, setAdapterName] = useState(benchmark.gigaMetricAdapterName ?? '');
  const [adapterSetUrl, setAdapterSetUrl] = useState(benchmark.gigaMetricSetUrl ?? '');
  const [launchCommand, setLaunchCommand] = useState(benchmark.gigaMetricLaunchCommand ?? '');

  const [examples, setExamples] = useState<BenchmarkExample[]>(benchmark.examples ?? []);

  // Toggle helpers
  const toggle = (setter: (fn: (prev: string[]) => string[]) => void) => (id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const actions: FormActions = {
    toggleSubGroupId: toggle(setSubGroupIds),
    toggleAbilityTaxonId: toggle(setAbilityTaxonIds),
    toggleModalityId: toggle(setModalityIds),
    toggleCapabilityId: toggle(setCapabilityIds),
    toggleDomainId: toggle(setDomainIds),
    toggleSubdomainId: toggle(setSubdomainIds),
    addReference: () => setReferences((prev) => [...prev, { title: '', url: '' }]),
    removeReference: (i) => setReferences((prev) => prev.filter((_, idx) => idx !== i)),
    updateReference: (i, field, val) =>
      setReferences((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))),
    addExample: () =>
      setExamples((prev) => [...prev, { input: '', output: '', explanation: '' }]),
    removeExample: (i) => setExamples((prev) => prev.filter((_, idx) => idx !== i)),
    updateExample: (i, field, val) =>
      setExamples((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: val } : ex))),
  };

  const formData: BenchmarkFormData = {
    suiteId, name, nameEn, description, descriptionEn, metrics, instructions, instructionsEn,
    macroGroupId, subGroupIds, abilityTaxonIds,
    taskTypeId, modalityIds, languageId, difficultyId, capabilityIds,
    sizeInSamples, medianWords, reqMin, reqMedian, reqMax, respMin, respMedian, respMax,
    domainIds, subdomainIds,
    codebaseName, codebaseUrl,
    references,
    adapterName, adapterSetUrl, launchCommand,
    examples,
  };

  const setters = {
    setSuiteId,
    setName, setNameEn, setDescription, setDescriptionEn,
    setMetrics, setInstructions, setInstructionsEn,
    setMacroGroupId,
    setSubGroupIds,
    setTaskTypeId,
    setLanguageId,
    setDifficultyId,
    setSizeInSamples, setMedianWords,
    setReqMin, setReqMedian, setReqMax,
    setRespMin, setRespMedian, setRespMax,
    setSubdomainIds,
    setCodebaseName, setCodebaseUrl,
    setAdapterName, setAdapterSetUrl, setLaunchCommand,
  };

  return { formData, actions, setters };
}
