import { supabase } from '@/integrations/supabase/client';

// Image metadata extraction utility
export interface ImageMetadata {
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  device?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  fileName?: string;
}

// Extract EXIF data from image file
export const extractImageMetadata = async (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      
      // Get today's date for comparison
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      // Use file modification time as proxy for image timestamp
      const fileTimestamp = new Date(file.lastModified);
      
      // Basic metadata we can extract
      const metadata: ImageMetadata = {
        timestamp: fileTimestamp.toISOString(),
        dimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight
        },
        fileSize: file.size,
        fileName: file.name
      };
      
      resolve(metadata);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Verify timestamp - check if image was taken today
export const verifyTimestamp = (
  metadata: ImageMetadata
): { isValid: boolean; reason?: string } => {
  if (!metadata.timestamp) {
    return { isValid: false, reason: 'No timestamp found in image metadata' };
  }
  
  const imageTime = new Date(metadata.timestamp);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  // Image should be taken today
  if (imageTime < todayStart || imageTime > todayEnd) {
    return { 
      isValid: false, 
      reason: 'Image must be taken today to verify task completion' 
    };
  }
  
  return { isValid: true };
};

// Upload image to Supabase storage
export const uploadImageToStorage = async (file: File, userId: string, challengeId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${challengeId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('challenge-proofs')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('challenge-proofs')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// AI Verification using Gemini API
export const verifyWithAI = async (
  imageFile: File,
  challengeDescription: string,
  verificationDetails: string
): Promise<{ isValid: boolean; confidence: number; analysis: string }> => {
  try {
    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    const prompt = `
      You are an image classification AI. Your job is to check if an image relates to a specific task category.
      
      Task: "${challengeDescription}"
      
      IMPORTANT INSTRUCTIONS:
      - You only need to check if the image is RELATED to the task category
      - You do NOT need to verify active participation or completion
      - You do NOT need to check timestamps or dates
      - Be LENIENT and HELPFUL to the user
      
      Examples of what to look for:
      - For gym/workout tasks: ANY gym environment, gym equipment, fitness area, workout space, gym interior/exterior
      - For reading tasks: Books, study materials, library, reading space, educational content
      - For cooking tasks: Kitchen, food ingredients, cooking tools, recipes, food preparation area
      - For outdoor tasks: Outdoor environments, nature, parks, streets, outdoor activities
      - For sleep tasks: Bedroom, bed, sleep tracking apps, alarm clocks
      - For study tasks: Study materials, desk setup, educational content, learning environment
      
      Question: Does this image relate to the task category "${challengeDescription}"?
      
      Respond ONLY in this exact JSON format:
      {
        "isValid": true/false,
        "confidence": number_between_0_and_100,
        "analysis": "brief explanation of what you see and why it relates or doesn't relate to the task category"
      }
    `;
    
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
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
                mime_type: imageFile.type,
                data: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent results
          maxOutputTokens: 500
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    console.log('Gemini response:', text); // Debug log
    
    // Try to parse JSON response
    try {
      // Clean the response text (remove markdown formatting if present)
      const cleanText = text.replace(/```json\n|\n```|```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      return {
        isValid: Boolean(result.isValid),
        confidence: Math.min(100, Math.max(0, Number(result.confidence) || 0)),
        analysis: String(result.analysis || 'No analysis provided')
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', text);
      // If JSON parsing fails, provide a fallback based on text analysis
      const isValid = text.toLowerCase().includes('"isvalid": true') || 
                     text.toLowerCase().includes('true') && !text.toLowerCase().includes('false');
      return {
        isValid,
        confidence: 50,
        analysis: `AI response parsing failed. Raw response: ${text.substring(0, 200)}...`
      };
    }
    
  } catch (error) {
    console.error('AI verification error:', error);
    // Return error result instead of throwing
    return {
      isValid: false,
      confidence: 0,
      analysis: `AI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try manual verification or contact support.`
    };
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Complete verification process with attempt tracking
export const performCompleteVerification = async (
  imageFile: File,
  challengeDescription: string,
  verificationDetails: string,
  userId: string,
  challengeId: string,
  currentSubmission?: any
): Promise<{
  timestampCheck: { isValid: boolean; reason?: string };
  aiVerification: { isValid: boolean; confidence: number; analysis: string };
  overallResult: boolean;
  metadata: ImageMetadata;
  imageUrl: string;
  shouldTryAgain: boolean;
  attemptsExhausted: boolean;
  failureReason: 'metadata' | 'ai' | null;
}> => {
  // Step 1: Extract metadata
  const metadata = await extractImageMetadata(imageFile);
  
  // Step 2: Upload image to storage
  const imageUrl = await uploadImageToStorage(imageFile, userId, challengeId);
  
  // Step 3: Track attempts - check BEFORE incrementing
  const metadataAttempts = currentSubmission?.metadata_attempts || 0;
  const aiAttempts = currentSubmission?.ai_attempts || 0;
  
  // Step 4: Verify timestamp
  const timestampCheck = verifyTimestamp(metadata);
  
  let aiVerification = {
    isValid: false,
    confidence: 0,
    analysis: 'Skipped due to timestamp failure'
  };
  
  let shouldTryAgain = false;
  let attemptsExhausted = false;
  let failureReason: 'metadata' | 'ai' | null = null;
  
  if (!timestampCheck.isValid) {
    // Metadata failed - check if user has attempts left BEFORE this submission
    if (metadataAttempts >= 2) { // 0, 1, 2 attempts used = 3rd attempt failed
      attemptsExhausted = true;
      failureReason = 'metadata';
    } else {
      shouldTryAgain = true;
      failureReason = 'metadata';
    }
  } else {
    // Step 5: AI verification (only if timestamp passes)
    aiVerification = await verifyWithAI(imageFile, challengeDescription, verificationDetails);
    
    if (!aiVerification.isValid || aiVerification.confidence < 70) {
      // AI verification failed - check if user has attempts left BEFORE this submission
      if (aiAttempts >= 0) { // 0 attempts used = 1st attempt failed, allow 1 more
        if (aiAttempts === 0) {
          shouldTryAgain = true;
          failureReason = 'ai';
        } else {
          attemptsExhausted = true;
          failureReason = 'ai';
        }
      }
    }
  }
  
  // Overall result: both checks must pass and we shouldn't try again
  const overallResult = timestampCheck.isValid && aiVerification.isValid && 
                       aiVerification.confidence >= 70 && !shouldTryAgain && !attemptsExhausted;
  
  return {
    timestampCheck,
    aiVerification,
    overallResult,
    metadata,
    imageUrl,
    shouldTryAgain,
    attemptsExhausted,
    failureReason
  };
}; 