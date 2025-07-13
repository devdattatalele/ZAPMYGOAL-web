import { profileOperations, challengeOperations, reminderOperations } from '../lib/supabase';
import { parseDate } from './utils';

interface SetReminderParams {
  phone: string;
  challengeId?: string;
  remindAt: string;
}

/**
 * Handle set reminder intent
 * Sets a reminder for a specific challenge
 */
export const handleSetReminder = async ({
  phone,
  challengeId,
  remindAt
}: SetReminderParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate inputs
    if (!remindAt) {
      return {
        success: false,
        message: "⚠️ Please specify when you want to be reminded."
      };
    }

    // Get user profile
    const profile = await profileOperations.getProfileByPhone(phone);
    if (!profile) {
      return {
        success: false,
        message: "⚠️ Your profile was not found. Please try creating a challenge first."
      };
    }

    // If no challenge ID is provided, get the user's most recent active challenge
    let challenge;
    if (!challengeId) {
      const challenges = await challengeOperations.getChallengesByUserId(profile.id);
      const activeChallenges = challenges.filter(c => c.status === 'active');
      
      if (activeChallenges.length === 0) {
        return {
          success: false,
          message: "⚠️ You don't have any active challenges. Please create a challenge first or specify which challenge you want to set a reminder for."
        };
      }
      
      // Get the most recent active challenge
      challenge = activeChallenges.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
    } else {
      // Get the specific challenge
      challenge = await challengeOperations.getChallengeById(challengeId);
      
      if (!challenge) {
        return {
          success: false,
          message: "⚠️ Challenge not found. Please check the challenge ID and try again."
        };
      }
      
      if (challenge.user_id !== profile.id) {
        return {
          success: false,
          message: "⚠️ This challenge doesn't belong to you."
        };
      }
      
      if (challenge.status !== 'active') {
        return {
          success: false,
          message: `⚠️ This challenge is already marked as ${challenge.status}. You can only set reminders for active challenges.`
        };
      }
    }

    // Parse reminder time
    let parsedRemindAt = remindAt;
    if (!remindAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        parsedRemindAt = await parseDate(remindAt);
      } catch (error) {
        return {
          success: false,
          message: "⚠️ I couldn't understand the reminder time format. Please use a format like 'tomorrow at 8pm' or 'June 5th'."
        };
      }
    }

    // Make sure reminder is not set after the challenge deadline
    const reminderTime = new Date(parsedRemindAt);
    const deadlineTime = new Date(challenge.deadline);
    
    if (reminderTime > deadlineTime) {
      return {
        success: false,
        message: `⚠️ The reminder time can't be after the challenge deadline (${deadlineTime.toLocaleDateString('en-IN', { 
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}).`
      };
    }

    // Create reminder
    await reminderOperations.createReminder(profile.id, challenge.id, parsedRemindAt);

    // Format reminder time for display
    const formattedRemindAt = reminderTime.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      success: true,
      message: `⏰ Reminder set successfully!\n\n*Challenge:* ${challenge.title}\n*Reminder time:* ${formattedRemindAt}\n\nI'll send you a reminder message at this time.`
    };
  } catch (error) {
    console.error('Error setting reminder:', error);
    return {
      success: false,
      message: "⚠️ Something went wrong while setting your reminder. Please try again or contact support."
    };
  }
}; 