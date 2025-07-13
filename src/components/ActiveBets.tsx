import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Timer, 
  Camera, 
  AlertTriangle, 
  Repeat, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ChevronRight,
  Calendar,
  Coins,
  Zap
} from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { SubmitProof } from './SubmitProof';

const StatusBadge = ({ status, deadline }: { status: string; deadline: string }) => {
  const isExpired = new Date() > new Date(deadline);
  const isUrgent = !isExpired && new Date(deadline).getTime() - new Date().getTime() <= 24 * 60 * 60 * 1000;

  if (status === 'completed') {
    return <Badge className="status-completed border text-xs font-medium">✓ Completed</Badge>;
  }
  
  if (status === 'failed' || isExpired) {
    return <Badge className="status-failed border text-xs font-medium">✗ Failed</Badge>;
  }
  
  if (status === 'pending_verification') {
    return <Badge className="status-pending border text-xs font-medium">⏳ Under Review</Badge>;
  }
  
  if (isUrgent) {
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs font-medium animate-pulse">🔥 Urgent</Badge>;
  }
  
  return <Badge className="status-active border text-xs font-medium">⚡ Active</Badge>;
};

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsUrgent(false);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const days = Math.floor(hours / 24);
      
      setIsUrgent(diff <= 24 * 60 * 60 * 1000);
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex items-center space-x-1 ${isUrgent ? 'text-red-400' : 'text-white/60'}`}>
      <Clock className="h-3 w-3" />
      <span className="text-xs font-medium">{timeLeft}</span>
    </div>
  );
};

export const ActiveBets = () => {
  const { challenges, isLoading } = useChallenges();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  const activeChallenges = challenges?.filter(challenge => 
    challenge.status === 'active' || 
    challenge.status === 'pending_verification' ||
    challenge.status === 'failed' ||
    challenge.status === 'completed'
  ) || [];

  if (selectedChallenge) {
    return (
      <SubmitProof 
        challenge={selectedChallenge} 
        onBack={() => setSelectedChallenge(null)} 
      />
    );
  }

  const isExpired = (deadline: string) => {
    return new Date() > new Date(deadline);
  };

  const isUrgent = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return diff <= 24 * 60 * 60 * 1000 && diff > 0;
  };

  const canSubmitProof = (challenge: any) => {
    return challenge.status === 'active' && !isExpired(challenge.deadline);
  };

  if (isLoading) {
    return (
      <div className="card-modern">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded-xl w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="card-modern"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Active Challenges</h2>
            <p className="text-white/60 text-sm">{activeChallenges.length} total challenges</p>
          </div>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
          {activeChallenges.filter(c => c.status === 'active').length} Active
        </Badge>
      </div>

      <AnimatePresence>
        {activeChallenges.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Timer className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-white/60 mb-2">No active challenges</p>
            <p className="text-sm text-white/40">Ready to create your first challenge?</p>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {activeChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                variants={itemVariants}
                layout
                whileHover={{ y: -2 }}
                className="glass-effect rounded-2xl p-4 border border-white/10 group cursor-pointer"
                onClick={() => canSubmitProof(challenge) && setSelectedChallenge(challenge)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white truncate">{challenge.title}</h3>
                      {challenge.task_type === 'recurring' && (
                        <Repeat className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2 mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={challenge.status} deadline={challenge.deadline} />
                      <CountdownTimer deadline={challenge.deadline} />
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <Coins className="h-4 w-4 text-green-400" />
                      <span className="text-lg font-bold text-green-400">₹{challenge.amount}</span>
                    </div>
                    <p className="text-xs text-white/60">
                      {challenge.status === 'completed' ? 'Saved!' :
                       challenge.status === 'failed' || isExpired(challenge.deadline) ? 'Lost' :
                       'At stake'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-white/60" />
                    <span className="text-xs text-white/60 truncate">
                      Proof: {challenge.verification_details}
                    </span>
                  </div>
                  
                  {canSubmitProof(challenge) ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        className={`transition-all duration-300 ${
                          isUrgent(challenge.deadline)
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'btn-primary'
                        }`}
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Submit
                      </Button>
                    </motion.div>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="bg-white/5 text-white/40 cursor-not-allowed"
                    >
                      {challenge.status === 'pending_verification' ? 'Reviewing' :
                       challenge.status === 'completed' ? 'Completed' :
                       'Ended'}
                    </Button>
                  )}
                </div>
                
                {isUrgent(challenge.deadline) && canSubmitProof(challenge) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-400 font-medium">
                        ⏰ Deadline approaching! Submit proof to save ₹{challenge.amount}
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {isExpired(challenge.deadline) && challenge.status === 'active' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-400 font-medium">
                        💸 Challenge expired! ₹{challenge.amount} will be deducted from your wallet.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
