import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"

export async function generateSurveyWithGrok(userInfo: {
  name?: string
  age?: number
  occupation?: string
  otherUserId?: string
}) {
  const prompt = createSurveyPrompt(userInfo)

  try {
    const { text } = await generateText({
      model: xai("grok-1"),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return parseSurveyResponse(text)
  } catch (error) {
    console.error("Error generating survey with Grok:", error)
    throw new Error("Failed to generate survey")
  }
}

export async function generateMatchInsights(matchData: {
  user1: { name?: string; age?: number; occupation?: string }
  user2: { name?: string; age?: number; occupation?: string }
  matchScore: number
  commonInterests: {
    tags: string[]
    responses: Array<{ question: string; answer: string }>
  }
}) {
  const prompt = createMatchInsightsPrompt(matchData)

  try {
    const { text } = await generateText({
      model: xai("grok-1"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating match insights with Grok:", error)
    throw new Error("Failed to generate match insights")
  }
}

function createSurveyPrompt(userInfo: {
  name?: string
  age?: number
  occupation?: string
  otherUserId?: string
}) {
  const isMatching = !!userInfo.otherUserId

  let prompt = `Create a personalized survey for a social matching app called "Kkondeokji" (which means "common ground" in Korean).`

  if (userInfo.name || userInfo.age || userInfo.occupation) {
    prompt += ` The user is`
    if (userInfo.name) prompt += ` named ${userInfo.name},`
    if (userInfo.age) prompt += ` ${userInfo.age} years old,`
    if (userInfo.occupation) prompt += ` working as a ${userInfo.occupation},`
    prompt = prompt.replace(/,$/, ".")
  }

  if (isMatching) {
    prompt += ` This survey is specifically designed to find common interests with another user (ID: ${userInfo.otherUserId}).`
  }

  prompt += `
  
Create 10 questions that would help identify the user's interests and personality. Each question should have 5 options.

The survey should cover various topics like:
- Music preferences
- Travel interests
- Sports/fitness activities
- Entertainment (movies, books, etc.)
- Food preferences
- Academic/professional interests
- Hobbies
- Social activities
- Technology interests
- Personal values

Format your response as a JSON object with the following structure:
{
  "title": "Survey title",
  "description": "Brief description of the survey",
  "questions": [
    {
      "text": "Question text",
      "weight": number between 1-3 (importance for matching),
      "options": [
        {
          "text": "Option text",
          "value": "INTEREST_TAG",
          "icon": "emoji"
        },
        ...more options
      ]
    },
    ...more questions
  ]
}

Make sure each question has exactly 5 options, and each option has a text, value (as a tag in ALL_CAPS), and an appropriate emoji icon.`

  return prompt
}

function createMatchInsightsPrompt(matchData: {
  user1: { name?: string; age?: number; occupation?: string }
  user2: { name?: string; age?: number; occupation?: string }
  matchScore: number
  commonInterests: {
    tags: string[]
    responses: Array<{ question: string; answer: string }>
  }
}) {
  const { user1, user2, matchScore, commonInterests } = matchData

  let prompt = `Generate insightful and friendly analysis for a match between two users on a social matching app called "Kkondeokji" (which means "common ground" in Korean).

User 1:`
  if (user1.name) prompt += `\nName: ${user1.name}`
  if (user1.age) prompt += `\nAge: ${user1.age}`
  if (user1.occupation) prompt += `\nOccupation: ${user1.occupation}`

  prompt += `\n\nUser 2:`
  if (user2.name) prompt += `\nName: ${user2.name}`
  if (user2.age) prompt += `\nAge: ${user2.age}`
  if (user2.occupation) prompt += `\nOccupation: ${user2.occupation}`

  prompt += `\n\nMatch Score: ${matchScore}%\n\n`

  prompt += `Common Interests:\n`
  if (commonInterests.tags.length > 0) {
    prompt += `Tags: ${commonInterests.tags.join(", ")}\n\n`
  }

  prompt += `Common Responses:\n`
  commonInterests.responses.forEach(({ question, answer }) => {
    prompt += `- Question: "${question}"\n  Answer: "${answer}"\n`
  })

  prompt += `\nBased on this information, provide:
1. A friendly interpretation of their match score
2. 2-3 conversation starters based on their common interests
3. Suggestions for activities they might enjoy together
4. A brief note on what makes this match interesting

Keep the tone friendly, positive, and encouraging. The analysis should be 3-4 paragraphs total.`

  return prompt
}

function parseSurveyResponse(text: string): {
  title: string
  description: string
  questions: Array<{
    text: string
    weight: number
    options: Array<{
      text: string
      value: string
      icon: string
    }>
  }>
} {
  try {
    // Find JSON object in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const jsonStr = jsonMatch[0]
    const survey = JSON.parse(jsonStr)

    // Validate the structure
    if (!survey.title || !survey.description || !Array.isArray(survey.questions)) {
      throw new Error("Invalid survey structure")
    }

    // Validate each question
    survey.questions.forEach((q: any, i: number) => {
      if (!q.text || typeof q.weight !== "number" || !Array.isArray(q.options)) {
        throw new Error(`Invalid question at index ${i}`)
      }

      if (q.options.length !== 5) {
        throw new Error(`Question at index ${i} does not have exactly 5 options`)
      }

      q.options.forEach((o: any, j: number) => {
        if (!o.text || !o.value || !o.icon) {
          throw new Error(`Invalid option at index ${j} for question ${i}`)
        }
      })
    })

    return survey
  } catch (error) {
    console.error("Error parsing survey response:", error)
    throw new Error("Failed to parse survey response")
  }
}
