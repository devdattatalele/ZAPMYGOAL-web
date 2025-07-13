/**
 * AI Prompts for BetTask WhatsApp Integration
 * 
 * This file contains prompt templates for:
 * 1. Intent classification (parsing user messages)
 * 2. Proof verification (validating image submissions)
 */

/**
 * Prompt for classifying user intent from WhatsApp messages
 */
export const createIntentClassificationPrompt = (message: string): string => {
  return `
You are an assistant for a WhatsApp-based self-accountability app called BetTask that helps users set challenges with money stakes to stay accountable.

ANALYZE THE FOLLOWING USER MESSAGE:
"${message}"

EXTRACT THE USER INTENT AND ANY RELEVANT ENTITIES.

Available Intents:
- create_challenge: User wants to create a new challenge with a money stake
- submit_proof: User is submitting proof for an existing challenge
- list_challenges: User wants to see their active challenges
- get_balance: User wants to check their account balance
- set_reminder: User wants to set a reminder for a challenge
- help: User needs help or instructions
- unknown: Intent cannot be determined

Return ONLY a JSON object with the following structure (no other text or explanation):
{
  "intent": "one_of_the_intents_above",
  "entities": {
    "title": "challenge title if present",
    "amount": number or null,
    "deadline": "deadline in ISO format if present or natural language like 'tomorrow at 8pm'",
    "description": "challenge description if present",
    "challenge_id": "ID if user is referencing a specific challenge",
    "remind_at": "reminder time in ISO format if present or natural language"
  }
}

Guidelines:
- For create_challenge, extract title, amount, deadline, and description
- For submit_proof, identify if user is referencing a challenge_id
- For set_reminder, extract challenge_id and remind_at
- Return null for any entity that's not present
- Parse amounts as numbers (e.g., "₹500" → 500)
- Convert dates to ISO strings when possible
`;
};

/**
 * Prompt for verifying proof images
 */
export const createProofVerificationPrompt = (
  challengeTitle: string,
  challengeDescription: string
): string => {
  return `
You are an image verification assistant for BetTask, a self-accountability app.

TASK TO VERIFY:
Title: "${challengeTitle}"
Description: "${challengeDescription}"

IMPORTANT INSTRUCTIONS:
- You are reviewing visual proof of the task being done
- Only check if the image plausibly relates to the task category
- Do NOT require proof of active participation
- Be LENIENT and give users the benefit of doubt
- Examples of valid proof:
  - For gym tasks: gym environment, workout equipment, fitness tracker screenshot
  - For reading: books, e-reader, study environment
  - For meditation: meditation app, peaceful environment
  - For productivity: workspace, completed work, productivity app screenshot

YOUR RESPONSE MUST BE EXACTLY ONE OF:
"Valid" - if the image plausibly relates to the task
"Invalid" - if the image clearly has no relation to the task

DO NOT include any explanation or additional text.
`;
};

/**
 * Prompt for parsing natural language dates
 */
export const createDateParsingPrompt = (dateText: string): string => {
  return `
Parse the following text that represents a date or time:
"${dateText}"

Convert it to an ISO 8601 datetime string (YYYY-MM-DDTHH:MM:SS.sssZ).
Consider the current date as reference for relative dates like "tomorrow" or "next week".
If no specific time is mentioned, default to 9:00 AM.
Return ONLY the ISO string without any other text or explanation.
`;
};

export default {
  createIntentClassificationPrompt,
  createProofVerificationPrompt,
  createDateParsingPrompt
}; 