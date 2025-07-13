import { profileOperations, challengeOperations } from '../lib/supabase';
import { formatCurrency } from './utils';

interface ListChallengesParams {
  phone: string;
}

/**
 * Handle list challenges intent
 * Lists all challenges for the user
 */
export const handleListChallenges = async ({
  phone
}: ListChallengesParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Get user profile
    const profile = await profileOperations.getProfileByPhone(phone);
    if (!profile) {
      return {
        success: false,
        message: "⚠️ Your profile was not found. Please try creating a challenge first."
      };
    }

    // Get all challenges for the user
    const challenges = await challengeOperations.getChallengesByUserId(profile.id);
    
    if (challenges.length === 0) {
      return {
        success: true,
        message: "You don't have any challenges yet. Send 'create challenge' to get started!"
      };
    }

    // Group challenges by status
    const activeChallenge = challenges.filter(c => c.status === 'active');
    const completedChallenge = challenges.filter(c => c.status === 'completed');
    const failedChallenge = challenges.filter(c => c.status === 'failed');

    // Format message
    let message = "*Your Challenges*\n\n";

    // Active challenges
    if (activeChallenge.length > 0) {
      message += "🟢 *Active Challenges:*\n";
      activeChallenge.forEach((challenge, index) => {
        const deadline = new Date(challenge.deadline).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        message += `${index + 1}. "${challenge.title}" - ${formatCurrency(challenge.bet_amount)} - Due: ${deadline}\n`;
      });
      message += "\n";
    }

    // Completed challenges
    if (completedChallenge.length > 0) {
      message += "✅ *Completed Challenges:*\n";
      completedChallenge.slice(0, 3).forEach((challenge, index) => {
        message += `${index + 1}. "${challenge.title}" - ${formatCurrency(challenge.bet_amount)}\n`;
      });
      if (completedChallenge.length > 3) {
        message += `   ...and ${completedChallenge.length - 3} more\n`;
      }
      message += "\n";
    }

    // Failed challenges
    if (failedChallenge.length > 0) {
      message += "❌ *Failed Challenges:*\n";
      failedChallenge.slice(0, 3).forEach((challenge, index) => {
        message += `${index + 1}. "${challenge.title}" - ${formatCurrency(challenge.bet_amount)}\n`;
      });
      if (failedChallenge.length > 3) {
        message += `   ...and ${failedChallenge.length - 3} more\n`;
      }
      message += "\n";
    }

    // Add instructions
    message += "To submit proof for an active challenge, send a photo with 'proof for challenge'.\n";
    message += "To create a new challenge, send 'create challenge'.";

    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('Error listing challenges:', error);
    return {
      success: false,
      message: "⚠️ Something went wrong while retrieving your challenges. Please try again or contact support."
    };
  }
}; 