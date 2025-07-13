import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  DollarSign, 
  Target, 
  Clock, 
  CheckCircle, 
  Lightbulb,
  Repeat,
  Calendar,
  Coins,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useWallet } from '@/hooks/useWallet';

interface BetCreationProps {
  onBack: () => void;
}

const TaskTypeButton = ({ 
  type, 
  currentType, 
  onClick, 
  icon: Icon, 
  label, 
  description 
}: {
  type: string;
  currentType: string;
  onClick: (type: string) => void;
  icon: any;
  label: string;
  description: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(type)}
    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
      currentType === type
        ? 'border-green-500/60 bg-green-500/15 shadow-lg shadow-green-500/20'
        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
    }`}
  >
    <div className="flex items-center space-x-3">
      <motion.div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
          currentType === type ? 'bg-green-500/30' : 'bg-white/10'
        }`}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={`h-6 w-6 ${currentType === type ? 'text-green-300' : 'text-white/60'}`} />
      </motion.div>
      <div>
        <p className={`font-semibold ${currentType === type ? 'text-green-300' : 'text-white'}`}>
          {label}
        </p>
        <p className="text-xs text-white/60 leading-relaxed">{description}</p>
      </div>
    </div>
  </motion.button>
);

export const BetCreation = ({ onBack }: BetCreationProps) => {
  const [amount, setAmount] = useState([100]);
  const [task, setTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskType, setTaskType] = useState('one-time');
  const [recurringFrequency, setRecurringFrequency] = useState('');
  const [recurringDuration, setRecurringDuration] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [verificationDetails, setVerificationDetails] = useState('');
  
  const { createChallenge } = useChallenges();
  const { wallet } = useWallet();

  const getAmountLabel = (value: number) => {
    if (value <= 100) return { label: "Starter", color: "text-blue-400", emoji: "🌱" };
    if (value <= 300) return { label: "Serious", color: "text-yellow-400", emoji: "🔥" };
    if (value <= 500) return { label: "High Stakes", color: "text-orange-400", emoji: "⚡" };
    return { label: "Maximum Risk", color: "text-red-400", emoji: "💎" };
  };

  const verificationOptions = {
    'photo': 'Photo/Video Evidence',
    'document': 'Document Upload',
    'screenshot': 'Screenshot Proof',
    'checkin': 'Location Check-in',
    'witness': 'Third-party Verification',
    'measurement': 'Measurable Result',
    'completion': 'Task Completion Report'
  };

  const getVerificationConditions = () => {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('workout') || taskLower.includes('gym') || taskLower.includes('exercise')) {
      return {
        suggested: 'photo',
        details: 'Photo at gym/workout location with visible timestamp, or fitness app screenshot showing completed workout'
      };
    }
    
    if (taskLower.includes('read') || taskLower.includes('book') || taskLower.includes('study')) {
      return {
        suggested: 'document',
        details: 'Photo of book pages read with notes, or reading app progress screenshot'
      };
    }
    
    if (taskLower.includes('no social media') || taskLower.includes('no phone')) {
      return {
        suggested: 'screenshot',
        details: 'Screen time report showing reduced usage, or app blocking screenshot'
      };
    }
    
    if (taskLower.includes('wake up') || taskLower.includes('sleep')) {
      return {
        suggested: 'screenshot',
        details: 'Sleep tracking app screenshot or alarm confirmation with timestamp'
      };
    }
    
    return {
      suggested: 'photo',
      details: 'Clear photo or video evidence showing task completion with visible timestamp'
    };
  };

  const suggestedVerification = getVerificationConditions();

  const handleCreateChallenge = () => {
    if (!task || !deadline || !verificationMethod) {
      return;
    }

    const currentBalance = wallet?.balance || 0;
    if (currentBalance < amount[0]) {
      return;
    }

    createChallenge.mutate({
      task,
      amount: amount[0],
      deadline,
      taskType: taskType as 'one-time' | 'recurring',
      recurringFrequency: taskType === 'recurring' ? recurringFrequency : undefined,
      recurringDuration: taskType === 'recurring' ? recurringDuration : undefined,
      verificationMethod,
      verificationDetails: verificationDetails || (task ? suggestedVerification.details : ''),
    }, {
      onSuccess: () => {
        onBack();
      }
    });
  };

  const isFormValid = task && deadline && verificationMethod && 
    (taskType === 'one-time' || (recurringFrequency && recurringDuration));
  
  const hasInsufficientBalance = (wallet?.balance || 0) < amount[0];
  const amountInfo = getAmountLabel(amount[0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="min-h-screen gradient-bg"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div 
          className="flex items-center space-x-4"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="glass-effect border-white/10 text-white hover:bg-white/20 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Challenge</h1>
            <p className="text-white/70">Define your commitment and stakes</p>
            <div className="flex items-center space-x-2 mt-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs backdrop-blur-sm">
                  Balance: ₹{wallet?.balance?.toLocaleString() || '0'}
                </Badge>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Balance Warning */}
        <AnimatePresence>
          {hasInsufficientBalance && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="card-modern card-depth border-red-500/30 bg-red-500/10"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </motion.div>
                <div>
                  <p className="text-red-400 font-semibold">Insufficient Balance!</p>
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">
                    You need ₹{amount[0]} but only have ₹{wallet?.balance || 0} in your wallet.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Challenge Type */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Challenge Type</h3>
                  <p className="text-white/60 text-sm">Choose your commitment style</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <TaskTypeButton
                  type="one-time"
                  currentType={taskType}
                  onClick={setTaskType}
                  icon={Target}
                  label="One-time Task"
                  description="Complete once by deadline"
                />
                <TaskTypeButton
                  type="recurring"
                  currentType={taskType}
                  onClick={setTaskType}
                  icon={Repeat}
                  label="Recurring Challenge"
                  description="Repeat over time period"
                />
              </div>

              <AnimatePresence>
                {taskType === 'recurring' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 grid grid-cols-2 gap-3"
                  >
                    <div>
                      <Label className="text-white text-sm">Frequency</Label>
                      <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                        <SelectTrigger className="input-modern">
                          <SelectValue placeholder="How often?" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white text-sm">Duration</Label>
                      <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                        <SelectTrigger className="input-modern">
                          <SelectValue placeholder="For how long?" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="1week">1 Week</SelectItem>
                          <SelectItem value="2weeks">2 Weeks</SelectItem>
                          <SelectItem value="1month">1 Month</SelectItem>
                          <SelectItem value="3months">3 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Task Description */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Task Description</h3>
                  <p className="text-white/60 text-sm">What will you accomplish?</p>
                </div>
              </div>
              
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Complete 30-minute morning workout, Read 20 pages of book, No social media for 24 hours"
                className="input-modern min-h-[100px] resize-none"
                rows={4}
              />
            </motion.div>

            {/* Deadline */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {taskType === 'recurring' ? 'Start Date' : 'Deadline'}
                  </h3>
                  <p className="text-white/60 text-sm">When must this be done?</p>
                </div>
              </div>
              
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-modern"
              />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Financial Stake */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-xl flex items-center justify-center">
                  <Coins className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Financial Stake</h3>
                  <p className="text-white/60 text-sm">How much will you risk?</p>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <motion.div
                  key={amount[0]}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center space-x-2 mb-2"
                >
                  <span className="text-4xl font-bold text-gradient">₹{amount[0]}</span>
                  <span className="text-2xl">{amountInfo.emoji}</span>
                </motion.div>
                <Badge className={`${amountInfo.color} bg-white/10 border-white/20 border`}>
                  {amountInfo.label} Commitment
                </Badge>
              </div>
              
              <div className="space-y-4">
                <Slider
                  value={amount}
                  onValueChange={setAmount}
                  max={1000}
                  min={50}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>₹50 (Safe)</span>
                  <span>₹1000 (Maximum)</span>
                </div>
              </div>
            </motion.div>

            {/* Verification Method */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Verification</h3>
                  <p className="text-white/60 text-sm">How will you prove completion?</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Select 
                  value={verificationMethod} 
                  onValueChange={setVerificationMethod}
                  defaultValue={task ? suggestedVerification.suggested : ''}
                >
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Select verification method" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {Object.entries(verificationOptions).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <span>{label}</span>
                          {task && key === suggestedVerification.suggested && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                              Suggested
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AnimatePresence>
                  {(task || verificationMethod) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass-effect rounded-2xl p-4 border border-green-500/20"
                    >
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-2">
                            AI Verification Suggestion:
                          </p>
                          <Textarea
                            value={verificationDetails || (task ? suggestedVerification.details : '')}
                            onChange={(e) => setVerificationDetails(e.target.value)}
                            placeholder="Specify exact conditions for proof..."
                            className="input-modern text-sm"
                            rows={3}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              onClick={handleCreateChallenge}
              disabled={!isFormValid || createChallenge.isPending || hasInsufficientBalance}
              className="w-full btn-primary btn-glow py-4 text-lg font-bold"
            >
              {createChallenge.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : hasInsufficientBalance ? (
                'Insufficient Balance'
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Create Challenge
                </>
              )}
            </Button>
          </motion.div>
          
          <Button
            variant="outline"
            onClick={onBack}
            className="btn-secondary sm:w-auto w-full"
          >
            Cancel
          </Button>
        </motion.div>

        {/* Challenge Preview */}
        <AnimatePresence>
          {isFormValid && !hasInsufficientBalance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              variants={itemVariants}
              className="card-modern card-depth border-green-500/20 bg-green-500/5"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-bold text-green-400">Challenge Preview</h3>
                </div>
                
                <div className="glass-effect rounded-2xl p-6 border border-green-500/20">
                  <h4 className="text-lg font-medium text-white mb-3">"{task}"</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-white/60">Timeline</p>
                      <p className="text-white font-medium">
                        {taskType === 'recurring' 
                          ? `${recurringFrequency} for ${recurringDuration}`
                          : `Due ${new Date(deadline).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60">Verification</p>
                      <p className="text-white font-medium">
                        {verificationOptions[verificationMethod as keyof typeof verificationOptions]}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60">Stake</p>
                      <p className="text-2xl font-bold text-gradient">₹{amount[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
