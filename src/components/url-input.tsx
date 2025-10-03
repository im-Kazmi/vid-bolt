import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Play, Loader2, ArrowLeft } from 'lucide-react';

interface UrlInputProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  showBackButton?: boolean;
  title: string;
  description: string;
}

export function UrlInput({
  videoUrl,
  setVideoUrl,
  isLoading,
  onSubmit,
  onBack,
  showBackButton = true,
  title,
  description
}: UrlInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full max-w-2xl space-y-8"
    >
      {showBackButton && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-2">
            <Download className="w-4 h-4" />
            Step 1: Paste URL
          </div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-muted-foreground text-balance text-lg">{description}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <Input
              type="url"
              placeholder="https://youtube.com/playlist?list=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="h-16 text-lg px-6 rounded-2xl border-2 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-lg"
              autoFocus
              disabled={isLoading}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={!videoUrl.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Continue to Preview
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}