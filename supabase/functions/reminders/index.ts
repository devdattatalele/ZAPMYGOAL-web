import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// WhatsApp MCP or messaging API integration
const sendWhatsAppMessage = async (
  to: string,
  message: string
): Promise<boolean> => {
  try {
    // In a production environment, you would integrate with a messaging API
    // This is a placeholder for WhatsApp MCP integration
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    // For now, we'll just simulate a successful send
    // In production, you would make an HTTP request to your messaging API
    // Example:
    // const response = await fetch("https://your-messaging-api.com/send", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ to, message })
    // });
    // return response.ok;
    
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
};

// Format deadline for a more readable display
const formatDeadline = (deadline: string): string => {
  try {
    const date = new Date(deadline);
    return date.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    return deadline;
  }
};

serve(async (req) => {
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      "Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log("Starting reminder processing...");
    
    // Get current time
    const now = new Date().toISOString();
    
    // Query for pending reminders
    // We join with profiles to get phone numbers and with challenges to get titles and deadlines
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select(`
        id,
        user_id,
        challenge_id,
        remind_at,
        profiles (
          phone
        ),
        challenges (
          title,
          deadline
        )
      `)
      .eq("sent", false)
      .lte("remind_at", now);
    
    if (error) {
      console.error("Error fetching reminders:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Error fetching reminders" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Found ${reminders?.length || 0} pending reminders to process`);
    
    // Process the reminders
    const results = await Promise.allSettled(
      (reminders || []).map(async (reminder) => {
        try {
          // Extract data
          const phone = reminder.profiles?.phone;
          if (!phone) {
            throw new Error(`No phone number found for reminder ${reminder.id}`);
          }
          
          const title = reminder.challenges?.title || "your challenge";
          const deadline = reminder.challenges?.deadline;
          
          // Format deadline for display
          const deadlineText = deadline ? formatDeadline(deadline) : "soon";
          
          // Prepare message
          const message = `⏰ *Reminder: Challenge Due Soon!*\n\nYour challenge "*${title}*" is due ${deadlineText}.\n\nMake sure to complete your task and submit proof to keep your money! Reply with a photo and "proof for challenge ${reminder.challenge_id}" to submit proof.`;
          
          // Send WhatsApp message
          const sent = await sendWhatsAppMessage(phone, message);
          
          if (sent) {
            // Mark reminder as sent
            const { error: updateError } = await supabase
              .from("reminders")
              .update({ 
                sent: true,
                updated_at: new Date().toISOString()
              })
              .eq("id", reminder.id);
            
            if (updateError) {
              throw new Error(`Failed to mark reminder ${reminder.id} as sent: ${updateError.message}`);
            }
          } else {
            throw new Error(`Failed to send message for reminder ${reminder.id}`);
          }
          
          return { id: reminder.id, success: true };
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          return { id: reminder.id, success: false, error };
        }
      })
    );
    
    // Summarize results
    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
    const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)).length;
    
    console.log(`Reminder processing complete. Success: ${successful}, Failed: ${failed}`);
    
    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total: reminders?.length || 0,
          successful,
          failed
        }
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}); 