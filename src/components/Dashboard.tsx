import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WalletComponent } from './WalletComponent';
import { BetCreation } from './BetCreation';
import { ActiveBets } from './ActiveBets';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges } from '@/hooks/useChallenges';
import { useWallet } from '@/hooks/useWallet';
import { 
  TrendingDown, 
  Plus, 
  Target, 
  Coins, 
  LogOut, 
  Calendar,
  Trophy,
  Zap,
  TrendingUp,
  Star,
  ChevronRight
} from 'lucide-react';

const motivationalQuotes = [
  "Discipline is the bridge between goals and accomplishment",
  "Success is the sum of small efforts repeated daily",
  "The way to get started is to quit talking and begin doing",
  "Don't watch the clock; do what it does. Keep going",
  "The future depends on what you do today"
];

export const Dashboard = () => {
  const [showBetCreation, setShowBetCreation] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { challenges } = useChallenges();
  const { wallet, transactions } = useWallet();
  
  // Rotate quotes every 10 seconds
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics
  const lostThisMonth = transactions?.filter(t => {
    const transactionDate = new Date(t.created_at);
    const currentDate = new Date();
    return (
      t.transaction_type === 'deduction' &&
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  }).reduce((total, t) => total + t.amount, 0) || 0;

  const activeChallenges = challenges?.filter(c => 
    c.status === 'active' || c.status === 'pending_verification'
  ).length || 0;

  const completedChallenges = challenges?.filter(c => 
    c.status === 'completed'
  ).length || 0;

  const totalChallenges = challenges?.length || 0;
  const successRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  if (showBetCreation) {
    return <BetCreation onBack={() => setShowBetCreation(false)} />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.08
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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Target className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome back!
              </h1>
              <p className="text-white/70 text-sm sm:text-base font-semibold">
                {user?.email?.split('@')[0] || 'Champion'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div 
              className="glass-effect rounded-2xl px-4 py-3"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-right">
                <p className="text-xs text-white/60">Total Balance</p>
                <motion.p 
                  className="text-xl sm:text-2xl font-bold text-gradient"
                  key={wallet?.balance}
                  initial={{ scale: 1.2, y: -2 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  ₹{wallet?.balance?.toLocaleString() || '0'}
                </motion.p>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
                className="glass-effect border-white/10 text-white hover:bg-white/20 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          <motion.div 
            className="card-modern card-depth"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Active</p>
                <p className="text-2xl font-bold text-white">{activeChallenges}</p>
                <p className="text-xs text-green-400">Challenges</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center icon-shine">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="card-modern card-depth"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Success</p>
                <p className="text-2xl font-bold text-white">{successRate}%</p>
                <p className="text-xs text-emerald-400">Rate</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center icon-shine">
                <Trophy className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="card-modern card-depth"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Lost</p>
                <p className="text-2xl font-bold text-red-400">₹{lostThisMonth.toLocaleString()}</p>
                <p className="text-xs text-white/60">This month</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center icon-shine">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="card-modern card-depth"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{totalChallenges}</p>
                <p className="text-xs text-blue-400">Challenges</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center icon-shine">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, position: 'absolute' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="card-modern card-depth bg-gradient-to-r from-green-500/10 to-teal-600/10 border-green-500/20 py-8"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse-slow shadow-lg">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-white leading-relaxed mb-3">
                    "{motivationalQuotes[currentQuote]}"
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60 font-medium">Daily Motivation</p>
                    <div className="flex space-x-1">
                      {motivationalQuotes.map((_, index) => (
                        <motion.div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentQuote ? 'bg-green-400' : 'bg-white/20'
                          }`}
                          whileHover={{ scale: 1.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="card-modern card-depth cursor-pointer"
              onClick={() => setShowBetCreation(true)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Create Challenge</h3>
                  <p className="text-white/60 text-sm mb-4">Set a new goal and commitment</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="btn-primary btn-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    New Challenge
                  </Button>
                  </motion.div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center">
                  <Target className="h-8 w-8 text-green-400 animate-float" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="card-modern card-depth"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Progress Today</h3>
                  <p className="text-white/60 text-sm mb-4">Keep building momentum</p>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                      <Progress value={successRate} className="h-3 progress-glow" />
                    </motion.div>
                    <p className="text-xs text-white/60 font-medium">{successRate}% Success Rate</p>
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-400 icon-shine" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Active Challenges */}
        <motion.div variants={itemVariants}>
          <ActiveBets />
        </motion.div>

        {/* Wallet */}
        <motion.div variants={itemVariants}>
          <WalletComponent balance={wallet?.balance || 0} lostThisMonth={lostThisMonth} />
        </motion.div>
      </div>
    </motion.div>
  );
};
