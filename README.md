# 🎯 ZapMyGoal - Ultimate Accountability App

**Live Demo**: [zapmygoal.devdattatalele.me](https://zapmygoal.devdattatalele.me)

ZapMyGoal is a revolutionary self-accountability application that helps users achieve their goals by putting money on the line. Success returns your money, failure costs you - creating powerful motivation to stay committed to your objectives.

## 🚀 Features

### Core Functionality
- **Goal Setting**: Create challenges with monetary stakes
- **Proof Submission**: Submit evidence of goal completion
- **AI Verification**: Automated proof verification using Google Gemini AI
- **WhatsApp Integration**: Manage challenges entirely through WhatsApp
- **Wallet System**: Secure financial management with transaction history
- **Reminder System**: Automated notifications for upcoming deadlines

### Challenge Types
- **One-time Challenges**: Single deadline goals
- **Recurring Challenges**: Daily, weekly, or monthly commitments
- **Custom Verification**: Photo, document, screenshot, location check-in, and more

### User Experience
- **Modern UI**: Beautiful, responsive design with shadcn/ui components
- **Real-time Updates**: Live dashboard with progress tracking
- **Mobile-First**: Optimized for mobile and desktop use
- **Intuitive Onboarding**: Guided setup process for new users

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **React Router** for navigation
- **React Query** for data fetching

### Backend & Database
- **Supabase** for database, authentication, and storage
- **PostgreSQL** for data persistence
- **Row Level Security** for data protection

### AI & Integrations
- **Google Gemini AI** for proof verification
- **WhatsApp Business API** for messaging
- **Vercel** for deployment and serverless functions

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **PostCSS** for CSS processing

## 📱 WhatsApp Integration

ZapMyGoal includes a complete WhatsApp integration that allows users to:

- Create challenges via natural language
- Submit proof by sending photos
- Check balance and challenge status
- Set reminders for upcoming deadlines
- Get help and support

### WhatsApp Commands
```
Create a challenge: Go to the gym for 1 hour
Amount: ₹500
Deadline: tomorrow at 6pm

Proof for my challenge
[Send photo]

list challenges
balance
remind me about my challenge tomorrow at 9am
help
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Cloud account (for Gemini AI)
- WhatsApp Business API (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/devdattatalele/ZAPMYGOAL-web.git
   cd ZAPMYGOAL-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   - Run the SQL migrations in `supabase/migrations/`
   - Set up storage buckets for proof images
   - Configure Row Level Security policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 🗄️ Database Setup

The application uses the following main tables:

- **profiles**: User information and balances
- **challenges**: Goal challenges with stakes and deadlines
- **task_submissions**: Proof submissions with AI verification
- **reminders**: Automated notification system
- **transactions**: Financial transaction history

See `DATABASE_SETUP.md` for detailed database configuration.

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the migration scripts
3. Set up storage buckets
4. Configure authentication providers

### WhatsApp Integration
1. Set up WhatsApp Business API
2. Configure MCP (Message Channel Provider)
3. Set webhook endpoints
4. Test message flow

### AI Verification
1. Enable Google Gemini API
2. Set up API keys
3. Configure verification prompts
4. Test image analysis

## 📦 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Website**: [zapmygoal.devdattatalele.me](https://zapmygoal.devdattatalele.me)
- **Email**: support@zapmygoal.com
- **Documentation**: Check the `/docs` folder for detailed guides

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Powered by [Supabase](https://supabase.com/) backend
- AI verification by [Google Gemini](https://ai.google.dev/)
- Deployed on [Vercel](https://vercel.com/)

---

**Ready to transform your goals into achievements?** 🎯

Visit [zapmygoal.devdattatalele.me](https://zapmygoal.devdattatalele.me) to start your accountability journey today!
