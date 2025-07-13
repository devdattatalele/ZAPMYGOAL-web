import { NextApiRequest, NextApiResponse } from 'next';
import { createIntentClassificationPrompt } from '../../ai/prompts';
import {
  handleCreateChallenge,
  handleSubmitProof,
  handleListChallenges,
  handleGetBalance,
  handleSetReminder,
  handleHelp
} from '../../handlers';
import { withRetry } from '../../handlers/utils';
import fetch from 'node-fetch';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MCP_URL = process.env.MCP_URL || '';
const MCP_API_KEY = process.env.MCP_API_KEY || '';

interface WhatsAppMessage {
  messaging_product: string;
  contacts: {
    profile: {
      name: string;
    };
    wa_id: string;
  }[];
  messages: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: {
      body: string;
    };
    image?: {
      id: string;
      mime_type: string;
      sha256: string;
      caption?: string;
    };
  }[];
}

interface ClassifiedIntent {
  intent: 'create_challenge' | 'submit_proof' | 'list_challenges' | 'get_balance' | 'set_reminder' | 'help' | 'unknown';
  entities: {
    title?: string;
    amount?: number;
    deadline?: string;
    description?: string;
    challenge_id?: string;
    remind_at?: string;
  };
}

/**
 * WhatsApp webhook handler
 * This is the main entry point for all WhatsApp messages
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log incoming webhook
    console.log('Received WhatsApp webhook:', JSON.stringify(req.body));
    
    const whatsappData: WhatsAppMessage = req.body;
    
    // Validate webhook data
    if (!whatsappData.messages || whatsappData.messages.length === 0) {
      return res.status(400).json({ error: 'Invalid webhook data: No messages found' });
    }
    
    // Process the first message in the batch
    const message = whatsappData.messages[0];
    const phone = message.from;
    
    // Get message text and media if available
    let messageText = '';
    let mediaUrl = '';
    
    if (message.text) {
      messageText = message.text.body;
    } else if (message.image) {
      // For image messages, get the media URL
      const imageId = message.image.id;
      mediaUrl = await getMediaUrl(imageId);
      
      // Use caption if available
      if (message.image.caption) {
        messageText = message.image.caption;
      } else {
        // Default text for images without captions
        messageText = 'proof for challenge';
      }
    }
    
    if (!messageText && !mediaUrl) {
      await sendWhatsAppResponse(phone, "⚠️ I couldn't understand your message. Please send text or an image with a caption.");
      return res.status(200).end();
    }
    
    // Classify intent and extract entities
    const { intent, entities } = await classifyIntent(messageText);
    
    console.log(`Classified intent: ${intent}`, entities);
    
    // Call appropriate handler based on intent
    let response;
    
    switch (intent) {
      case 'create_challenge':
        response = await handleCreateChallenge({
          phone,
          title: entities.title || '',
          amount: entities.amount || 0,
          deadline: entities.deadline || '',
          description: entities.description
        });
        break;
        
      case 'submit_proof':
        response = await handleSubmitProof({
          phone,
          challengeId: entities.challenge_id,
          mediaUrl
        });
        break;
        
      case 'list_challenges':
        response = await handleListChallenges({ phone });
        break;
        
      case 'get_balance':
        response = await handleGetBalance({ phone });
        break;
        
      case 'set_reminder':
        response = await handleSetReminder({
          phone,
          challengeId: entities.challenge_id,
          remindAt: entities.remind_at || ''
        });
        break;
        
      case 'help':
        response = await handleHelp();
        break;
        
      default:
        // Unknown intent
        response = {
          success: false,
          message: "⚠️ I'm not sure what you're asking for. Try 'help' to see available commands."
        };
    }
    
    // Send response back to user
    await sendWhatsAppResponse(phone, response.message);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    
    // Try to send error message to user if possible
    try {
      if (req.body?.messages?.[0]?.from) {
        await sendWhatsAppResponse(
          req.body.messages[0].from,
          "⚠️ Sorry, I ran into an error processing your message. Please try again or text 'help' for assistance."
        );
      }
    } catch (sendError) {
      console.error('Error sending error response:', sendError);
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Classify user intent from message text using Gemini AI
 */
async function classifyIntent(messageText: string): Promise<ClassifiedIntent> {
  try {
    // Create prompt
    const prompt = createIntentClassificationPrompt(messageText);
    
    // Call Gemini API with retry logic
    const response = await withRetry(async () => {
      const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        })
      });
      
      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }
      
      return res.json();
    });
    
    if (!response.candidates || !response.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const resultText = response.candidates[0].content.parts[0].text.trim();
    
    // Parse JSON response
    try {
      const parsedIntent = JSON.parse(resultText) as ClassifiedIntent;
      return parsedIntent;
    } catch (parseError) {
      console.error('Error parsing intent classification:', parseError, 'Raw text:', resultText);
      // Default to unknown intent if parsing fails
      return {
        intent: 'unknown',
        entities: {}
      };
    }
  } catch (error) {
    console.error('Error classifying intent:', error);
    // Default to unknown intent on error
    return {
      intent: 'unknown',
      entities: {}
    };
  }
}

/**
 * Get media URL from WhatsApp MCP
 */
async function getMediaUrl(mediaId: string): Promise<string> {
  try {
    const response = await fetch(`${MCP_URL}/media/${mediaId}`, {
      method: 'GET',
      headers: {
        'x-api-key': MCP_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get media URL: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
}

/**
 * Send WhatsApp response message
 */
async function sendWhatsAppResponse(to: string, message: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
    throw error;
  }
} 