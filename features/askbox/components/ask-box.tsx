"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/shared/ui/bottom-sheet"
import { Send } from "lucide-react"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface AskBoxProps {
  userId: string
  onClose: () => void
}

export function AskBox({ userId, onClose }: AskBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")

    // In a real app, this would send the message to the other user
    // For now, we'll just simulate a response
    setTimeout(() => {
      const responseMessage: Message = {
        id: `response-${Date.now()}`,
        text: "이 기능은 아직 개발 중입니다. 곧 사용하실 수 있습니다!",
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, responseMessage])
    }, 1000)
  }

  return (
    <BottomSheet open={true} onOpenChange={onClose}>
      <BottomSheetContent className="h-[80vh]">
        <BottomSheetHeader>
          <BottomSheetTitle>질문하기</BottomSheetTitle>
        </BottomSheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>질문을 입력해보세요!</p>
                <p className="text-sm mt-2">익명으로 전송됩니다</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.isUser ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 pb-2">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                className="bg-primary-500 hover:bg-primary-600 self-end"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
