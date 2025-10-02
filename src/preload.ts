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

interface ElectronAPI {
  // cancelDownload: () => any | void,
  getVideoInfo: (url: string) => Promise<VideoInfo>
  downloadVideo: (url: string, quality: string, outputPath: string) => Promise<void>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  selectDownloadPath: () => Promise<string | null>,
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
  // cancelDownload: (url) => ipcRenderer.invoke('cancel-download', url),
  selectDownloadPath: () => ipcRenderer.invoke('select-download-path'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)