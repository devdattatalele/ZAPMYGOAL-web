
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  task_type: 'one-time' | 'recurring';
  amount: number;
  deadline: string;
  recurring_frequency?: string;
  recurring_duration?: string;
  verification_method: string;
  verification_details: string;
  status: 'active' | 'completed' | 'failed' | 'pending_verification';
  created_at: string;
}

interface CreateChallengeData {
  task: string;
  amount: number;
  deadline: string;
  taskType: 'one-time' | 'recurring';
  recurringFrequency?: string;
  recurringDuration?: string;
  verificationMethod: string;
  verificationDetails: string;
}

export const useChallenges = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const createChallenge = useMutation({
    mutationFn: async (challengeData: CreateChallengeData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          title: challengeData.task,
          description: challengeData.task,
          task_type: challengeData.taskType,
          amount: challengeData.amount,
          deadline: challengeData.deadline,
          recurring_frequency: challengeData.recurringFrequency,
          recurring_duration: challengeData.recurringDuration,
          verification_method: challengeData.verificationMethod,
          verification_details: challengeData.verificationDetails,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast({
        title: "Challenge Created!",
        description: "Your new challenge has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    challenges,
    isLoading,
    createChallenge,
  };
};
