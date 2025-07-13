import { reminderOperations } from '../lib/supabase';
import { withRetry } from '../handlers/utils';
import fetch from 'node-fetch';

const MCP_URL = process.env.MCP_URL || '';
const MCP_API_KEY = process.env.MCP_API_KEY || '';

/**
 * Process and send all pending reminders
 * This function is designed to be run on a cron schedule (e.g., every minute)
 */
export const processPendingReminders = async () => {
  try {
    console.log('Starting reminder processing...');
    
    // Get all pending reminders
    const pendingReminders = await reminderOperations.getPendingReminders();
    
    console.log(`Found ${pendingReminders.length} pending reminders to process`);
    
    // Process each reminder
    const results = await Promise.allSettled(
      pendingReminders.map(async (reminder) => {
        try {
          // Get phone number from the joined profiles data
          const phone = reminder.profiles?.phone;
          if (!phone) {
            throw new Error(`No phone number found for reminder ${reminder.id}`);
          }
          
          // Get challenge details
          const title = reminder.challenges?.title || 'your challenge';
          const deadline = reminder.challenges?.deadline;
          
          let deadlineText = 'soon';
          if (deadline) {
            const deadlineDate = new Date(deadline);
            deadlineText = deadlineDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          // Send WhatsApp message
          await sendWhatsAppReminder(phone, title, deadlineText, reminder.challenge_id);
          
          // Mark reminder as sent
          await reminderOperations.markReminderAsSent(reminder.id);
          
          return { id: reminder.id, success: true };
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          return { id: reminder.id, success: false, error };
        }
      })
    );
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`Reminder processing complete. Success: ${successful}, Failed: ${failed}`);
    
    return { successful, failed, total: pendingReminders.length };
  } catch (error) {
    console.error('Error processing reminders:', error);
    throw error;
  }
};

/**
 * Send a WhatsApp reminder message using MCP
 */
const sendWhatsAppReminder = async (
  to: string,
  challengeTitle: string,
  deadline: string,
  challengeId: string
) => {
  const message = `⏰ *Reminder: Challenge Due Soon!*\n\nYour challenge "*${challengeTitle}*" is due ${deadline}.\n\nMake sure to complete your task and submit proof to keep your money! Reply with a photo and "proof for challenge ${challengeId}" to submit proof.`;
  
  await withRetry(async () => {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MCP_API_KEY
      },
      body: JSON.stringify({
        to,
        type: 'text',
        text: {
          body: message
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send WhatsApp message: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  });
};

// If running as a standalone script (e.g., in a serverless function)
if (require.main === module) {
  processPendingReminders()
    .then(() => {
      console.log('Reminder processing complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in reminder processing:', error);
      process.exit(1);
    });
} 