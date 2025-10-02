import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { FileVideo, FolderOpen, Trash2 } from "lucide-react"

const mockDownloads = [
  {
    id: 1,
    title: "Amazing Tutorial - Learn React in 2024",
    quality: "1080p",
    size: "245 MB",
    date: "2 minutes ago",
  },
  {
    id: 2,
    title: "Beautiful Nature Documentary",
    quality: "4K",
    size: "1.2 GB",
    date: "1 hour ago",
  },
  {
    id: 3,
    title: "Music Video - Best Hits 2024",
    quality: "720p",
    size: "156 MB",
    date: "3 hours ago",
  },
]

export function DownloadHistory() {
  return (
    <Card className="border-0 shadow-xl shadow-primary/5 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Downloads</CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockDownloads.map((download) => (
          <div
            key={download.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileVideo className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{download.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{download.quality}</span>
                <span>•</span>
                <span>{download.size}</span>
                <span>•</span>
                <span>{download.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <FolderOpen className="h-4 w-4" />
                <span className="sr-only">Open folder</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
