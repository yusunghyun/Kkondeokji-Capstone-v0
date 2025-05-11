"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Copy, QrCode, Share2 } from "lucide-react"

interface ProfileHeaderProps {
  name: string
  joinDate: string
  onShowQR: () => void
  onCopyLink: () => void
}

export function ProfileHeader({ name, joinDate, onShowQR, onCopyLink }: ProfileHeaderProps) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-24 relative">
        <div className="absolute -bottom-10 left-4">
          <Avatar className="h-20 w-20 border-4 border-white">
            <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile" />
            <AvatarFallback className="bg-pink-200 text-pink-800 text-xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CardContent className="pt-12 pb-6">
        <h2 className="text-xl font-bold">{name}</h2>
        <p className="text-gray-500 text-sm">Joined {joinDate}</p>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={onCopyLink}>
            <Copy className="h-3 w-3 mr-1" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={onShowQR}>
            <QrCode className="h-3 w-3 mr-1" />
            QR Code
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
