export interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<any>
  downloadVideo: (url: string, quality: string, outputPath: string) => Promise<void>
  onDownloadProgress: (callback: (progress: any) => void) => () => void
  selectDownloadPath: () => Promise<string | null>
  cancelDownload: () => Promise<boolean>
  getPlaylistInfo: (url: string) => Promise<any>
  downloadPlaylist: (url: string, quality: string, outputPath: string) => Promise<void>
  onPlaylistDownloadProgress: (callback: (progress: any) => void) => () => void
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}