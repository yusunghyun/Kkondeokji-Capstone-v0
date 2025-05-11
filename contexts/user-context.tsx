"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserInterests {
  streaming: string[]
  fitness: string[]
  books: string[]
  hometown: string
}

interface UserContextType {
  userInterests: UserInterests
  updateInterests: (category: keyof UserInterests, value: any) => void
  resetInterests: () => void
}

const defaultInterests: UserInterests = {
  streaming: [],
  fitness: [],
  books: [],
  hometown: "",
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInterests, setUserInterests] = useState<UserInterests>(defaultInterests)

  useEffect(() => {
    // Load interests from localStorage on mount
    const savedInterests = localStorage.getItem("userInterests")
    if (savedInterests) {
      try {
        setUserInterests(JSON.parse(savedInterests))
      } catch (error) {
        console.error("Failed to parse user interests:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Save interests to localStorage whenever they change
    localStorage.setItem("userInterests", JSON.stringify(userInterests))
  }, [userInterests])

  const updateInterests = (category: keyof UserInterests, value: any) => {
    setUserInterests((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const resetInterests = () => {
    setUserInterests(defaultInterests)
    localStorage.removeItem("userInterests")
  }

  return (
    <UserContext.Provider value={{ userInterests, updateInterests, resetInterests }}>{children}</UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
