"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit } from "lucide-react"
import QRCodeGenerator from "@/components/profile/qr-code-generator"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { InterestTab } from "@/components/profile/interest-tab"
import { MatchesTab } from "@/components/profile/matches-tab"
import { useUser } from "@/contexts/user-context"
import { mockUserProfile } from "@/constants/mock-data"

export default function ProfilePage() {
  const { userInterests } = useUser()
  const [showQR, setShowQR] = useState(false)

  const handleCopyLink = () => {
    // In a real app, this would generate a shareable link
    navigator.clipboard.writeText("https://kkondeokji.app/profile/user123")
    // Show toast notification
  }

  const rightElement = (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/profile/edit">
        <Edit className="h-5 w-5 text-gray-600" />
      </Link>
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader title="Your Profile" rightElement={rightElement} />

      <ProfileHeader
        name={mockUserProfile.name}
        joinDate={mockUserProfile.joinDate}
        onShowQR={() => setShowQR(true)}
        onCopyLink={handleCopyLink}
      />

      <Tabs defaultValue="interests" className="flex-1">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="interests">
          <InterestTab interests={userInterests} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesTab onShowQR={() => setShowQR(true)} />
        </TabsContent>
      </Tabs>

      {showQR && <QRCodeGenerator onClose={() => setShowQR(false)} />}
    </PageContainer>
  )
}
