import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Lock, User, RefreshCw, Zap } from 'lucide-react';

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full"
      >
        <div className="card-modern card-depth">
          <motion.div variants={itemVariants} className="text-center space-y-6 mb-8">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white animate-pulse-slow" />
          </div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold text-gradient">
            {isSignUp ? 'Join BetTask' : 'Welcome Back'}
              </h1>
              <p className="text-white/70 text-lg font-medium">
            {isSignUp ? 'Create your accountability account' : 'Sign in to your account'}
          </p>
            </motion.div>
          </motion.div>

          <motion.form onSubmit={handleAuth} variants={itemVariants} className="space-y-6">
            <AnimatePresence mode="wait">
            {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <Label htmlFor="fullName" className="text-white flex items-center space-x-2 font-medium">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <User className="h-4 w-4 text-green-400" />
                    </motion.div>
                  <span>Full Name</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                    className="input-modern"
                    placeholder="Enter your full name"
                  required
                />
                </motion.div>
            )}
            </AnimatePresence>
            
            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="email" className="text-white flex items-center space-x-2 font-medium">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail className="h-4 w-4 text-green-400" />
                </motion.div>
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern"
                placeholder="Enter your email"
                required
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="password" className="text-white flex items-center space-x-2 font-medium">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Lock className="h-4 w-4 text-green-400" />
                </motion.div>
                <span>Password</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern"
                placeholder="Enter your password"
                required
              />
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
            <Button
              type="submit"
                className="w-full btn-primary btn-glow py-4 text-lg font-bold"
              disabled={loading}
            >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  </div>
                )}
            </Button>
            </motion.div>
          </motion.form>
          
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
                className="text-white/70 hover:text-white hover:bg-white/10 font-medium text-base rounded-xl px-6 py-3"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
            </motion.div>
          </motion.div>
          </div>
      </motion.div>
    </div>
  );
};
