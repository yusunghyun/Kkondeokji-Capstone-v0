"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Book, Plus } from "lucide-react"
import { InterestBadge } from "@/components/ui/interest-badge"
import { QuestionLayout } from "@/components/onboarding/question-layout"
import { mockBookOptions } from "@/constants/mock-data"

interface BooksQuestionProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function OnboardingBooksQuestion({ value, onChange }: BooksQuestionProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAddBook = (book: string) => {
    if (!value.includes(book) && book.trim() !== "") {
      onChange([...value, book])
      setInputValue("")
    }
  }

  const handleRemoveBook = (book: string) => {
    onChange(value.filter((b) => b !== book))
  }

  const handleToggleBook = (book: string) => {
    if (value.includes(book)) {
      handleRemoveBook(book)
    } else {
      handleAddBook(book)
    }
  }

  return (
    <QuestionLayout title="What did you read recently?" description="Share books or articles you've enjoyed">
      <div className="relative">
        <Book className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a book or article..."
          className="pl-10 pr-10 py-6 rounded-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddBook(inputValue)
            }
          }}
        />
        {inputValue && (
          <button onClick={() => handleAddBook(inputValue)} className="absolute right-3 top-3">
            <Plus className="h-4 w-4 text-purple-500" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-500">Popular reads</p>
        <div className="flex flex-wrap gap-2">
          {mockBookOptions.map((book) => (
            <InterestBadge
              key={book}
              label={book}
              variant="secondary"
              selected={value.includes(book)}
              onClick={() => handleToggleBook(book)}
            />
          ))}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Your selections</p>
          <div className="flex flex-wrap gap-2">
            {value.map((book) => (
              <InterestBadge
                key={book}
                label={book}
                variant="secondary"
                selected
                onRemove={() => handleRemoveBook(book)}
              />
            ))}
          </div>
        </div>
      )}
    </QuestionLayout>
  )
}
