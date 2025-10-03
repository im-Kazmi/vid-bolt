import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, Play, User, Check, CheckCircle2, ListVideo, ArrowLeft, Sparkles, Clock } from 'lucide-react';

interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

interface PlaylistInfo {
  title: string;
  channel: string;
  videoCount: number;
  videos: PlaylistVideo[];
}

interface PlaylistPreviewProps {
  playlistInfo: PlaylistInfo;
  onBack: () => void;
  onDownloadAll: (quality: string) => void;
  onDownloadSelected: (videos: PlaylistVideo[], quality: string) => void;
}

export function PlaylistPreview({ playlistInfo, onBack, onDownloadAll, onDownloadSelected }: PlaylistPreviewProps) {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [downloadMode, setDownloadMode] = useState<'all' | 'selected'>('all');

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const selectAllVideos = () => {
    setSelectedVideos(new Set(playlistInfo.videos.map(v => v.id)));
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  const handleDownload = () => {
    if (downloadMode === 'all') {
      onDownloadAll(selectedQuality);
    } else {
      const selectedVideosList = playlistInfo.videos.filter(v => selectedVideos.has(v.id));
      onDownloadSelected(selectedVideosList, selectedQuality);
    }
  };

  const qualities = ['360p', '480p', '720p', '1080p', 'Audio Only'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full min-h-screen px-4 py-8 space-y-6"
    >
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto"
      >
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="group hover:bg-primary/10 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          Back
        </Button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
        className="max-w-7xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-2xl">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative p-8 space-y-6">
            <div className="flex items-start gap-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-xl">
                  <ListVideo className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  className="absolute -inset-1 bg-primary/30 rounded-2xl blur-lg -z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex-1 space-y-3"
              >
                <h1 className="text-4xl font-bold leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {playlistInfo.title}
                </h1>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">{playlistInfo.channel}</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
                  >
                    <Play className="w-4 h-4" />
                    <span className="font-medium">{playlistInfo.videoCount} videos</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Videos List - Takes 2/3 of space */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-semibold flex items-center gap-2"
            >
              Videos
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {playlistInfo.videos.length}
              </span>
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2"
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllVideos}
                className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
                className="hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300"
              >
                Clear
              </Button>
            </motion.div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <AnimatePresence>
              {playlistInfo.videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card
                    className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ${
                      selectedVideos.has(video.id)
                        ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                    onClick={() => toggleVideoSelection(video.id)}
                  >
                    <div className="p-4 flex items-center gap-4">
                      {/* Thumbnail */}
                      <motion.div
                        className="relative flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          >
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 text-white ml-0.5" />
                            </div>
                          </motion.div>
                          {video.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                              {video.duration}
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{video.channel}</span>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: selectedVideos.has(video.id) ? 1.1 : 1 }}
                        className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          selectedVideos.has(video.id)
                            ? 'bg-primary border-primary shadow-lg shadow-primary/50'
                            : 'border-border group-hover:border-primary/50'
                        }`}
                      >
                        <AnimatePresence>
                          {selectedVideos.has(video.id) && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Download Options Sidebar - Takes 1/3 of space */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <motion.div
            className="sticky top-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-xl">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
              
              <div className="relative p-6 space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center space-y-3"
                >
                  <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary px-4 py-2 rounded-full font-semibold shadow-lg">
                    <Download className="w-4 h-4" />
                    Download Options
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm text-muted-foreground"
                  >
                    {selectedVideos.size > 0 
                      ? `${selectedVideos.size} video${selectedVideos.size > 1 ? 's' : ''} selected`
                      : 'Select videos to download'
                    }
                  </motion.p>
                </motion.div>

                {/* Download Mode */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Download Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={downloadMode === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDownloadMode('all')}
                      className={`transition-all duration-300 ${
                        downloadMode === 'all' 
                          ? 'shadow-lg shadow-primary/30' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      All Videos
                    </Button>
                    <Button
                      variant={downloadMode === 'selected' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDownloadMode('selected')}
                      disabled={selectedVideos.size === 0}
                      className={`transition-all duration-300 ${
                        downloadMode === 'selected' 
                          ? 'shadow-lg shadow-primary/30' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      Selected ({selectedVideos.size})
                    </Button>
                  </div>
                </motion.div>

                {/* Quality Selection */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Quality
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {qualities.map((quality, index) => (
                      <motion.div
                        key={quality}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 + index * 0.05 }}
                      >
                        <Button
                          variant={selectedQuality === quality ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedQuality(quality)}
                          className={`w-full transition-all duration-300 ${
                            selectedQuality === quality 
                              ? 'shadow-lg shadow-primary/30' 
                              : 'hover:border-primary/50'
                          }`}
                        >
                          {quality}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Download Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="w-full gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
                    disabled={downloadMode === 'selected' && selectedVideos.size === 0}
                  >
                    <Download className="w-5 h-5" />
                    {downloadMode === 'all' 
                      ? 'Download All Videos' 
                      : `Download ${selectedVideos.size} Video${selectedVideos.size !== 1 ? 's' : ''}`
                    }
                  </Button>
                </motion.div>

                {/* Info Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <Card className="p-3 bg-green-500/10 border-green-500/20">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Videos will be organized in folders by playlist name</span>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}