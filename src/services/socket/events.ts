export const WS_CLIENT_EVENTS = {
  START_CHAT: 'start_chat',
  SEND_MESSAGE: 'send_message',

  REQUEST_RECOMMENDATIONS: 'request_recommendations',
  START_BENCHMARK_CREATION: 'start_benchmark_creation',

  SELECT_RECOMMENDATION: 'select_recommendation',
  REJECT_RECOMMENDATION: 'reject_recommendation',
} as const;

export const WS_SERVER_EVENTS = {
  CHAT_STARTED: 'chat_started',
  AGENT_MESSAGE: 'agent_message',

  RECOMMENDATION_UPDATED: 'recommendation_updated',
  RECOMMENDATION_REQUEST_ACCEPTED:
    'recommendation_request_accepted',
  RECOMMENDATION_RESULT: 'recommendation_result',
  BENCHMARK_CREATION_STARTED: 'benchmark_creation_started',

  ERROR: 'error',
  EXCEPTION: 'exception',
} as const;
