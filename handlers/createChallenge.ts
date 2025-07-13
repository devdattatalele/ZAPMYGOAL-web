import { profileOperations, challengeOperations } from '../lib/supabase';
import { parseDate } from './utils';

interface CreateChallengeParams {
  phone: string;
  title: string;
  amount: number;
  deadline: string;
  description?: string;
}

/**
 * Handle create challenge intent
 * Creates a new challenge for the user with the specified parameters
 */
export const handleCreateChallenge = async ({
  phone,
  title,
  amount,
  deadline,
  description = ''
}: CreateChallengeParams): Promise<{ success: boolean; message: string; challengeId?: string }> => {
  try {
    // Validate inputs
    if (!title || !amount || !deadline) {
      return {
        success: false,
        message: "⚠️ Missing required information. Please provide a title, amount, and deadline for your challenge."
      };
    }

    if (amount < 50) {
      return {
        success: false,
        message: "⚠️ Minimum challenge amount is ₹50. Please set a higher stake."
      };
    }

    // Try to parse deadline if it's in natural language
    let parsedDeadline = deadline;
    if (!deadline.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        parsedDeadline = await parseDate(deadline);
      } catch (error) {
        return {
          success: false,
          message: "⚠️ I couldn't understand the deadline format. Please use a format like 'tomorrow at 8pm' or 'June 5th'."
        };
      }
    }

    // Get or create user profile
    const profile = await profileOperations.upsertProfile(phone);
    if (!profile) {
      throw new Error("Failed to create or retrieve user profile");
    }

    // Create the challenge
    const challenge = await challengeOperations.createChallenge(
      profile.id,
      title,
      amount,
      parsedDeadline,
      description
    );

    // Format deadline for display
    const deadlineDate = new Date(parsedDeadline);
    const formattedDeadline = deadlineDate.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      success: true,
      message: `✅ Challenge created successfully!\n\n*Title:* ${title}\n*Stake:* ₹${amount}\n*Deadline:* ${formattedDeadline}\n\nRemember to submit proof before the deadline to keep your money! Send a photo with "proof for challenge" when you're done.`,
      challengeId: challenge.id
    };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return {
      success: false,
      message: "⚠️ Something went wrong while creating your challenge. Please try again or contact support."
    };
  }
}; 