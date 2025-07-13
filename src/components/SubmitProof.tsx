import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  X, 
  HelpCircle,
  Image as ImageIcon,
  FileText,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { performCompleteVerification } from '@/lib/verification';
import { useWallet } from '@/hooks/useWallet';

interface SubmitProofProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    amount: number;
    verification_method: string;
    verification_details: string;
    deadline: string;
    created_at: string;
  };
  onBack: () => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-7 w-7 text-green-400" />;
    case 'failed':
      return <AlertCircle className="h-7 w-7 text-red-400" />;
    case 'pending':
      return <Clock className="h-7 w-7 text-yellow-400" />;
    default:
      return <RefreshCw className="h-7 w-7 text-blue-400" />;
  }
};

export const SubmitProof = ({ challenge, onBack }: SubmitProofProps) => {
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [showContactUs, setShowContactUs] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const { deductFunds } = useWallet();

  // Check for existing submission
  useEffect(() => {
    const fetchExistingSubmission = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching submission:', error);
        return;
      }

      if (data && data.length > 0) {
        setExistingSubmission(data[0]);
        // Pre-fill form with existing data if resubmitting
        if (data[0].verification_status === 'failed' || data[0].verification_status === 'pending') {
          const submissionData = data[0].submission_data as any;
          if (submissionData?.text) {
            setProofText(submissionData.text);
          }
        }
      }
    };

    fetchExistingSubmission();
  }, [challenge.id]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setProofFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setProofFile(null);
  };

  const handleSubmit = async () => {
    if (!proofText && !proofFile) {
      toast({
        title: "Proof Required",
        description: "Please provide either text description or upload a file as proof.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setVerificationProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let verificationResult = null;
      let imageMetadata = null;
      let imageUrl = null;

      // If image is provided, perform advanced verification
      if (proofFile && proofFile.type.startsWith('image/')) {
        setIsVerifying(true);
        setVerificationProgress(25);

        try {
          verificationResult = await performCompleteVerification(
            proofFile,
            challenge.description,
            challenge.verification_details,
            user.id,
            challenge.id,
            existingSubmission
          );
          
          imageMetadata = verificationResult.metadata;
          imageUrl = verificationResult.imageUrl;
          setVerificationProgress(100);
        } catch (error) {
          console.error('Verification error:', error);
          toast({
            title: "Verification Error",
            description: "Could not verify image. Please try again or contact support.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsVerifying(false);
          return;
        }
        
        setIsVerifying(false);
      }

      const submissionData = {
        text: proofText,
        fileName: proofFile?.name,
        fileSize: proofFile?.size,
        fileType: proofFile?.type,
        verificationResult,
      };

      // Determine verification status and attempts
      let verificationStatus = 'pending';
      let verified = null;
      let metadataAttempts = (existingSubmission?.metadata_attempts || 0);
      let aiAttempts = (existingSubmission?.ai_attempts || 0);
      
      if (verificationResult) {
        // Increment attempt counts based on what failed
        if (verificationResult.failureReason === 'metadata') {
          metadataAttempts += 1;
        } else if (verificationResult.failureReason === 'ai') {
          aiAttempts += 1;
        }

        if (verificationResult.overallResult) {
          verificationStatus = 'approved';
          verified = true;
        } else if (verificationResult.attemptsExhausted) {
          verificationStatus = 'failed';
          verified = false;
        } else if (verificationResult.shouldTryAgain) {
          verificationStatus = 'pending'; // Allow resubmission
          verified = null;
        } else {
          verificationStatus = 'manual_review';
          verified = null;
        }
      }

      // Update existing submission or create new one
      if (existingSubmission) {
        // Update existing submission
        const { error } = await supabase
          .from('task_submissions')
          .update({
            submission_data: submissionData,
            submission_type: proofFile ? 'file' : 'text',
            image_metadata: imageMetadata,
            image_url: imageUrl,
            verification_status: verificationStatus,
            verified,
            metadata_attempts: metadataAttempts,
            ai_attempts: aiAttempts,
            submitted_at: new Date().toISOString(),
            verification_notes: verificationResult?.timestampCheck?.reason || 
                              verificationResult?.aiVerification?.analysis ||
                              null,
          })
          .eq('id', existingSubmission.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('task_submissions')
          .insert({
            challenge_id: challenge.id,
            user_id: user.id,
            submission_type: proofFile ? 'file' : 'text',
            submission_data: submissionData,
            image_metadata: imageMetadata,
            image_url: imageUrl,
            verification_status: verificationStatus,
            verified,
            metadata_attempts: metadataAttempts,
            ai_attempts: aiAttempts,
            verification_notes: verificationResult?.timestampCheck?.reason || 
                              verificationResult?.aiVerification?.analysis ||
                              null,
          });

        if (error) throw error;
      }

      // Update challenge status and handle wallet deduction
      let challengeStatus = 'pending_verification';
      if (verificationStatus === 'approved') {
        challengeStatus = 'completed';
      } else if (verificationStatus === 'failed' && verificationResult?.attemptsExhausted) {
        challengeStatus = 'failed';
        
        // Automatically deduct money when all attempts are exhausted
        try {
          await deductFunds.mutateAsync({
            amount: challenge.amount,
            challengeId: challenge.id,
            description: `Challenge failed: ${challenge.title}`
          });
        } catch (deductError) {
          console.error('Deduction error:', deductError);
        }
      }

      await supabase
        .from('challenges')
        .update({ status: challengeStatus })
        .eq('id', challenge.id);

      // Show appropriate message
      if (verificationStatus === 'approved') {
        toast({
          title: "Challenge Completed! 🎉",
          description: "Your proof has been automatically verified. Great job!",
        });
        onBack();
      } else if (verificationStatus === 'failed' && verificationResult?.attemptsExhausted) {
        toast({
          title: "Challenge Failed",
          description: `All attempts exhausted. ₹${challenge.amount} has been deducted from your wallet.`,
          variant: "destructive",
        });
        setShowContactUs(true);
      } else if (verificationResult?.shouldTryAgain) {
        const attemptsLeft = verificationResult.failureReason === 'metadata' 
          ? 3 - metadataAttempts 
          : verificationResult.failureReason === 'ai'
          ? 1 - aiAttempts
          : 0;
        
        const failureMessage = verificationResult.failureReason === 'metadata'
          ? verificationResult.timestampCheck?.reason || 'Photo must be taken today'
          : verificationResult.aiVerification?.analysis || 'AI verification failed';
        
        toast({
          title: "Verification Failed",
          description: `${failureMessage}. You have ${attemptsLeft} attempt(s) left.`,
          variant: "destructive",
        });
        
        // Refresh the existing submission data
        const { data } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          setExistingSubmission(data[0]);
        }
      } else {
        toast({
          title: "Proof Submitted!",
          description: "Your proof has been submitted and is under review.",
        });
        onBack();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsVerifying(false);
    }
  };

  const getAttemptInfo = () => {
    if (!existingSubmission) return null;
    
    const metadataAttempts = existingSubmission.metadata_attempts || 0;
    const aiAttempts = existingSubmission.ai_attempts || 0;
    
    return {
      metadataAttempts,
      aiAttempts,
      metadataAttemptsLeft: Math.max(0, 3 - metadataAttempts),
      aiAttemptsLeft: Math.max(0, 1 - aiAttempts),
    };
  };

  const attemptInfo = getAttemptInfo();
  const canResubmit = existingSubmission && 
    (existingSubmission.verification_status === 'failed' || 
     existingSubmission.verification_status === 'pending') &&
    !showContactUs;

  const isVerified = existingSubmission?.verification_status === 'approved';

  if (showContactUs) {
    return (
      <motion.div 
        className="min-h-screen gradient-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
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
            <div>
              <h1 className="text-2xl font-bold text-white">Need Help?</h1>
              <p className="text-white/70">Contact our support team</p>
            </div>
          </motion.div>

          <motion.div 
            className="card-modern card-depth border-red-500/30 bg-red-500/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <HelpCircle className="h-20 w-20 text-red-400 mx-auto" />
              </motion.div>
              <motion.h3 
                className="text-xl font-bold text-red-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Challenge Failed
              </motion.h3>
              <motion.p 
                className="text-white leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                All verification attempts have been exhausted for this challenge.
                ₹{challenge.amount} has been deducted from your wallet.
              </motion.p>
              <motion.p 
                className="text-white/60 text-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                If you believe this was an error, please contact our support team for assistance.
              </motion.p>
              <motion.div 
                className="glass-effect rounded-2xl p-4 border border-white/10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <h4 className="font-semibold text-white mb-3">Contact Support:</h4>
                <div className="space-y-2 text-sm text-white/70">
                  <p>📧 Email: support@bettask.com</p>
                  <p>💬 Chat: Available 24/7 below</p>
                  <p>📱 Phone: +91-XXXX-XXXX-XX</p>
              </div>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
              <Button 
                onClick={onBack}
                  className="btn-primary btn-glow"
              >
                Return to Dashboard
              </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (isVerified) {
    return (
      <motion.div 
        className="min-h-screen gradient-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
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
            <div>
              <h1 className="text-2xl font-bold text-white">Challenge Completed!</h1>
              <p className="text-white/70">Your proof has been verified</p>
            </div>
          </motion.div>

          <motion.div 
            className="card-modern card-depth border-green-500/30 bg-green-500/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center space-y-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.3, 
                  type: "spring", 
                  stiffness: 200,
                  times: [0, 0.6, 1]
                }}
              >
                <CheckCircle className="h-24 w-24 text-green-400 mx-auto" />
              </motion.div>
              
              <motion.h3 
                className="text-2xl font-bold text-green-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Verification Successful!
              </motion.h3>
              
              <motion.p 
                className="text-white text-lg leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Your challenge has been completed and verified.
              </motion.p>
              
              <motion.div 
                className="glass-effect rounded-2xl p-8 border border-green-500/20 bg-green-500/5"
                initial={{ y: 30, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.p 
                  className="text-4xl font-bold text-gradient mb-3"
                  initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
              >
                  ₹{challenge.amount} saved!
                </motion.p>
                <motion.p 
                  className="text-white/80 text-lg font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  Great job staying committed! 🎉
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0 w-full overflow-hidden">
        {/* Header */}
        <motion.div 
          className="flex items-center space-x-3 sm:space-x-4"
          variants={itemVariants}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="glass-effect border-white/20 text-white hover:bg-white/20 rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
              {canResubmit ? 'Resubmit Proof' : 'Submit Proof'}
            </h1>
            <p className="text-white/70 text-sm sm:text-base break-words">
              {canResubmit ? 'Previous submission failed - try again' : 'Provide evidence of task completion'}
            </p>
          </div>
        </motion.div>

        {/* Attempt Status */}
        <AnimatePresence>
          {attemptInfo && (
            <motion.div 
              className="card-modern card-depth border-blue-500/30 bg-blue-500/10"
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Info className="h-6 w-6 text-blue-400 shimmer" />
                </motion.div>
                <h3 className="font-semibold text-blue-400">Verification Attempts</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border backdrop-blur-sm">
                  Tracking Progress
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div 
                  className="glass-effect rounded-xl p-4 border border-white/10"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-white mb-2 font-medium">Photo Timestamp</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">{attemptInfo.metadataAttempts}/3</span>
                    <span className="text-sm text-white/60 font-medium">{attemptInfo.metadataAttemptsLeft} left</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <Progress value={(attemptInfo.metadataAttempts / 3) * 100} className="mt-2 h-3 progress-glow" />
                  </motion.div>
                </motion.div>
                <motion.div 
                  className="glass-effect rounded-xl p-4 border border-white/10"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-white mb-2 font-medium">AI Verification</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">{attemptInfo.aiAttempts}/1</span>
                    <span className="text-sm text-white/60 font-medium">{attemptInfo.aiAttemptsLeft} left</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <Progress value={(attemptInfo.aiAttempts / 1) * 100} className="mt-2 h-3 progress-glow" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Submission Status */}
        <AnimatePresence>
          {existingSubmission && (
            <motion.div 
              className="card-modern card-depth border-yellow-500/30 bg-yellow-500/10"
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                <StatusIcon status={existingSubmission.verification_status} />
                </motion.div>
                <div className="flex-1">
                  {existingSubmission.verification_status === 'failed' && (
                    <>
                      <p className="text-red-400 font-semibold">Previous submission failed</p>
                      <p className="text-sm text-white/70 mt-1">
                        {existingSubmission.verification_notes || 'Verification requirements not met'}
                      </p>
                    </>
                  )}
                  {existingSubmission.verification_status === 'pending' && (
                    <>
                      <p className="text-yellow-400 font-semibold">Under review</p>
                      <p className="text-sm text-white/70 mt-1">Your submission is being verified</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Challenge Info */}
          <div className="space-y-4 lg:space-y-6">
            {/* Challenge Details */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <motion.div 
                  className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center icon-shine"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Challenge Details</h3>
                  <p className="text-white/60 text-xs lg:text-sm">What you committed to do</p>
                </div>
              </div>
              
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2 text-sm lg:text-base">{challenge.title}</h4>
                  <p className="text-white/70 text-xs lg:text-sm leading-relaxed break-words">{challenge.description}</p>
                </div>
                
                <motion.div 
                  className="flex items-center justify-between p-3 lg:p-4 glass-effect rounded-xl border border-white/10"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white/60 font-medium text-xs lg:text-sm">Stake Amount</span>
                  <motion.span 
                    className="text-lg lg:text-2xl font-bold text-gradient"
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ₹{challenge.amount}
                  </motion.span>
                </motion.div>
                
                <motion.div 
                  className="glass-effect rounded-xl p-3 lg:p-4 border border-green-500/20 bg-green-500/5"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs lg:text-sm font-semibold text-green-400 mb-2">Verification Required:</p>
                  <p className="text-xs lg:text-sm text-white/90 leading-relaxed break-words whitespace-pre-wrap overflow-hidden">{challenge.verification_details}</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Guidelines */}
            <motion.div variants={itemVariants} className="card-modern">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Submission Guidelines</h3>
                  <p className="text-white/60 text-xs lg:text-sm">Tips for successful verification</p>
                </div>
              </div>
              
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">Photo must be taken TODAY for automatic verification</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">Image just needs to RELATE to your task (e.g., gym environment for gym tasks)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">AI does NOT require proof of active participation</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-yellow-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">You get 3 attempts for today's photo verification</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-yellow-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">If photo is from today but AI fails, you get 1 additional attempt</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-400 rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <p className="text-xs lg:text-sm text-white/80 break-words">All attempts exhausted = automatic money deduction</p>
                </div>
                {canResubmit && attemptInfo && (
                  <div className="p-2 lg:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-3 lg:mt-4">
                    <p className="text-blue-400 font-medium text-xs lg:text-sm break-words">
                      Attempts remaining: {attemptInfo.metadataAttemptsLeft} photo, {attemptInfo.aiAttemptsLeft} AI
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Submission Form */}
          <div className="space-y-4 lg:space-y-6">
            {/* Verification Progress */}
            <AnimatePresence>
              {isVerifying && (
                <motion.div 
                  className="card-modern card-depth border-blue-500/30 bg-blue-500/10"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="h-6 w-6 text-blue-400" />
                      </motion.div>
                      <span className="text-blue-400 font-semibold text-lg">Verifying your proof...</span>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5 }}
                    >
                      <Progress value={verificationProgress} className="w-full h-4 progress-glow shimmer" />
                    </motion.div>
                    <motion.div 
                      className="text-sm text-white/70 font-medium"
                      key={verificationProgress}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {verificationProgress < 50 ? 'Analyzing image metadata...' :
                       verificationProgress < 100 ? 'Running AI verification...' :
                       'Finalizing verification...'}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text Description */}
            <motion.div variants={itemVariants} className="card-modern">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Description</h3>
                  <p className="text-white/60 text-xs lg:text-sm">Describe how you completed the task</p>
                </div>
              </div>
              
              <Textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Describe how you completed the task..."
                className="input-modern min-h-[100px] lg:min-h-[120px] resize-none text-sm lg:text-base"
                rows={4}
              />
            </motion.div>

            {/* File Upload */}
            <motion.div variants={itemVariants} className="card-modern card-depth">
              <div className="flex items-center space-x-3 mb-4">
                <motion.div 
                  className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center icon-shine"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ImageIcon className="h-5 w-5 lg:h-6 lg:w-6 text-orange-400" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Photo Evidence</h3>
                  <p className="text-white/60 text-xs lg:text-sm">Upload proof for auto-verification</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {!proofFile ? (
                  <motion.div
                    className={`border-2 border-dashed rounded-2xl p-4 lg:p-8 text-center transition-all duration-300 ${
                      dragActive
                        ? 'border-green-500 bg-green-500/10 scale-101'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    whileHover={{ scale: dragActive ? 1.01 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                  >
                      <Camera className="h-12 w-12 lg:h-16 lg:w-16 text-white/40 mx-auto mb-3 lg:mb-4" />
                    </motion.div>
                    <p className="text-white mb-2 font-medium text-sm lg:text-base">Drop your image here or</p>
                    <input
                      id="proofFile"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <motion.label
                      htmlFor="proofFile"
                      className="inline-block cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="btn-secondary px-4 lg:px-6 py-2.5 lg:py-3 rounded-2xl flex items-center space-x-2 font-medium text-sm lg:text-base">
                        <Upload className="h-4 w-4" />
                        <span>Choose File</span>
                      </div>
                    </motion.label>
                    <p className="text-xs text-white/60 mt-2 lg:mt-3 font-medium break-words">
                      ✨ Photo must be taken today for automatic verification
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="glass-effect rounded-2xl p-3 lg:p-4 border border-green-500/20 bg-green-500/5"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex-shrink-0"
                        >
                          <ImageIcon className="h-6 w-6 lg:h-8 lg:w-8 text-green-400" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="text-green-400 font-semibold text-sm lg:text-base break-words">{proofFile.name}</p>
                          <p className="text-xs text-white/60">
                            {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex-shrink-0 ml-2"
                      >
                      <Button
                        onClick={removeFile}
                        variant="outline"
                        size="sm"
                          className="text-red-400 border-red-400 hover:bg-red-500/10 rounded-xl"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.div
                whileHover={{ scale: (!proofText && !proofFile) ? 1 : 1.02 }}
                whileTap={{ scale: (!proofText && !proofFile) ? 1 : 0.98 }}
                className={isSubmitting && !isVerifying && !proofText && !proofFile ? "animate-shake" : ""}
              >
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isVerifying || (!proofText && !proofFile)}
                  className="w-full btn-primary btn-glow py-3 lg:py-4 text-base lg:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isVerifying ? (
                    <div className="flex items-center justify-center space-x-2 lg:space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="h-4 w-4 lg:h-5 lg:w-5" />
                      </motion.div>
                      <span className="text-sm lg:text-base">{isVerifying ? 'Verifying...' : 'Submitting...'}</span>
                  </div>
                ) : (
                    <motion.div 
                      className="flex items-center justify-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Upload className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span className="text-sm lg:text-base">{canResubmit ? 'Resubmit Proof' : 'Submit Proof'}</span>
                    </motion.div>
                )}
              </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
