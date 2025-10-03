import { contextBridge, ipcRenderer } from 'electron'

interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  channel: string
  formats: Array<{
    quality: string
    format_id: string
    ext: string
    filesize?: number
  }>
}

interface PlaylistInfo {
  title: string
  thumbnail: string
  channel: string
  videoCount: number
  videos: Array<{
    id: string
    title: string
    duration: string
    thumbnail: string
    channel: string
  }>
}

interface PlaylistDownloadProgress {
  currentVideo: number
  totalVideos: number
  videoTitle: string
  overallPercent: number
  videoPercent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<VideoInfo>
  downloadVideo: (url: string, quality: string, outputPath: string) => Promise<void>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  selectDownloadPath: () => Promise<string | null>
  cancelDownload: () => Promise<boolean>
  getPlaylistInfo: (url: string) => Promise<PlaylistInfo>
  downloadPlaylist: (url: string, quality: string, outputPath: string) => Promise<void>
  onPlaylistDownloadProgress: (callback: (progress: PlaylistDownloadProgress) => void) => () => void
}

const electronAPI: ElectronAPI = {
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  downloadVideo: (url: string, quality: string, outputPath: string) =>
    ipcRenderer.invoke('download-video', url, quality, outputPath),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const progressHandler = (_event: any, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download-progress', progressHandler)
    
    return () => {
      ipcRenderer.removeListener('download-progress', progressHandler)
    }
  },
  selectDownloadPath: () => ipcRenderer.invoke('select-download-path'),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  getPlaylistInfo: (url: string) => ipcRenderer.invoke('get-playlist-info', url),
  downloadPlaylist: (url: string, quality: string, outputPath: string) => 
    ipcRenderer.invoke('download-playlist', url, quality, outputPath),
  onPlaylistDownloadProgress: (callback: (progress: PlaylistDownloadProgress) => void) => {
    const progressHandler = (_event: any, progress: PlaylistDownloadProgress) => callback(progress)
    ipcRenderer.on('playlist-download-progress', progressHandler)
    
    return () => {
      ipcRenderer.removeListener('playlist-download-progress', progressHandler)
    }
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)