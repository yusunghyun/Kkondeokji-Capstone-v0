"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Download, Share2 } from "lucide-react"

interface QRCodeGeneratorProps {
  onClose: () => void
}

export default function QRCodeGenerator({ onClose }: QRCodeGeneratorProps) {
  // In a real app, this would generate an actual QR code
  // For this demo, we'll use a placeholder

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm p-6 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Your Profile QR Code</h2>
          <p className="text-sm text-gray-600">Scan this code to connect instantly</p>

          <div className="bg-white p-4 rounded-lg mx-auto w-48 h-48 flex items-center justify-center border">
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-4xl">QR</span>
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline" className="rounded-full">
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
