import { DownloadProgress, VideoInfo, PlaylistInfo, PlaylistDownloadProgress } from "@/electron.types"

export const getVideoInfo = async (url: string): Promise<VideoInfo> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.getVideoInfo(url)
}

export const downloadVideo = async (
  url: string,
  quality: string,
  outputPath: string
): Promise<void> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.downloadVideo(url, quality, outputPath)
}

export const onDownloadProgress = (callback: (progress: DownloadProgress) => void): (() => void) => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.onDownloadProgress(callback)
}

export const selectDownloadPath = async (): Promise<string | null> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.selectDownloadPath()
}

export const cancelDownload = async (): Promise<boolean> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.cancelDownload()
}

export const getPlaylistInfo = async (url: string): Promise<PlaylistInfo> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.getPlaylistInfo(url)
}

export const downloadPlaylist = async (url: string, quality: string, outputPath: string): Promise<void> => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.downloadPlaylist(url, quality, outputPath)
}

export const onPlaylistDownloadProgress = (callback: (progress: PlaylistDownloadProgress) => void): (() => void) => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI.onPlaylistDownloadProgress(callback)
}