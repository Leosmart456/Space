import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, type User, type VerifyInvestorBody } from "@/lib/api";

export function useUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: !!isSignedIn && isLoaded,
    retry: 1,
    refetchInterval: 15_000,
  });

  const updateProfile = useMutation({
    mutationFn: (body: { fullName?: string; phone?: string }) => api.updateProfile(body),
    onSuccess: (data) => qc.setQueryData<User>(["me"], data),
  });

  const verifyInvestor = useMutation({
    mutationFn: (body: VerifyInvestorBody) => api.verifyInvestor(body),
    onSuccess: (data) => qc.setQueryData<User>(["me"], data),
  });

  return { user: query.data, isLoading: query.isLoading, updateProfile, verifyInvestor };
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: api.getSettings, staleTime: 15_000, refetchInterval: 15_000 });
}
