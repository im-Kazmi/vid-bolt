import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Download, Sparkles, CheckCircle2, AlertCircle, ListVideo } from "lucide-react"
import { 
  getVideoInfo, 
  downloadVideo, 
  onDownloadProgress, 
  selectDownloadPath,
  getPlaylistInfo,
  downloadPlaylist,
  onPlaylistDownloadProgress,
} from "../lib/electron-api"
import type { VideoInfo, DownloadProgress, PlaylistInfo, PlaylistDownloadProgress, PlaylistVideo } from "@/electron.types"
import { UrlInput } from "../components/url-input"
import { PlaylistPreview } from "../components/playlist-preview"
import { PlaylistDownloadProgress as PlaylistProgress } from "../components/playlist-download-progress"

type AppState = "welcome" | "input" | "video-preview" | "playlist-preview" | "downloading" | "playlist-downloading" | "complete" | "error"
type DownloadType = "video" | "playlist"

export function Home() {
  const [appState, setAppState] = useState<AppState>("welcome")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoData, setVideoData] = useState<VideoInfo | null>(null)
  const [playlistData, setPlaylistData] = useState<PlaylistInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [playlistProgress, setPlaylistProgress] = useState<PlaylistDownloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [downloadType, setDownloadType] = useState<DownloadType>("video")

  const handleGetStarted = () => {
    setAppState("input")
  }

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setIsLoading(true)
    setErrorMessage("")

    try {
      if (videoUrl.includes('playlist') || videoUrl.includes('list=')) {
        setDownloadType("playlist")
        const playlistInfo = await getPlaylistInfo(videoUrl)
        setPlaylistData(playlistInfo)
        setAppState("playlist-preview")
      } else {
        setDownloadType("video")
        const videoInfo = await getVideoInfo(videoUrl)
        setVideoData(videoInfo)
        setAppState("video-preview")
      }
    } catch (error) {
      setErrorMessage("Failed to fetch information. Please check the URL and try again.")
      setAppState("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadVideo = async (quality: string) => {
    try {
      const outputPath = await selectDownloadPath()
      if (!outputPath) return

      setAppState("downloading")
      setDownloadProgress({ percent: 0, downloaded: 0, total: 0, speed: 0, eta: 0 })

      await downloadVideo(videoUrl, quality, outputPath)
      
    } catch (error) {
      setErrorMessage("Download failed. Please try again.")
      setAppState("error")
    }
  }

  const handleDownloadPlaylist = async (quality: string, videos?: PlaylistVideo[]) => {
    try {
      const outputPath = await selectDownloadPath()
      if (!outputPath) return

      setAppState("playlist-downloading")
      
      if (videos) {
        const videoUrls = videos.map(v => `https://youtube.com/watch?v=${v.id}`)
        for (const url of videoUrls) {
          await downloadVideo(url, quality, outputPath)
        }
      } else {
        await downloadPlaylist(videoUrl, quality, outputPath)
      }
      
    } catch (error) {
      setErrorMessage("Playlist download failed. Please try again.")
      setAppState("error")
    }
  }

  const handleBack = () => {
    setAppState("input")
    setVideoData(null)
    setPlaylistData(null)
    setDownloadProgress(null)
    setPlaylistProgress(null)
    setErrorMessage("")
  }

  const handleNewDownload = () => {
    setAppState("input")
    setVideoUrl("")
    setVideoData(null)
    setPlaylistData(null)
    setDownloadProgress(null)
    setPlaylistProgress(null)
    setErrorMessage("")
  }

  const handleTryAgain = () => {
    setAppState("input")
    setErrorMessage("")
    setVideoUrl("")
  }

  useEffect(() => {
    const removeProgressListener = onDownloadProgress((progress) => {
      setDownloadProgress(progress)
      
      if (progress.percent >= 99.9) {
        setTimeout(() => {
          setAppState("complete")
        }, 1500)
      }
    })

    const removePlaylistProgressListener = onPlaylistDownloadProgress((progress) => {
      setPlaylistProgress(progress)
      
      if (progress.overallPercent >= 99.9) {
        setTimeout(() => {
          setAppState("complete")
        }, 1500)
      }
    })

    return () => {
      removeProgressListener()
      removePlaylistProgressListener()
    }
  }, [])

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {appState === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-8 w-full max-w-2xl"
          >
            {/* Welcome content remains the same */}
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
              Lightning-fast YouTube video & playlist downloads with stunning quality
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
          <UrlInput
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            isLoading={isLoading}
            onSubmit={handleSubmitUrl}
            onBack={() => setAppState("welcome")}
            title="Download Video or Playlist"
            description="Paste any YouTube video or playlist link below"
          />
        )}

        {appState === "playlist-preview" && playlistData && (
          <PlaylistPreview
            playlistInfo={playlistData}
            onBack={handleBack}
            onDownloadAll={handleDownloadPlaylist}
            onDownloadSelected={handleDownloadPlaylist}
          />
        )}

        {appState === "playlist-downloading" && playlistProgress && (
          <PlaylistProgress progress={playlistProgress} />
        )}

        {appState === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8 w-full max-w-md"
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
                {downloadType === 'playlist' ? 'Playlist downloaded successfully' : 'Video downloaded successfully'}
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
                Download Another
              </Button>
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
            className="text-center space-y-8 w-full max-w-md"
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