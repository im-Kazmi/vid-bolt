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

export interface PlaylistInfo {
  title: string
  thumbnail: string
  channel: string
  videoCount: number
  videos: PlaylistVideo[]
}

export interface PlaylistVideo {
  id: string
  title: string
  duration: string
  thumbnail: string
  channel: string
}

export interface PlaylistDownloadProgress {
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