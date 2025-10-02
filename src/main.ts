import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import started from 'electron-squirrel-startup'
import { spawn } from 'child_process'
import fs from 'fs'

const getBundledBinaryPath = (binaryName: string): string => {
  if (app.isPackaged) {
    const resourcesPath = process.resourcesPath;
    
    const possiblePaths = [
      path.join(resourcesPath, 'bin', binaryName),
      path.join(resourcesPath, 'app.asar.unpacked', 'bin', binaryName),
      path.join(__dirname, '..', 'bin', binaryName),
    ];

    for (const binaryPath of possiblePaths) {
      if (fs.existsSync(binaryPath)) {
        console.log(`Found ${binaryName} at:`, binaryPath);
        return binaryPath;
      }
    }
    
    throw new Error(`${binaryName} not found in any expected location`);
  } else {
    return binaryName;
  }
};

const getFfmpegPath = (): string => {
  if (app.isPackaged) {
    // In packaged app - ffmpeg is in the unpacked resources
    const ffmpegPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    
    if (fs.existsSync(ffmpegPath)) {
      console.log('Found packaged ffmpeg at:', ffmpegPath);
      return ffmpegPath;
    }
    
    // Fallback: try the extraResources location
    const fallbackPath = path.join(process.resourcesPath, 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (fs.existsSync(fallbackPath)) {
      console.log('Found ffmpeg in extraResources at:', fallbackPath);
      return fallbackPath;
    }
    
    throw new Error(`FFmpeg not found. Checked: ${ffmpegPath} and ${fallbackPath}`);
  } else {
    // In development
    const ffmpegStatic = require('ffmpeg-static');
    console.log('Development ffmpeg path:', ffmpegStatic);
    return ffmpegStatic as string;
  }
};

const ffmpegPath = getFfmpegPath();
console.log('Using ffmpeg path:', ffmpegPath);

// const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')


declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

if (started) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  channel: string
  formats: VideoFormat[]
}

interface VideoFormat {
  quality: string
  format_id: string
  ext: string
  filesize?: number
}

interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const setupIpcHandlers = () => {
  ipcMain.handle('get-video-info', async (_event, url: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Fetching video info for URL:', url)
        
        // Validate URL
        if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
          reject(new Error('Please enter a valid YouTube URL'))
          return
        }

        // Use bundled yt-dlp in production, system yt-dlp in development
        const ytdlpPath = app.isPackaged ? getBundledBinaryPath('yt-dlp.exe') : 'yt-dlp';
        console.log('Using yt-dlp path:', ytdlpPath);

        const ytdlp = spawn(ytdlpPath, [
          '--dump-json',
          '--no-warnings',
          '--no-check-certificate',
          url
        ])

        let stdout = ''
        let stderr = ''

        ytdlp.stdout.on('data', (data) => {
          const chunk = data.toString()
          stdout += chunk
          console.log('yt-dlp stdout chunk:', chunk.trim())
        })

        ytdlp.stderr.on('data', (data) => {
          const chunk = data.toString()
          stderr += chunk
          console.log('yt-dlp stderr chunk:', chunk.trim())
        })

        ytdlp.on('close', (code) => {
          console.log('yt-dlp process closed with code:', code)
          console.log('Full stderr:', stderr)

          if (code === 0) {
            try {
              const info = JSON.parse(stdout)
              console.log('Successfully parsed video info')

              const formats: VideoFormat[] = []
              const seenQualities = new Set<string>()

              if (info.formats && Array.isArray(info.formats)) {
                for (const format of info.formats) {
                  if (format.height && (format.vcodec !== 'none' || format.acodec !== 'none')) {
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

              if (formats.length === 0 && info.formats) {
                for (const format of info.formats) {
                  if (format.format_note || format.quality) {
                    const quality = format.format_note || format.quality || 'Unknown'
                    formats.push({
                      quality,
                      format_id: format.format_id,
                      ext: format.ext || 'mp4',
                      filesize: format.filesize,
                    })
                  }
                }
              }

              formats.sort((a, b) => {
                const aHeight = parseInt(a.quality) || 0
                const bHeight = parseInt(b.quality) || 0
                return bHeight - aHeight
              })

              const videoInfo: VideoInfo = {
                title: info.title || 'Unknown Title',
                thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
                duration: formatDuration(info.duration || 0),
                channel: info.uploader || info.channel || 'Unknown Channel',
                formats: formats.slice(0, 6),
              }

              console.log('Final video info:', videoInfo)
              resolve(videoInfo)
            } catch (parseError) {
              console.error('JSON parse error:', parseError)
              reject(new Error(`Failed to parse video information. The video might be unavailable or restricted.`))
            }
          } else {
            let errorMessage = 'Failed to fetch video information'
            if (stderr.includes('Private video')) {
              errorMessage = 'This video is private and cannot be downloaded'
            } else if (stderr.includes('Unavailable')) {
              errorMessage = 'This video is unavailable'
            } else if (stderr.includes('Sign in')) {
              errorMessage = 'This video requires sign-in or is age-restricted'
            } else if (stderr.includes('not found') || stderr.includes('ENOENT')) {
              errorMessage = 'YouTube downloader not available. Please reinstall the application.'
            } else if (stderr) {
              const firstLine = stderr.split('\n')[0]
              if (firstLine && firstLine.trim()) {
                errorMessage = firstLine.trim()
              }
            }
            reject(new Error(errorMessage))
          }
        })

        ytdlp.on('error', (error) => {
          console.error('yt-dlp spawn error:', error)
          if (error.message.includes('ENOENT')) {
            reject(new Error('YouTube downloader not found. Please make sure the application is properly installed.'))
          } else {
            reject(new Error(`YouTube downloader error: ${error.message}`))
          }
        })

        const timeout = setTimeout(() => {
          ytdlp.kill()
          reject(new Error('Request timeout. The video might be too large or the server is taking too long to respond.'))
        }, 30000)

        ytdlp.on('close', () => {
          clearTimeout(timeout)
        })

      } catch (error) {
        console.error('Unexpected error in get-video-info:', error)
        reject(new Error('An unexpected error occurred while fetching video information'))
      }
    })
  })

  ipcMain.handle('download-video', async (_event, url: string, quality: string, outputPath: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting download for URL:', url, 'Quality:', quality)
        console.log('Using bundled ffmpeg at:', ffmpegPath)

        // Use bundled yt-dlp
        const ytdlpPath = app.isPackaged ? getBundledBinaryPath('yt-dlp.exe') : 'yt-dlp';
        
        // Get video info first
        const infoResult = await new Promise<any>((infoResolve, infoReject) => {
          const ytdlp = spawn(ytdlpPath, [
            '--dump-json',
            '--no-warnings',
            url
          ])

          let stdout = ''
          let stderr = ''

          ytdlp.stdout.on('data', (data) => {
            stdout += data.toString()
          })

          ytdlp.stderr.on('data', (data) => {
            stderr += data.toString()
          })

          ytdlp.on('close', (code) => {
            if (code === 0) {
              try {
                infoResolve(JSON.parse(stdout))
              } catch (error) {
                infoReject(new Error('Failed to parse video info'))
              }
            } else {
              infoReject(new Error(stderr || 'Failed to fetch video information'))
            }
          })
        })

        const videoTitle = infoResult.title.replace(/[^a-zA-Z0-9\s\-_]/g, '_').replace(/\s+/g, '_')
        const outputTemplate = path.join(outputPath, `${videoTitle}.mp4`)

        console.log('Output template:', outputTemplate)
        
        let format = ''
        if (quality === 'Audio Only') {
          format = 'bestaudio[ext=m4a]/bestaudio/best'
        } else {
          const height = quality.replace('p', '')
          format = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`
        }

        const ytdlpArgs = [
          '-f', format,
          '--merge-output-format', 'mp4',
          '-o', outputTemplate,
          '--ffmpeg-location', path.dirname(ffmpegPath),
          '--newline',
          '--progress',
          '--no-mtime',
          url
        ]

        console.log('yt-dlp command:', ytdlpPath, ytdlpArgs.join(' '))

        const ytdlp = spawn(ytdlpPath, ytdlpArgs)

        let lastProgress = {
          percent: 0,
          downloaded: 0,
          total: 0,
          speed: 0,
          eta: 0
        }

        ytdlp.stdout.on('data', (data) => {
          const output = data.toString()
          console.log('yt-dlp output:', output.trim())

          const progress = parseProgress(output)
          if (progress) {
            lastProgress = { ...lastProgress, ...progress }
            console.log('Progress:', lastProgress)
            
            if (mainWindow) {
              mainWindow.webContents.send('download-progress', { ...lastProgress })
            }
          }
        })

        ytdlp.stderr.on('data', (data) => {
          console.log('yt-dlp stderr:', data.toString().trim())
        })

        ytdlp.on('close', (code) => {
          console.log('yt-dlp process closed with code:', code)
          if (code === 0) {
            console.log('Download completed successfully')
            if (mainWindow) {
              mainWindow.webContents.send('download-progress', {
                percent: 100,
                downloaded: lastProgress.total || 1,
                total: lastProgress.total || 1,
                speed: 0,
                eta: 0
              })
            }
            setTimeout(() => resolve(undefined), 1000)
          } else {
            reject(new Error(`Download failed with code ${code}`))
          }
        })

        ytdlp.on('error', (error) => {
          console.error('yt-dlp error:', error)
          reject(new Error(`YouTube downloader not found: ${error.message}`))
        })

      } catch (error) {
        console.error('Download setup error:', error)
        reject(error)
      }
    })
  })
  ipcMain.handle('select-download-path', async () => {
    if (!mainWindow) return null

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Download Folder',
        properties: ['openDirectory'],
        defaultPath: app.getPath('downloads'),
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    } catch (error) {
      console.error('Error selecting download path:', error)
      return null
    }
  })

  ipcMain.handle('cancel-download', async () => {
    // This would need to track the active download process
    // For now, we'll just return true
    return true
  })
}

// Improved progress parsing function
const parseProgress = (line: string): Partial<DownloadProgress> | null => {
  console.log('Parsing line:', line.trim())
  
  // Match progress like: [download]  62.7% of ~ 201.84MiB at 3.47MiB/s ETA 00:31
  const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*)([KMG]?iB)?.*?at\s+(\d+\.?\d*)([KMG]?iB)?\/s.*?ETA\s+(\d+):(\d+)/)
  
  if (progressMatch) {
    const percent = parseFloat(progressMatch[1])
    const totalSize = parseFloat(progressMatch[2])
    const totalUnit = progressMatch[3] || 'B'
    const speed = parseFloat(progressMatch[4])
    const speedUnit = progressMatch[5] || 'B'
    const etaMinutes = parseInt(progressMatch[6])
    const etaSeconds = parseInt(progressMatch[7])

    const unitMultiplier: { [key: string]: number } = {
      'B': 1,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024
    }

    const totalBytes = totalSize * (unitMultiplier[totalUnit] || 1)
    const downloadedBytes = (percent / 100) * totalBytes
    const speedBytes = speed * (unitMultiplier[speedUnit] || 1)
    const eta = etaMinutes * 60 + etaSeconds

    const progress = {
      percent,
      downloaded: downloadedBytes,
      total: totalBytes,
      speed: speedBytes,
      eta
    }
    
    console.log('Successfully parsed progress:', progress)
    return progress
  }

  // Match simpler format: [download] 12.5% of 45.21MiB
  const simpleMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*)([KMG]?iB)/)
  if (simpleMatch) {
    const percent = parseFloat(simpleMatch[1])
    const totalSize = parseFloat(simpleMatch[2])
    const totalUnit = simpleMatch[3] || 'B'

    const unitMultiplier: { [key: string]: number } = {
      'B': 1,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024
    }

    const totalBytes = totalSize * (unitMultiplier[totalUnit] || 1)
    const downloadedBytes = (percent / 100) * totalBytes

    const progress = {
      percent,
      downloaded: downloadedBytes,
      total: totalBytes
    }
    
    console.log('Successfully parsed simple progress:', progress)
    return progress
  }

  // Also try to match simpler percentage-only progress
  const simplePercentMatch = line.match(/\[download\]\s+(\d+\.?\d*)%/)
  if (simplePercentMatch) {
    const percent = parseFloat(simplePercentMatch[1])
    console.log('Found simple percentage:', percent)
    return { percent }
  }

  console.log('No progress match found')
  return null
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // titleBarStyle: 'default',
    // show: false,


      frame: false,
    titleBarStyle: 'hidden',
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    // Add rounded corners (Windows 11 style)
    roundedCorners: true,
    icon: getAppIcon(),
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  setupIpcHandlers()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

export { mainWindow }


const getAppIcon = (): string => {
  if (app.isPackaged) {
    const resourcesPath = process.resourcesPath;
    
    const possiblePaths = [
      path.join(resourcesPath, 'favicon.svg'),
      path.join(resourcesPath, 'public', 'favicon.svg'), 
      path.join(__dirname, '..', 'public', 'favicon.svg'),
      path.join(__dirname, 'public', 'favicon.svg'),
    ];

    for (const iconPath of possiblePaths) {
      if (fs.existsSync(iconPath)) {
        console.log('Found app icon at:', iconPath);
        return iconPath;
      }
    }
    
    console.warn('App icon not found in packaged app, using default');
    return ''; 
  } else {
    const devPaths = [
      path.join(__dirname, '..', 'public', 'favicon.ico'),
      path.join(__dirname, '..', '..', 'public', 'favicon.ico'),
      path.join(process.cwd(), 'public', 'favicon.ico'),
    ];

    for (const iconPath of devPaths) {
      if (fs.existsSync(iconPath)) {
        console.log('Found development app icon at:', iconPath);
        return iconPath;
      }
    }
    
    console.warn('Development app icon not found, using default');
    return ''; 
  }
};