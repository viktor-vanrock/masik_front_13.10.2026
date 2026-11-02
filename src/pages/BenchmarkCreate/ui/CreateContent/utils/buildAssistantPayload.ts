import type { ChatMessage, Dialogue, SettingsAggregate } from '@/types';
import { DialogueStatus, DialoguePhase, DialogueCompletionKind } from '@/types';
import type { BenchmarkLike } from '@/pages/BenchmarkCreate/utils/createUtils';
import { createAssistantMessage } from './messageFactory';
import type { AppTranslations } from '@/pages/BenchmarkCreate/types';
import {
  buildStructuredPromptForStep,
  buildSkipRecommendToCreatePayload,
  findRecommendations,
  getInterviewQuestionLines,
  getLegacyMockResponse,
  getLegacyStatus,
  guessFromIds,
  matchesRecommendNo,
  matchesRecommendYes,
} from '@/pages/BenchmarkCreate/utils/createUtils';
import { INTERVIEW_STEP_COUNT } from '@/pages/BenchmarkCreate/consts';

type Payload = { assistantMsg: ChatMessage; patch: Partial<Dialogue> };

function buildClarifyPayload(content: string, yesL: string, noL: string): Payload {
  return {
    assistantMsg: createAssistantMessage(content, { quickReplies: [yesL, noL] }),
    patch: { status: DialogueStatus.InProgress },
  };
}

function buildAcceptRecommendationsPayload(t: AppTranslations): Payload {
  return {
    assistantMsg: createAssistantMessage(t.create.recommendDone),
    patch: { status: DialogueStatus.Done, completionKind: DialogueCompletionKind.Recommend },
  };
}

function buildRejectRecommendationsPayload(
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): Payload {
  return buildSkipRecommendToCreatePayload(t, aggregate);
}

function buildQuickReplyResponsePayload(
  userContent: string,
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): Payload {
  const { recommendYes: yesL, recommendNo: noL, recommendClarify } = t.create;
  const isYes = matchesRecommendYes(userContent, yesL);
  const isNo = matchesRecommendNo(userContent, noL);

  if (isYes && isNo) return buildClarifyPayload(recommendClarify, yesL, noL);
  if (isYes) return buildAcceptRecommendationsPayload(t);
  if (isNo) return buildRejectRecommendationsPayload(t, aggregate);
  return buildClarifyPayload(recommendClarify, yesL, noL);
}

function buildFirstRecommendPayload(
  userContent: string,
  benchmarks: BenchmarkLike[],
  t: AppTranslations,
): Payload {
  const ids = findRecommendations(userContent, benchmarks);
  const { domains, skills } = guessFromIds(ids, benchmarks);
  const guessLine = t.create.recommendGuess
    .replace('{domains}', domains)
    .replace('{skills}', skills);
  const content = `${t.create.recommendResult}\n\n${guessLine}\n\n${t.create.recommendAsk}`;

  return {
    assistantMsg: createAssistantMessage(content, {
      recommendations: ids,
      quickReplies: [t.create.recommendYes, t.create.recommendNo],
    }),
    patch: { status: DialogueStatus.InProgress },
  };
}

function buildRecommendPhasePayload(
  msgs: ChatMessage[],
  lastUser: ChatMessage,
  benchmarks: BenchmarkLike[],
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): Payload {
  const prevMessage = msgs.length >= 2 ? msgs[msgs.length - 2] : null;
  const prevHadQuickReplies =
    prevMessage?.role === 'assistant' && (prevMessage.quickReplies?.length ?? 0) > 0;

  if (prevHadQuickReplies) {
    return buildQuickReplyResponsePayload(lastUser.content, t, aggregate);
  }

  const isFirstUserMessage = msgs.filter((m) => m.role === 'user').length === 1;
  if (isFirstUserMessage) {
    return buildFirstRecommendPayload(lastUser.content, benchmarks, t);
  }

  return {
    assistantMsg: createAssistantMessage(t.create.recommendClarify),
    patch: {},
  };
}

function buildCreatePhasePayload(
  nextIndex: number,
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): Payload {
  const idx = Math.min(Math.max(nextIndex, 0), INTERVIEW_STEP_COUNT - 1);
  const lines = getInterviewQuestionLines(t);
  const structuredPrompt = buildStructuredPromptForStep(idx, t, aggregate);
  const isLast = idx >= INTERVIEW_STEP_COUNT - 1;

  return {
    assistantMsg: createAssistantMessage(lines[idx], structuredPrompt ? { structuredPrompt } : {}),
    patch: isLast
      ? { status: DialogueStatus.Done, nextInterviewIndex: undefined, completionKind: DialogueCompletionKind.Create }
      : { status: DialogueStatus.InProgress, nextInterviewIndex: idx + 1 },
  };
}

function buildLegacyPayload(msgCount: number): Payload {
  const total = msgCount + 1;
  const content = getLegacyMockResponse(total);
  const status = getLegacyStatus(total);
  return {
    assistantMsg: createAssistantMessage(content),
    patch: {
      status,
      ...(status === DialogueStatus.Done ? { completionKind: DialogueCompletionKind.Create } : {}),
    },
  };
}

export function buildAssistantPayload(
  d: Dialogue,
  benchmarks: BenchmarkLike[],
  t: AppTranslations,
  aggregate: SettingsAggregate | undefined,
): Payload {
  const msgs = d.messages;
  const lastUser = [...msgs].reverse().find((m) => m.role === 'user');

  if (!lastUser) {
    return { assistantMsg: createAssistantMessage(t.create.recommendIntro), patch: {} };
  }

  if (d.phase === DialoguePhase.Recommend) {
    return buildRecommendPhasePayload(msgs, lastUser, benchmarks, t, aggregate);
  }

  if (d.phase === DialoguePhase.Create && d.nextInterviewIndex !== undefined) {
    return buildCreatePhasePayload(d.nextInterviewIndex, t, aggregate);
  }

  return buildLegacyPayload(msgs.length);
}
