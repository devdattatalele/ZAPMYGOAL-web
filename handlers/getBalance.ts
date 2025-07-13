import { profileOperations } from '../lib/supabase';
import { formatCurrency } from './utils';

interface GetBalanceParams {
  phone: string;
}

/**
 * Handle get balance intent
 * Returns user's current balance and account information
 */
export const handleGetBalance = async ({
  phone
}: GetBalanceParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Get user profile
    const profile = await profileOperations.getProfileByPhone(phone);
    if (!profile) {
      return {
        success: false,
        message: "⚠️ Your profile was not found. Please try creating a challenge first."
      };
    }

    // Format account creation date
    const accountCreatedAt = new Date(profile.created_at).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const message = `*Your BetTask Wallet*\n\n💰 *Balance:* ${formatCurrency(profile.balance)}\n📱 *Phone:* ${profile.phone}\n📅 *Account created:* ${accountCreatedAt}\n\nYour balance represents the total amount available for creating new challenges. When you create a challenge, the stake amount is reserved until the challenge is completed or failed.`;

    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    return {
      success: false,
      message: "⚠️ Something went wrong while retrieving your balance. Please try again or contact support."
    };
  }
}; 