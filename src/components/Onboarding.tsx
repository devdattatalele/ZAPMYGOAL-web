import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Zap, Target, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "BetTask - Ultimate Accountability",
      subtitle: "Put Your Money Where Your Goals Are",
      description: "Transform your goals into financial commitments. Success returns your money, failure costs you.",
      cta: "I'm Ready",
      icon: Shield,
      color: "from-green-500 to-teal-600",
      emoji: "🎯"
    },
    {
      title: "How It Works",
      subtitle: "Simple. Effective. Costly If You Fail.",
      description: "Set goals, stake money, provide proof when complete. Miss deadlines and lose your stake.",
      cta: "Understood",
      icon: Zap,
      color: "from-blue-500 to-purple-600",
      emoji: "⚡"
    },
    {
      title: "Start Your First Challenge",
      subtitle: "Begin With Something Achievable",
      description: "Choose a realistic goal and reasonable stake. Build your discipline systematically.",
      cta: "Create Challenge",
      icon: Target,
      color: "from-orange-500 to-red-600",
      emoji: "🚀"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    })
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg w-full"
      >
        <div className="card-modern card-depth text-center space-y-8">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="space-y-8"
            >
              {/* Icon and Emoji */}
              <motion.div 
                className="flex flex-col items-center space-y-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${currentStep.color} rounded-2xl flex items-center justify-center shadow-lg animate-float`}>
                  <currentStep.icon className="h-10 w-10 text-white" />
        </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-4xl"
                >
                  {currentStep.emoji}
                </motion.div>
              </motion.div>
              
              {/* Content */}
              <motion.div
                variants={itemVariants}
                className="space-y-4"
              >
                <h1 className="text-3xl font-bold text-gradient leading-tight">
            {currentStep.title}
          </h1>
                <p className="text-xl font-semibold text-green-400">
            {currentStep.subtitle}
          </p>
                <p className="text-white/70 leading-relaxed text-lg max-w-md mx-auto">
            {currentStep.description}
          </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Action Button */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
          <Button 
            onClick={handleNext}
              className="w-full btn-primary btn-glow py-4 text-lg font-bold"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{currentStep.cta}</span>
                <ChevronRight className="h-5 w-5" />
              </div>
          </Button>
          </motion.div>

          {/* Progress Dots */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center space-x-3 pt-4"
          >
          {steps.map((_, index) => (
              <motion.div
              key={index}
                className={`h-3 w-12 rounded-full transition-all duration-500 ${
                  index === step 
                    ? 'bg-gradient-to-r from-green-400 to-teal-500 shadow-lg shadow-green-400/30' 
                    : 'bg-white/20'
              }`}
                whileHover={{ scale: 1.1 }}
                animate={{
                  scale: index === step ? 1.1 : 1,
                  opacity: index === step ? 1 : 0.6
                }}
                transition={{ duration: 0.3 }}
            />
          ))}
          </motion.div>

          {/* Step Counter */}
          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <p className="text-white/60 text-sm font-medium">
              Step {step + 1} of {steps.length}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
