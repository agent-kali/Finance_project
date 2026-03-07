"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

type MutationContext<TItem> = { previousData: TItem[] | undefined };

export interface UseOptimisticMutationOptions<TItem, TVariables> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<unknown>;
  updateCache: (oldData: TItem[] | undefined, variables: TVariables) => TItem[];
  successMessage?: string;
  errorMessage?: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (variables: TVariables) => void;
}

export function useOptimisticMutation<TItem, TVariables>({
  queryKey,
  mutationFn,
  updateCache,
  successMessage = "Saved successfully",
  errorMessage = "Something went wrong. Changes reverted.",
  invalidateKeys = [],
  onSuccess,
}: UseOptimisticMutationOptions<TItem, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, MutationContext<TItem>>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      queryClient.setQueryData<TItem[]>(queryKey, (old) =>
        updateCache(old, variables)
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(errorMessage);
    },
    onSuccess: (_data, variables) => {
      toast.success(successMessage);
      onSuccess?.(variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
