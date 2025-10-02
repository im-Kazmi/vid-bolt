import { ipcMain, dialog, BrowserWindow } from 'electron'
import youtubedl from 'youtube-dl-exec'
import ffmpegPath from 'ffmpeg-static'
import path from 'path'
import { app } from 'electron'
import { VideoFormat, VideoInfo } from '@/electron.types'

export const setupIpcHandlers = (mainWindow: BrowserWindow) => {
  ipcMain.handle('get-video-info', async (_event, url: string) => {
    try {
      const info:any = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      })

      const formats: VideoFormat[] = []
      const seenQualities = new Set<string>()

      if (info.formats && Array.isArray(info.formats)) {
        for (const format of info.formats) {
          if (format.height && format.vcodec !== 'none' && format.acodec !== 'none') {
            const quality = `${format.height}p`
            if (!seenQualities.has(quality)) {
              formats.push({
                quality,
                format_id: format.format_id,
                ext: format.ext || 'mp4',
                filesize: format.filesize,
              })
              seenQualities.add(quality)
            }
          }
        }
      }

      formats.sort((a, b) => {
        const aHeight = parseInt(a.quality)
        const bHeight = parseInt(b.quality)
        return bHeight - aHeight
      })

      if (!formats.some(f => f.quality === 'audio')) {
        formats.push({
          quality: 'Audio Only',
          format_id: 'bestaudio',
          ext: 'mp3',
        })
      }

      const videoInfo: VideoInfo = {
        title: info.title || 'Unknown Title',
        thumbnail: info.thumbnail || '',
        duration: formatDuration(info.duration || 0),
        channel: info.uploader || info.channel || 'Unknown Channel',
        formats,
      }

      return videoInfo
    } catch (error) {
      console.error('Error fetching video info:', error)
      throw new Error('Failed to fetch video information')
    }
  })

  ipcMain.handle('download-video', async (_event, url: string, quality: string, outputPath: string) => {
    try {
      const options: any = {
        output: outputPath,
        ffmpegLocation: ffmpegPath,
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      }

      if (quality === 'Audio Only') {
        options.extractAudio = true
        options.audioFormat = 'mp3'
        options.audioQuality = 0
      } else {
        const height = quality.replace('p', '')
        options.format = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`
        options.mergeOutputFormat = 'mp4'
      }

      const process = youtubedl.exec(url, options)

      process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        const downloadMatch = output.match(/(\d+\.?\d*)%/)
        
        if (downloadMatch) {
          const percent = parseFloat(downloadMatch[1])
          mainWindow.webContents.send('download-progress', {
            percent,
            downloaded: 0,
            total: 0,
            speed: 0,
            eta: 0,
          })
        }
      })

      await process

      return { success: true }
    } catch (error) {
      console.error('Download error:', error)
      throw new Error('Failed to download video')
    }
  })

  ipcMain.handle('select-download-path', async () => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Video',
        defaultPath: path.join(app.getPath('downloads'), 'video.mp4'),
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'mkv', 'webm'] },
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      return result.filePath
    } catch (error) {
      console.error('Error selecting download path:', error)
      return null
    }
  })
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}