import type { ChatMessage, Dialogue, StructuredPrompt, SettingsAggregate } from '@/types';
import { DialogueStatus, DialoguePhase } from '@/types';
import type { AppTranslations } from '../types';
import { CREATE_INTERVIEW_STEPS, INTERVIEW_QUESTIONS } from '../consts';
import { pickLocalizedName } from '@/features/catalog/selectors';

// Minimal shape needed for recommendation text-search.
export interface BenchmarkLike {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  domains?: string[];
  abilityTaxons?: string[];
}

export function getInterviewQuestionLines(t: AppTranslations): string[] {
  const iv = t.create.interview;
  return [iv.q0, iv.q1, iv.q2, iv.q3, iv.q4, iv.q5, iv.q6, iv.q7, iv.q8];
}

export function buildStructuredPromptForStep(
  stepIndex: number,
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): StructuredPrompt | undefined {
  const iv = t.create.interview;
  const input = CREATE_INTERVIEW_STEPS[stepIndex];
  if (input === 'freeText' || input === 'none') return undefined;

  // Step 1 — task type: options from aggregate (value = UUID)
  if (input === 'single' && stepIndex === 1) {
    const options = aggregate
      ? aggregate.parameters.taskTypes.map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, 'ru'),
      }))
      : [];
    return options.length ? { kind: 'single', stepIndex, options } : undefined;
  }

  // Step 2 — difficulty: options from aggregate
  if (input === 'single' && stepIndex === 2) {
    const options = aggregate
      ? aggregate.parameters.difficulties.map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, 'ru'),
      }))
      : [];
    return options.length ? { kind: 'single', stepIndex, options } : undefined;
  }

  // Step 3 — RAG boolean: keep yes/no values
  if (input === 'boolean' && stepIndex === 3) {
    return {
      kind: 'boolean',
      stepIndex,
      options: [
        { value: 'yes', label: iv.ragYes },
        { value: 'no', label: iv.ragNo },
      ],
    };
  }

  // Step 4 — few-shot count (not in new contract, kept for UX)
  if (input === 'chips' && stepIndex === 4) {
    return {
      kind: 'chips',
      stepIndex,
      options: [0, 1, 2, 3, 4, 5].map((n) => ({
        value: String(n),
        label: n === 0 ? iv.fewShotZero : `${n} (${iv.fewShotN})`,
      })),
    };
  }

  // Step 5 — language: options from aggregate
  if (input === 'single' && stepIndex === 5) {
    const options = aggregate
      ? aggregate.parameters.languages.map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, 'ru'),
      }))
      : [];
    return options.length ? { kind: 'single', stepIndex, options } : undefined;
  }

  // Step 6 — dataset size
  if (input === 'chips' && stepIndex === 6) {
    return {
      kind: 'chips',
      stepIndex,
      options: [
        { value: '500', label: iv.size500 },
        { value: '1000', label: iv.size1k },
        { value: '5000', label: iv.size5k },
        { value: '10000', label: iv.size10k },
        { value: '__custom__', label: iv.sizeCustom },
      ],
    };
  }

  return undefined;
}

export function getLegacyMockResponse(messageCount: number): string {
  const idx = Math.floor(messageCount / 2);
  return INTERVIEW_QUESTIONS[Math.min(idx, INTERVIEW_QUESTIONS.length - 1)];
}

export function getLegacyStatus(messageCount: number): DialogueStatus {
  if (messageCount === 0) return DialogueStatus.Interview;
  if (messageCount >= INTERVIEW_QUESTIONS.length * 2 - 2) return DialogueStatus.Done;
  return DialogueStatus.InProgress;
}

export function findRecommendations(
  query: string,
  benchmarks: BenchmarkLike[],
  limit = 3,
): string[] {
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const rawTokens = norm(query).split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 1);
  const tokens = [...new Set(rawTokens)];

  if (tokens.length === 0) return benchmarks.slice(0, limit).map((b) => b.id);

  const scored = benchmarks.map((b) => {
    const hay = norm(
      [b.name, b.nameEn ?? '', b.description ?? ''].join(' '),
    );
    let score = 0;
    for (const tok of tokens) {
      if (hay.includes(tok)) score += 4;
      else {
        for (const word of hay.split(/\s+/)) {
          if (word.includes(tok) || tok.includes(word)) score += 1;
        }
      }
    }
    return { id: b.id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const withScore = scored.filter((s) => s.score > 0);
  if (withScore.length === 0) return benchmarks.slice(0, limit).map((b) => b.id);
  return withScore.slice(0, limit).map((s) => s.id);
}

export function guessFromIds(
  ids: string[],
  benchmarks: BenchmarkLike[],
): { domains: string; skills: string } {
  const top = ids.map((id) => benchmarks.find((b) => b.id === id)).filter(Boolean) as BenchmarkLike[];
  if (top.length === 0) return { domains: '—', skills: '—' };
  const domains = [...new Set(top.flatMap((b) => b.domains ?? []))].slice(0, 4).join(', ') || '—';
  const skills = [...new Set(top.flatMap((b) => b.abilityTaxons ?? []))].slice(0, 6).join(', ') || '—';
  return { domains, skills };
}

export function matchesRecommendYes(text: string, label: string): boolean {
  const s = text.trim().toLowerCase();
  if (s === label.trim().toLowerCase()) return true;
  const keys = ['да', 'yes', 'подходит', 'нашёл', 'нашел', 'подошло'];
  return keys.some((k) => s === k || s.startsWith(k + ',') || s.startsWith(k + ' ') || s === k + '!');
}

export function matchesRecommendNo(text: string, label: string): boolean {
  const s = text.trim().toLowerCase();
  if (s === label.trim().toLowerCase()) return true;
  const keys = ['нет', 'no'];
  return keys.some((k) => s === k || s.startsWith(k + ',') || s.startsWith(k + ' ') || s.startsWith(k + '.'));
}

export function buildSkipRecommendToCreatePayload(
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): { assistantMsg: ChatMessage; patch: Partial<Dialogue> } {
  const idx = 1;
  const lines = getInterviewQuestionLines(t);
  const content = `${t.create.switchToCreate}\n\n${lines[idx]}`;
  const structuredPrompt = buildStructuredPromptForStep(idx, t, aggregate);
  return {
    assistantMsg: {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      ...(structuredPrompt ? { structuredPrompt } : {}),
    },
    patch: {
      phase: DialoguePhase.Create,
      nextInterviewIndex: idx + 1,
      status: DialogueStatus.InProgress,
    },
  };
}
