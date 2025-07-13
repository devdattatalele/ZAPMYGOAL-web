import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, MessageCircle, Mail, Phone, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const ContactUs = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your BetTask support assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('verification') || lowerMessage.includes('failed') || lowerMessage.includes('proof')) {
      return "I understand you're having issues with verification. Here are some tips:\n\n• Make sure your photo is taken TODAY\n• Image just needs to be RELATED to your task (e.g., gym environment for gym tasks)\n• You get 3 attempts for today's photo + 1 AI verification attempt\n• AI only checks if image relates to task category, not active participation\n\nIf you've exhausted all attempts and believe it was unfair, please email us at support@bettask.com with your challenge details.";
    }
    
    if (lowerMessage.includes('money') || lowerMessage.includes('deduct') || lowerMessage.includes('refund')) {
      return "Regarding money matters:\n\n• Money is deducted automatically when all verification attempts fail\n• Successful challenges keep your money safe\n• Refunds are only processed for technical errors\n• For disputed deductions, email support@bettask.com with evidence\n\nWould you like me to help you with anything else?";
    }
    
    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance') || lowerMessage.includes('fund')) {
      return "For wallet-related queries:\n\n• Add funds through the Dashboard > Wallet section\n• Your balance updates in real-time\n• Transaction history shows all activities\n• Minimum challenge amount is ₹50\n\nNeed help adding funds or checking transactions?";
    }
    
    if (lowerMessage.includes('challenge') || lowerMessage.includes('task') || lowerMessage.includes('deadline')) {
      return "About challenges:\n\n• Set realistic deadlines for better success\n• Choose appropriate verification methods\n• Submit proof before deadline expires\n• Recurring challenges require consistent completion\n\nWhat specific challenge issue can I help with?";
    }
    
    if (lowerMessage.includes('ai') || lowerMessage.includes('gemini') || lowerMessage.includes('automatic')) {
      return "Our AI verification system:\n\n• Uses Google Gemini for image analysis\n• Requires photos taken TODAY\n• Only checks if image RELATES to task category\n• Does NOT require proof of active participation\n• Has 70% confidence threshold\n• Very lenient - just needs to match task type\n\nFor AI disputes, please contact our human support team.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact')) {
      return "I'm here to help! You can:\n\n• Continue chatting with me for quick questions\n• Email: support@bettask.com for detailed issues\n• Phone: +91-XXXX-XXXX-XX (Mon-Fri, 9AM-6PM)\n• Use the contact form below for non-urgent matters\n\nWhat would you prefer?";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm happy to help you with any BetTask questions. Common topics I can assist with:\n\n• Verification issues\n• Wallet & payments\n• Challenge setup\n• Account problems\n\nWhat's on your mind today?";
    }
    
    // Default response
    return "I understand your concern. For detailed assistance with this specific issue, I recommend:\n\n• Emailing our support team at support@bettask.com\n• Calling us at +91-XXXX-XXXX-XX during business hours\n• Using the contact form below\n\nOur human support team can provide personalized help for complex issues.";
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(currentMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleEmailSubmit = () => {
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return;

    // In a real app, this would send an email
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setEmailForm({ subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-metal-darker p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="border-metal-steel text-metal-chrome hover:bg-metal-steel"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-metal-chrome">Contact Support</h1>
            <p className="text-metal-silver">Get help with your BetTask account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chatbot Section */}
          <Card className="metal-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-metal-chrome">
                <Bot className="h-5 w-5 text-metal-accent" />
                <span>AI Support Assistant</span>
                <Badge variant="outline" className="text-metal-success border-metal-success">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-3 p-4 bg-metal-steel/20 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      message.type === 'user' 
                        ? 'bg-metal-accent text-metal-chrome' 
                        : 'bg-metal-steel text-metal-chrome'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}>
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-metal-accent text-metal-chrome ml-auto'
                          : 'bg-metal-steel text-metal-chrome'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                      <p className="text-xs text-metal-silver mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-metal-steel text-metal-chrome">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-metal-steel text-metal-chrome p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-metal-accent rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-metal-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-metal-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your question..."
                  className="bg-metal-steel border-metal-iron text-metal-chrome"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="metal-button text-metal-chrome"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information & Email Form */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="metal-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-metal-chrome">
                  <MessageCircle className="h-5 w-5 text-metal-accent" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-metal-accent" />
                    <div>
                      <p className="text-metal-chrome font-medium">Email Support</p>
                      <p className="text-sm text-metal-silver">support@bettask.com</p>
                      <p className="text-xs text-metal-silver">Response within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-metal-accent" />
                    <div>
                      <p className="text-metal-chrome font-medium">Phone Support</p>
                      <p className="text-sm text-metal-silver">+91-XXXX-XXXX-XX</p>
                      <p className="text-xs text-metal-silver">Mon-Fri, 9AM-6PM IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-metal-accent" />
                    <div>
                      <p className="text-metal-chrome font-medium">Response Times</p>
                      <p className="text-sm text-metal-silver">Chat: Instant • Email: 24hrs • Phone: Immediate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Form */}
            <Card className="metal-card">
              <CardHeader>
                <CardTitle className="text-metal-chrome">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-metal-chrome text-sm">Subject</label>
                  <Input
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    className="bg-metal-steel border-metal-iron text-metal-chrome"
                  />
                </div>
                
                <div>
                  <label className="text-metal-chrome text-sm">Message</label>
                  <Textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    className="bg-metal-steel border-metal-iron text-metal-chrome"
                    rows={6}
                  />
                </div>
                
                {user && (
                  <div className="p-3 bg-metal-steel/30 rounded-lg">
                    <p className="text-sm text-metal-silver">
                      📧 We'll reply to: <span className="text-metal-accent">{user.email}</span>
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleEmailSubmit}
                  disabled={!emailForm.subject.trim() || !emailForm.message.trim()}
                  className="w-full metal-button text-metal-chrome"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="metal-card">
          <CardHeader>
            <CardTitle className="text-metal-chrome">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-metal-chrome">Why was my verification rejected?</h4>
                  <p className="text-sm text-metal-silver">Photos must be taken TODAY and clearly show task completion. You get 3 attempts for today's photo verification.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-metal-chrome">How does money deduction work?</h4>
                  <p className="text-sm text-metal-silver">Money is automatically deducted when all verification attempts are exhausted or deadline passes.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-metal-chrome">Can I get a refund?</h4>
                  <p className="text-sm text-metal-silver">Refunds are only provided for technical errors or system failures, not for legitimate verification failures.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-metal-chrome">How accurate is AI verification?</h4>
                  <p className="text-sm text-metal-silver">Our AI has 70%+ accuracy and is constantly improving. Complex cases go to manual review.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs; 