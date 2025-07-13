/**
 * Handle help intent
 * Provides the user with information about how to use the WhatsApp BetTask system
 */
export const handleHelp = async (): Promise<{ success: boolean; message: string }> => {
  const helpMessage = `*Welcome to BetTask WhatsApp Bot!* 🚀

BetTask helps you achieve your goals by putting money on the line. Here's how to use this service:

*Create a Challenge* 📝
Send a message like:
"Create a challenge: Go to the gym for 1 hour
Amount: ₹500
Deadline: tomorrow at 6pm"

*Submit Proof* 📸
Send a photo with a message like:
"Proof for my challenge"
or
"I completed the challenge, here's proof"

*Check Your Challenges* 📋
Send:
"list challenges" or "show my challenges"

*Check Your Balance* 💰
Send:
"balance" or "show balance"

*Set a Reminder* ⏰
Send:
"remind me about my challenge tomorrow at 9am"

*Need More Help?* 💬
You can always email us at support@bettask.com or visit our website at bettask.com

Good luck with your goals! 💪`;

  return {
    success: true,
    message: helpMessage
  };
}; 