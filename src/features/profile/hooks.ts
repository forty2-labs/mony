import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';

import { getProfile, type ProfilePatch, updateProfile } from './api';

export const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...PROFILE_KEY, user?.id],
    queryFn: getProfile,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => {
      if (!user) throw new Error('Not authenticated');
      return updateProfile(user.id, patch);
    },
    onSuccess: (profile) => qc.setQueryData([...PROFILE_KEY, profile.id], profile),
  });
}
