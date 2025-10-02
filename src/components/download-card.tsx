import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Download, Link2, Loader2 } from "lucide-react"

export function DownloaderCard() {
  const [url, setUrl] = useState("")
  const [quality, setQuality] = useState("1080p")
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!url) return

    setIsDownloading(true)
    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDownloading(false)
    setUrl("")
  }

  return (
    <Card className="border-0 shadow-xl shadow-primary/5 backdrop-blur-sm">
      <CardContent className="p-8 space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Video URL
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="url"
              type="url"
              placeholder="Paste YouTube video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-12 text-base bg-background/50"
            />
          </div>
        </div>

        {/* Quality Selection */}
        <div className="space-y-2">
          <label htmlFor="quality" className="text-sm font-medium">
            Video Quality
          </label>
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger id="quality" className="h-12 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2160p">4K (2160p)</SelectItem>
              <SelectItem value="1440p">2K (1440p)</SelectItem>
              <SelectItem value="1080p">Full HD (1080p)</SelectItem>
              <SelectItem value="720p">HD (720p)</SelectItem>
              <SelectItem value="480p">SD (480p)</SelectItem>
              <SelectItem value="360p">Low (360p)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={!url || isDownloading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download Video
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          Supports YouTube videos and playlists. Downloads are saved to your default folder.
        </p>
      </CardContent>
    </Card>
  )
}
