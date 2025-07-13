# BetTask WhatsApp Integration

This integration adds WhatsApp as a channel for the BetTask accountability app, allowing users to create challenges, submit proof, and manage their account entirely through WhatsApp.

## Architecture Overview

The WhatsApp integration uses the following components:

1. **WhatsApp MCP**: Handles incoming and outgoing WhatsApp messages
2. **Serverless Functions**: Process webhook events and route to appropriate handlers
3. **Supabase**: Database, auth, and storage for user data and media
4. **Gemini AI**: For intent classification and proof verification

## Setup Instructions

### Prerequisites

- Vercel account for deployment
- Supabase project set up
- Google Cloud account with Gemini API enabled
- WhatsApp Business account with MCP setup

### Environment Variables

Set up the following environment variables in your Vercel project:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
MCP_URL=your-mcp-webhook-url
MCP_API_KEY=your-mcp-api-key
```

### Supabase Setup

1. Run the migration script in `supabase/migrations/20240530_whatsapp_integration.sql` to create the necessary tables and policies:

```sql
-- From the Supabase SQL Editor
-- Copy and paste the content of 20240530_whatsapp_integration.sql
```

2. Set up storage buckets:

- Create a bucket named `challenge-proofs` with public read access
- Add appropriate CORS settings for your domain

### Deployment

1. Push the code to a GitHub repository
2. Connect the repository to Vercel
3. Configure environment variables
4. Deploy the project
x
### WhatsApp MCP Setup

1. Follow the instructions at [WhatsApp MCP GitHub](https://github.com/lharries/whatsapp-mcp) to set up the WhatsApp MCP middleware
2. Configure the MCP webhook to point to your deployed Vercel endpoint: `https://your-vercel-project.vercel.app/api/whatsapp`
3. Make sure MCP is authorized to access your WhatsApp Business API

## Features

### 1. Create Challenge

Users can create a challenge by sending a message like:

```
Create a challenge: Go to the gym for 1 hour
Amount: ₹500
Deadline: tomorrow at 6pm
```

The system will:
- Parse the message using AI to extract intent and entities
- Create a challenge in the database
- Respond with confirmation and instructions

### 2. Submit Proof

Users can submit proof by sending a photo with a caption like:

```
Proof for my challenge
```

The system will:
- Download the media
- Upload it to Supabase storage
- Verify the proof using Gemini Vision API
- Update challenge status based on verification result
- Respond with the outcome

### 3. List Challenges

Users can list their challenges by sending:

```
list challenges
```

The system will:
- Query active, completed, and failed challenges
- Format and send a summary message

### 4. Check Balance

Users can check their balance by sending:

```
balance
```

The system will:
- Query user profile information
- Send a formatted balance message

### 5. Set Reminders

Users can set reminders by sending:

```
remind me about my challenge tomorrow at 9am
```

The system will:
- Parse the natural language date
- Create a reminder in the database
- Confirm the reminder has been set

### 6. Reminders Cron Job

A cron job runs every minute to:
- Check for pending reminders
- Send WhatsApp messages for any due reminders
- Mark reminders as sent

## Testing

To test the WhatsApp integration:

1. Use a development WhatsApp Business API account
2. Send test messages to your WhatsApp Business number
3. Check logs in Vercel to debug any issues
4. Verify database entries in Supabase

## Troubleshooting

### Common Issues

1. **Webhook Validation Fails**:
   - Check that your Vercel function is deployed correctly
   - Verify the webhook URL in MCP configuration

2. **Intent Classification Issues**:
   - Check the Gemini API key is valid
   - Look at logs to see raw AI responses
   - Adjust prompts if needed

3. **Media Upload Failures**:
   - Verify Supabase storage permissions
   - Check service role key has necessary permissions

4. **Missing Reminders**:
   - Verify cron job is running (check Vercel logs)
   - Check timezone handling in date parsing

## Security Considerations

- The service role key is only used in server-side functions
- Row Level Security policies ensure users can only access their own data
- Media size limits prevent abuse (max 5MB per file)
- Rate limiting is implemented to prevent spam

## Contributing

To contribute to this integration:

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 