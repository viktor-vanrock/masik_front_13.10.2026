import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_QUERY_KEYS } from '@/api/catalog/queryKeys';
import type { CreateMetricResultDto, MetricResult } from '@/types';
import { METRICS_QUERY_KEYS } from './queryKeys';
import { createMetricResult } from './requests';

export function useCreateMetricResultMutation() {
  const queryClient = useQueryClient();

  return useMutation<MetricResult, Error, CreateMetricResultDto>({
    mutationFn: createMetricResult,
    retry: 0,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: METRICS_QUERY_KEYS.results(),
      });
      void queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.groups(),
      });
      void queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.detail(created.testId),
      });
    },
  });
}
