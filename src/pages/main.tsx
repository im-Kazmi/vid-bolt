import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Download, Sparkles, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Play, Clock, User } from "lucide-react"
import { getVideoInfo, downloadVideo, onDownloadProgress, selectDownloadPath } from "../lib/electron-api"
import type { VideoInfo, DownloadProgress } from "@/electron.types"

type AppState = "welcome" | "input" | "preview" | "downloading" | "complete" | "error"

export function Home() {
  const [appState, setAppState] = useState<AppState>("welcome")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoData, setVideoData] = useState<VideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  
   const downloadStartTime = useRef<number>(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const hasRealProgressStarted = useRef<boolean>(false)
  const lastProgressUpdate = useRef<number>(0)
  const completionConfirmed = useRef<boolean>(false)

  useEffect(() => {
    console.log("Setting up progress listener...")
    
    const removeProgressListener = onDownloadProgress((progress) => {
      console.log("📥 Download progress received:", progress)
      lastProgressUpdate.current = Date.now()
      
      if (progress.percent > 0 && progressInterval.current) {
        console.log("Real progress detected, stopping simulation")
        clearInterval(progressInterval.current)
        progressInterval.current = null
        hasRealProgressStarted.current = true
      }
      
      setDownloadProgress(progress)
      setDebugInfo(`Real progress: ${progress.percent.toFixed(1)}% - Downloaded: ${formatFileSize(progress.downloaded)} - Total: ${formatFileSize(progress.total)}`)
      
      // More conservative completion detection - only mark as complete when we're very sure
      const shouldComplete = progress.percent >= 99.9 && 
                           progress.total > 0 && 
                           progress.downloaded >= progress.total * 0.999 && // 99.9% of total
                           !completionConfirmed.current
      
      if (shouldComplete) {
        console.log("Download truly complete! Transitioning to complete state.")
        completionConfirmed.current = true
        
        // Force final state
        setDownloadProgress({
          percent: 100,
          downloaded: progress.total,
          total: progress.total,
          speed: 0,
          eta: 0
        })
        
        // Wait a bit to show 100% then transition
        setTimeout(() => {
          setAppState("complete")
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
            progressInterval.current = null
          }
          hasRealProgressStarted.current = false
        }, 1500)
      }
    })

    // Monitor for stalled progress
    const stallInterval = setInterval(() => {
      if (appState === "downloading" && hasRealProgressStarted.current && 
          Date.now() - lastProgressUpdate.current > 5000) {
        console.log("Progress appears stalled, checking status...")
        setDebugInfo(prev => prev + " [Progress stalled]")
      }
    }, 5000)

    return () => {
      console.log("Cleaning up progress listener")
      if (removeProgressListener) removeProgressListener()
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
      clearInterval(stallInterval)
      hasRealProgressStarted.current = false
      completionConfirmed.current = false
    }
  }, [appState])

  // const startFallbackProgress = () => {
  //   console.log("Starting fallback progress simulation")
  //   let simulatedProgress = 0
  //   hasRealProgressStarted.current = false
    
  //   progressInterval.current = setInterval(() => {
  //     if (hasRealProgressStarted.current && progressInterval.current) {
  //       console.log("Stopping simulation - real progress is working")
  //       clearInterval(progressInterval.current)
  //       progressInterval.current = null
  //       return
  //     }
      
  //     simulatedProgress += Math.random() * 3 // Even slower progression
  //     if (simulatedProgress >= 85) {
  //       simulatedProgress = 85 // Stop at 85% to wait for real completion
  //     }
      
  //     setDownloadProgress(prev => ({
  //       percent: simulatedProgress,
  //       downloaded: prev?.downloaded || Math.floor(simulatedProgress * 10000),
  //       total: prev?.total || 1000000,
  //       speed: 300 * 1024, // 300 KB/s
  //       eta: Math.max(0, (100 - simulatedProgress) / 1.5)
  //     }))
      
  //     setDebugInfo(`Simulated progress: ${Math.round(simulatedProgress)}% (waiting for real progress...)`)
  //   }, 1200)
  // }

  const handleGetStarted = () => {
    setAppState("input")
  }

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setIsLoading(true)
    setErrorMessage("")
    setDebugInfo("")

    try {
      const info = await getVideoInfo(videoUrl)
      setVideoData(info)
      setAppState("preview")
    } catch (error) {
      setErrorMessage("Failed to fetch video information. Please check the URL and try again.")
      setAppState("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setAppState("input")
    setVideoData(null)
    setDownloadProgress(null)
    setErrorMessage("")
    setDebugInfo("")
    hasRealProgressStarted.current = false
  }

  // const handleDownload = async (quality: string) => {
  //   try {
  //     const outputPath = await selectDownloadPath()
  //     if (!outputPath) return

  //     console.log("Starting download with quality:", quality)
  //     setAppState("downloading")
  //     setDownloadProgress({ percent: 0, downloaded: 0, total: 0, speed: 0, eta: 0 })
  //     setDebugInfo("Download started...")
      
  //     downloadStartTime.current = Date.now()
  //     hasRealProgressStarted.current = false
  //     lastProgressUpdate.current = Date.now()
      
  //     // Start fallback progress after a short delay
  //     setTimeout(() => {
  //       if (!hasRealProgressStarted.current && appState === "downloading") {
  //         startFallbackProgress()
  //       }
  //     }, 2500)

  //     await downloadVideo(videoUrl, quality, outputPath)
      
  //     console.log("Download finished, waiting for progress events...")
      
  //   } catch (error) {
  //     console.error("Download error:", error)
  //     setErrorMessage("Download failed. Please try again.")
  //     setAppState("error")
  //     if (progressInterval.current) {
  //       clearInterval(progressInterval.current)
  //       progressInterval.current = null
  //     }
  //     hasRealProgressStarted.current = false
  //   }
  // }

  // const handleNewDownload = () => {
  //   setAppState("input")
  //   setVideoUrl("")
  //   setVideoData(null)
  //   setDownloadProgress(null)
  //   setErrorMessage("")
  //   setDebugInfo("")
  //   hasRealProgressStarted.current = false
  // }

    const startFallbackProgress = () => {
    console.log("Starting fallback progress simulation")
    let simulatedProgress = 0
    hasRealProgressStarted.current = false
    completionConfirmed.current = false
    
    progressInterval.current = setInterval(() => {
      if (hasRealProgressStarted.current && progressInterval.current) {
        console.log("Stopping simulation - real progress is working")
        clearInterval(progressInterval.current)
        progressInterval.current = null
        return
      }
      
      simulatedProgress += Math.random() * 3
      if (simulatedProgress >= 85) {
        simulatedProgress = 85
      }
      
      setDownloadProgress(prev => ({
        percent: simulatedProgress,
        downloaded: prev?.downloaded || Math.floor(simulatedProgress * 10000),
        total: prev?.total || 1000000,
        speed: 300 * 1024,
        eta: Math.max(0, (100 - simulatedProgress) / 1.5)
      }))
      
      setDebugInfo(`Simulated progress: ${Math.round(simulatedProgress)}% (waiting for real progress...)`)
    }, 1200)
  }

  const handleDownload = async (quality: string) => {
    try {
      const outputPath = await selectDownloadPath()
      if (!outputPath) return

      console.log("Starting download with quality:", quality)
      setAppState("downloading")
      setDownloadProgress({ percent: 0, downloaded: 0, total: 0, speed: 0, eta: 0 })
      setDebugInfo("Download started...")
      
      downloadStartTime.current = Date.now()
      hasRealProgressStarted.current = false
      lastProgressUpdate.current = Date.now()
      completionConfirmed.current = false
      
      // Start fallback progress after a short delay
      setTimeout(() => {
        if (!hasRealProgressStarted.current && appState === "downloading") {
          startFallbackProgress()
        }
      }, 2500)

      await downloadVideo(videoUrl, quality, outputPath)
      
      console.log("Download finished, waiting for progress events...")
      
    } catch (error) {
      console.error("Download error:", error)
      setErrorMessage("Download failed. Please try again.")
      setAppState("error")
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
      hasRealProgressStarted.current = false
      completionConfirmed.current = false
    }
  }

  const handleNewDownload = () => {
    setAppState("input")
    setVideoUrl("")
    setVideoData(null)
    setDownloadProgress(null)
    setErrorMessage("")
    setDebugInfo("")
    hasRealProgressStarted.current = false
    completionConfirmed.current = false
  }
  const handleTryAgain = () => {
    setAppState("input")
    setErrorMessage("")
    setVideoUrl("")
    setDebugInfo("")
    hasRealProgressStarted.current = false
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0 || isNaN(seconds)) return "--"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getActualProgress = () => {
    if (!downloadProgress || downloadProgress.percent === 0) return 0
    return Math.min(downloadProgress.percent, 100)
  }

  const actualProgress = getActualProgress()
  const isUsingSimulatedProgress = progressInterval.current !== null && !hasRealProgressStarted.current

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="fixed top-4 left-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-mono z-50 border border-yellow-300 max-w-md break-words">
          {debugInfo}
        </div>
      )}

      <AnimatePresence mode="wait">
        {appState === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-8 max-w-2xl w-full"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 4,
                }}
                className="inline-block"
              >
                <div className="relative">
                  <Sparkles className="w-20 h-20 mx-auto text-primary" />
                  <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                </div>
              </motion.div>

              <div className="space-y-4">
                <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  Vid Bolt
                </h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "200px" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-1 bg-gradient-to-r from-primary to-primary/40 mx-auto rounded-full"
                />
              </div>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed max-w-lg mx-auto"
            >
              Lightning-fast YouTube video downloads with stunning quality
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="pt-4"
            >
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
              >
                <Download className="w-5 h-5 mr-2" />
                Start Downloading
              </Button>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-sm text-muted-foreground pt-8 flex items-center justify-center gap-2"
            >
              Built by Abid Kazmi
              <span className="w-1 h-1 bg-primary rounded-full" />
              Crafted with Electron & ❤️
            </motion.p>
          </motion.div>
        )}

        {appState === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-2xl space-y-8"
          >
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button variant="ghost" size="sm" onClick={() => setAppState("welcome")} className="gap-2 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </motion.div>

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
                  Download Any Video
                </h2>
                <p className="text-muted-foreground text-balance text-lg">Paste your YouTube link below to get started</p>
              </div>

              <form onSubmit={handleSubmitUrl} className="space-y-6">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
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
                        Analyzing Video...
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
        )}

        {appState === "preview" && videoData && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-4xl space-y-6"
          >
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="bg-card rounded-3xl overflow-hidden shadow-2xl border"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted"
              >
                <img
                  src={videoData.thumbnail || "/placeholder.svg"}
                  alt={videoData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{videoData.title}</h3>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{videoData.channel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{videoData.duration}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                    <Download className="w-4 h-4" />
                    Step 2: Choose Quality
                  </div>
                  <p className="text-muted-foreground">Select your preferred video quality</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {videoData.formats.slice(0, 4).map((format, index) => (
                    <motion.div
                      key={format.quality}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Button
                        onClick={() => handleDownload(format.quality)}
                        variant="outline"
                        className="w-full h-16 gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-2 hover:border-primary hover:scale-105 group"
                      >
                        <Download className="w-5 h-5 group-hover:animate-bounce" />
                        <div className="text-left">
                          <div className="font-semibold">{format.quality}</div>
                          <div className="text-xs opacity-70">{format.ext.toUpperCase()}</div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {appState === "downloading" && (
          <motion.div
            key="downloading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-8 max-w-md w-full"
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
                Downloading...
              </h2>
              <p className="text-muted-foreground text-sm">
                {actualProgress > 0 ? `Your video is being downloaded` : 'Starting download...'}
                {isUsingSimulatedProgress && (
                  <span className="block text-amber-600 text-xs mt-2 font-medium">
                    ⚡ Real progress detection initializing...
                  </span>
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 bg-card rounded-3xl p-8 border shadow-2xl"
            >
              {/* Progress Bar */}
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full shadow-lg relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${actualProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg border"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    {Math.round(actualProgress)}%
                  </motion.div>
                </div>

                {/* Progress Details */}
                {downloadProgress && actualProgress > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-4 text-sm"
                  >
                    <div className="text-left space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Downloaded</p>
                      <p className="font-bold text-lg">{formatFileSize(downloadProgress.downloaded)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Total</p>
                      <p className="font-bold text-lg">
                        {downloadProgress.total > 0 ? formatFileSize(downloadProgress.total) : 'Calculating...'}
                      </p>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Speed</p>
                      <p className="font-semibold">
                        {downloadProgress.speed > 0 ? formatFileSize(downloadProgress.speed) + "/s" : "Starting..."}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">ETA</p>
                      <p className="font-semibold">{formatTime(downloadProgress.eta)}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Loading Animation for Initial Phase */}
              {actualProgress === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-6 bg-primary rounded-full"
                        animate={{
                          scaleY: [1, 2, 1],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {isUsingSimulatedProgress ? 'Initializing download engine...' : 'Preparing your download...'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {appState === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8 max-w-md"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
              className="relative"
            >
              <CheckCircle2 className="w-24 h-24 mx-auto text-green-500" />
              <motion.div
                className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h2 className="text-4xl font-bold bg-gradient-to-br from-green-600 to-green-500 bg-clip-text text-transparent">
                Success!
              </h2>
              <p className="text-muted-foreground text-lg">
                Your video has been downloaded successfully
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <Button 
                onClick={handleNewDownload} 
                size="lg" 
                className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Another Video
              </Button>
              <p className="text-xs text-muted-foreground">
                Ready for your next download
              </p>
            </motion.div>
          </motion.div>
        )}

        {appState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-8 max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <AlertCircle className="w-20 h-20 mx-auto text-red-500" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold text-red-600">Oops!</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={handleTryAgain} 
                size="lg" 
                className="rounded-full px-8 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}