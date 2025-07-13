import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Initialize Supabase client with service key for admin privileges within secure server environment
const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Initialize Supabase client with anon key for public operations (if needed)
const supabasePublic = createClient<Database>(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
);

/**
 * User profile operations
 */
export const profileOperations = {
  /**
   * Upsert a user profile based on WhatsApp phone number
   */
  upsertProfile: async (phone: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        phone,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'phone',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a user profile by phone number
   */
  getProfileByPhone: async (phone: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  /**
   * Update user balance
   */
  updateBalance: async (userId: string, amount: number) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        balance: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

/**
 * Challenge operations
 */
export const challengeOperations = {
  /**
   * Create a new challenge
   */
  createChallenge: async (userId: string, title: string, betAmount: number, deadline: string, description: string) => {
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert({
        user_id: userId,
        title,
        description,
        bet_amount: betAmount,
        deadline,
        status: 'active',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get challenges for a user
   */
  getChallengesByUserId: async (userId: string) => {
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a challenge by ID
   */
  getChallengeById: async (challengeId: string) => {
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update challenge status
   */
  updateChallengeStatus: async (challengeId: string, status: 'active' | 'completed' | 'failed') => {
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

/**
 * Submission operations
 */
export const submissionOperations = {
  /**
   * Create a new submission
   */
  createSubmission: async (challengeId: string, proofUrl: string) => {
    const { data, error } = await supabaseAdmin
      .from('task_submissions')
      .insert({
        challenge_id: challengeId,
        proof_url: proofUrl,
        ai_verified: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update submission verification
   */
  updateSubmissionVerification: async (submissionId: string, verified: boolean, verdict: string) => {
    const { data, error } = await supabaseAdmin
      .from('task_submissions')
      .update({ 
        ai_verified: true,
        ai_verdict: verdict,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

/**
 * Reminder operations
 */
export const reminderOperations = {
  /**
   * Create a new reminder
   */
  createReminder: async (userId: string, challengeId: string, remindAt: string) => {
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        remind_at: remindAt,
        sent: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get pending reminders
   */
  getPendingReminders: async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .select(`
        *,
        profiles!inner(phone),
        challenges!inner(title, deadline)
      `)
      .eq('sent', false)
      .lte('remind_at', now);
    
    if (error) throw error;
    return data;
  },

  /**
   * Mark reminder as sent
   */
  markReminderAsSent: async (reminderId: string) => {
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .update({ 
        sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

/**
 * Storage operations
 */
export const storageOperations = {
  /**
   * Upload a file to storage
   */
  uploadFile: async (bucket: string, path: string, file: ArrayBuffer | Blob) => {
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  },
};

export { supabaseAdmin, supabasePublic }; 