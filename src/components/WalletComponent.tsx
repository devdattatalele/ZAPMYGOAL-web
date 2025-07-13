import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  History,
  Coins,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface WalletComponentProps {
  balance: number;
  lostThisMonth: number;
}

const QuickAmountButton = ({ 
  amount, 
  onSelect, 
  isSelected 
}: { 
  amount: number; 
  onSelect: (amount: number) => void;
  isSelected: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(amount)}
    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
      isSelected
        ? 'border-green-500/60 bg-green-500/15 text-green-300 shadow-lg shadow-green-500/20'
        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-white'
    }`}
  >
    <div className="text-center">
      <div className="text-lg font-bold">₹{amount}</div>
      <div className="text-xs opacity-70 font-medium">
        {amount <= 500 ? 'Safe' : amount <= 1000 ? 'Medium' : 'High'}
      </div>
    </div>
  </motion.button>
);

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isCredit = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund';
  const icon = isCredit ? ArrowUpRight : ArrowDownRight;
  const color = isCredit ? 'text-green-400' : 'text-red-400';
  const bgColor = isCredit ? 'bg-green-500/10' : 'bg-red-500/10';
  
  const getEmoji = () => {
    switch (transaction.transaction_type) {
      case 'deposit': return '💰';
      case 'refund': return '🎉';
      case 'deduction': return '💸';
      default: return '💳';
    }
  };

  const getDescription = () => {
    switch (transaction.transaction_type) {
      case 'deposit': return 'Funds Added';
      case 'refund': return 'Challenge Completed';
      case 'deduction': return 'Challenge Failed';
      default: return transaction.description;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-4 rounded-xl ${bgColor} border border-white/10`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
          <span className="text-lg">{getEmoji()}</span>
        </div>
        <div>
          <p className="font-medium text-white">{getDescription()}</p>
          <p className="text-xs text-white/60">
            {new Date(transaction.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <div className={`flex items-center space-x-1 ${color}`}>
        {React.createElement(icon, { className: "h-4 w-4" })}
        <span className="font-bold">₹{transaction.amount.toLocaleString()}</span>
      </div>
    </motion.div>
  );
};

export const WalletComponent = ({ balance, lostThisMonth }: WalletComponentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const { addFunds, transactions } = useWallet();

  const quickAmounts = [100, 500, 1000, 2000];
  
  const recentTransactions = transactions?.slice(0, 5) || [];
  const totalDeposited = transactions?.filter(t => t.transaction_type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalLost = transactions?.filter(t => t.transaction_type === 'deduction').reduce((sum, t) => sum + t.amount, 0) || 0;
  const successRate = totalDeposited > 0 ? Math.round(((totalDeposited - totalLost) / totalDeposited) * 100) : 0;

  const handleAddFunds = async () => {
    const amount = selectedQuickAmount || parseInt(customAmount);
    if (!amount || amount < 50) return;

    try {
      await addFunds.mutateAsync({ amount });
      setIsDialogOpen(false);
      setCustomAmount('');
      setSelectedQuickAmount(null);
    } catch (error) {
      console.error('Failed to add funds:', error);
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    setSelectedQuickAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedQuickAmount(null);
  };

  const finalAmount = selectedQuickAmount || parseInt(customAmount) || 0;

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="card-modern card-depth"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-xl flex items-center justify-center">
            <Wallet className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Wallet</h2>
            <p className="text-white/60 text-sm">Manage your funds</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="btn-primary btn-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add Funds to Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Quick Amount Selection */}
              <div>
                <p className="text-sm text-white/70 mb-3">Quick Select:</p>
                <div className="grid grid-cols-4 gap-3">
                  {quickAmounts.map((amount) => (
                    <QuickAmountButton
                      key={amount}
                      amount={amount}
                      onSelect={handleQuickAmountSelect}
                      isSelected={selectedQuickAmount === amount}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <p className="text-sm text-white/70 mb-2">Or enter custom amount:</p>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter amount (min ₹50)"
                  className="input-modern"
                  min="50"
                  step="50"
                />
              </div>

              {/* Preview */}
              {finalAmount >= 50 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="glass-effect rounded-2xl p-4 border border-green-500/20"
                >
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Adding to wallet:</p>
                    <p className="text-2xl font-bold text-gradient">₹{finalAmount.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">
                      New balance: ₹{(balance + finalAmount).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleAddFunds}
                disabled={finalAmount < 50 || addFunds.isPending}
                className="w-full btn-primary py-3"
              >
                {addFunds.isPending ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Add ₹${finalAmount.toLocaleString()} to Wallet`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Balance Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        variants={itemVariants}
      >
        {/* Current Balance */}
        <motion.div 
          className="glass-effect rounded-2xl p-4 border border-white/10"
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/60 font-medium">Current Balance</p>
            <Coins className="h-4 w-4 text-green-400" />
          </div>
          <motion.p 
            className="text-2xl font-bold text-gradient"
            key={balance}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            ₹{balance.toLocaleString()}
          </motion.p>
          <p className="text-xs text-white/60 mt-1 font-medium">Available for challenges</p>
        </motion.div>

        {/* Monthly Loss */}
        <motion.div 
          className="glass-effect rounded-2xl p-4 border border-white/10"
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/60 font-medium">Lost This Month</p>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">₹{lostThisMonth.toLocaleString()}</p>
          <p className="text-xs text-white/60 mt-1 font-medium">Failed challenges</p>
        </motion.div>

        {/* Success Rate */}
        <motion.div 
          className="glass-effect rounded-2xl p-4 border border-white/10"
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/60 font-medium">Success Rate</p>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{successRate}%</p>
          <p className="text-xs text-white/60 mt-1 font-medium">Challenge completion</p>
        </motion.div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-white/60" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <Badge className="bg-white/10 text-white/60 border-white/20 border text-xs">
            {transactions?.length || 0} Total
          </Badge>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-white/40" />
                </div>
                <p className="text-white/60 mb-2">No transactions yet</p>
                <p className="text-sm text-white/40">Add funds or create challenges to see activity</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {recentTransactions.length > 0 && transactions && transactions.length > 5 && (
          <motion.div 
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button 
              variant="outline" 
              className="btn-secondary text-sm"
            >
              View All Transactions ({transactions.length})
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
