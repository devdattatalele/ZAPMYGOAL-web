import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'deposit' | 'deduction' | 'refund';
  description: string;
  challenge_id?: string;
  created_at: string;
}

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export const useWallet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current wallet balance
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Create wallet if it doesn't exist
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();
        
        if (createError) throw createError;
        return newWallet as Wallet;
      }
      
      return data as Wallet;
    },
  });

  // Get transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Transaction[];
    },
  });

  // Add funds to wallet
  const addFunds = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update wallet balance
      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: (wallet?.balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (walletError) throw walletError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: 'deposit',
          description: description || `Added ₹${amount} to wallet`,
        });

      if (transactionError) throw transactionError;

      return updatedWallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Funds Added!",
        description: "Money has been successfully added to your wallet.",
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

  // Deduct money (for failed challenges)
  const deductFunds = useMutation({
    mutationFn: async ({ 
      amount, 
      challengeId, 
      description 
    }: { 
      amount: number; 
      challengeId: string; 
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentBalance = wallet?.balance || 0;
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallet balance
      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: currentBalance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (walletError) throw walletError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: 'deduction',
          description,
          challenge_id: challengeId,
        });

      if (transactionError) throw transactionError;

      return updatedWallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refund money (for successful challenges)
  const refundFunds = useMutation({
    mutationFn: async ({ 
      amount, 
      challengeId, 
      description 
    }: { 
      amount: number; 
      challengeId: string; 
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update wallet balance (no change needed as money wasn't deducted, but record transaction)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: 'refund',
          description,
          challenge_id: challengeId,
        });

      if (transactionError) throw transactionError;

      return wallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Challenge Completed!",
        description: "Great job! Your money is safe.",
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
    wallet,
    transactions,
    walletLoading,
    transactionsLoading,
    addFunds,
    deductFunds,
    refundFunds,
  };
}; 