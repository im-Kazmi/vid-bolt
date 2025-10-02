export interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  channel: string
  formats: VideoFormat[]
}

export interface VideoFormat {
  quality: string
  format_id: string
  ext: string
  filesize?: number
}

export interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

export interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<VideoInfo>
  downloadVideo: (url: string, quality: string, outputPath: string) => Promise<void>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
  selectDownloadPath: () => Promise<string | null>,
  cancelDownload: (val:any) => any,
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}