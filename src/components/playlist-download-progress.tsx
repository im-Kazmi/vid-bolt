import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { PlaylistDownloadProgress } from '../main';

interface PlaylistDownloadProgressProps {
  progress: PlaylistDownloadProgress;
}

export function PlaylistDownloadProgress({ progress }: PlaylistDownloadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0 || isNaN(seconds)) return "--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="text-center space-y-8 max-w-2xl w-full"
    >
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          scale: { duration: 2, repeat: Number.POSITIVE_INFINITY }
        }}
      >
        <div className="relative">
          <Loader2 className="w-20 h-20 mx-auto text-primary" />
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full blur-lg"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Downloading Playlist...
        </h2>
        <p className="text-muted-foreground text-sm">
          Video {progress.currentVideo} of {progress.totalVideos}
        </p>
      </motion.div>

      <Card className="p-8 space-y-6 bg-card/80 backdrop-blur-sm border-2 shadow-2xl">
        <div className="space-y-4">
          <div className="text-left space-y-2">
            <h3 className="font-semibold text-lg truncate">{progress.videoTitle}</h3>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overall Progress</span>
              <span>{Math.round(progress.overallPercent)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress.overallPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: [-100, 100] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                />
              </motion.div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current Video</span>
              <span>{Math.round(progress.videoPercent)}%</span>
            </div>
            
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.videoPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Downloaded</p>
            <p className="font-semibold">{formatFileSize(progress.downloaded)}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Total</p>
            <p className="font-semibold">
              {progress.total > 0 ? formatFileSize(progress.total) : 'Calculating...'}
            </p>
          </div>
          <div className="text-left space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Speed</p>
            <p className="font-semibold">
              {progress.speed > 0 ? formatFileSize(progress.speed) + "/s" : "Starting..."}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-muted-foreground text-xs font-medium">ETA</p>
            <p className="font-semibold">{formatTime(progress.eta)}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}