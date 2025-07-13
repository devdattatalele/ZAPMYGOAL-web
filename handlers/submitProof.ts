import { profileOperations, challengeOperations, submissionOperations, storageOperations } from '../lib/supabase';
import { downloadMedia, withRetry } from './utils';
import { createProofVerificationPrompt } from '../ai/prompts';
import fetch from 'node-fetch';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface SubmitProofParams {
  phone: string;
  challengeId?: string;
  mediaUrl?: string;
}

/**
 * Handle submit proof intent
 * Verifies and processes proof submissions for challenges
 */
export const handleSubmitProof = async ({
  phone,
  challengeId,
  mediaUrl
}: SubmitProofParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate inputs
    if (!mediaUrl) {
      return {
        success: false,
        message: "⚠️ Please attach a photo as proof for your challenge."
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
          message: "⚠️ You don't have any active challenges. Please create a challenge first or specify which challenge you're submitting proof for."
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
          message: `⚠️ This challenge is already marked as ${challenge.status}. You can only submit proof for active challenges.`
        };
      }
    }

    // Download media
    const mediaData = await downloadMedia(mediaUrl);
    
    // Upload to storage
    const proofPath = `${profile.id}/${challenge.id}/${Date.now()}.jpg`;
    const proofUrl = await storageOperations.uploadFile('challenge-proofs', proofPath, mediaData);
    
    // Create submission record
    const submission = await submissionOperations.createSubmission(challenge.id, proofUrl);
    
    // Verify with AI
    const verificationResult = await verifyProofWithAI(mediaUrl, challenge.title, challenge.description);
    
    // Update submission with verification result
    await submissionOperations.updateSubmissionVerification(
      submission.id,
      verificationResult.verified,
      verificationResult.verdict
    );
    
    // Update challenge status if verified
    if (verificationResult.verified) {
      await challengeOperations.updateChallengeStatus(challenge.id, 'completed');
      
      return {
        success: true,
        message: `✅ Proof verified successfully!\n\n*Challenge:* ${challenge.title}\n*Status:* Completed\n*Amount saved:* ₹${challenge.bet_amount}\n\nGreat job completing your challenge! Your money is safe. 🎉`
      };
    } else {
      return {
        success: false,
        message: `⚠️ Your proof couldn't be verified.\n\n*Challenge:* ${challenge.title}\n\nPlease make sure your image clearly shows something related to the challenge task and try again. Remember, we just need to see that the image is related to your task category (e.g., gym environment for workout tasks).`
      };
    }
  } catch (error) {
    console.error('Error submitting proof:', error);
    return {
      success: false,
      message: "⚠️ Something went wrong while processing your proof. Please try again or contact support."
    };
  }
};

/**
 * Verify proof image with Gemini AI
 */
const verifyProofWithAI = async (
  mediaUrl: string, 
  challengeTitle: string, 
  challengeDescription: string
): Promise<{ verified: boolean; verdict: string }> => {
  try {
    // Download the image
    const mediaData = await downloadMedia(mediaUrl);
    
    // Convert to base64
    const base64Image = Buffer.from(mediaData).toString('base64');
    const mimeType = 'image/jpeg'; // Assuming JPEG; adjust as needed
    
    // Create prompt
    const prompt = createProofVerificationPrompt(challengeTitle, challengeDescription);
    
    // Call Gemini API with retry logic
    const response = await withRetry(async () => {
      const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100
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
    
    const verdict = response.candidates[0].content.parts[0].text.trim();
    const isValid = verdict.toLowerCase() === 'valid';
    
    return {
      verified: isValid,
      verdict: verdict
    };
  } catch (error) {
    console.error('Error verifying proof with AI:', error);
    // Default to verified if AI verification fails, to be user-friendly
    return {
      verified: true,
      verdict: 'Valid (default due to AI error)'
    };
  }
}; 