// replyService.ts

import Swal from "sweetalert2"
import { Storage } from "@plasmohq/storage"
import { isPostInConversation, getThreadAndRepliesContext } from "../conversationUtils"

// The storage instance
const storage = new Storage()

interface Post {
  id: string
  text: string
  author: string
  replies?: string[]
}

/**
 * Generates a reply by calling the external API.
 */
export async function generateReply(post: Post, postElement: Element, primingText?: string) {
  try {
    const apiKey = await storage.get("openRouterApiKey")
    const selectedModel = await storage.get("selectedModel")

    if (!apiKey) {
      Swal.fire({
        icon: "warning",
        title: "API Key Required",
        text: "Please set your OpenRouter API key in the extension settings."
      })
      return null
    }

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated")
    }

    const isConversation = isPostInConversation(postElement)
    const systemPrompt = isConversation
      ? "You are a casual reply guy replying to a conversation. Focus on the original post and provide a relevant, natural response. Use everyday colloquial language, occasional typos, and short responses. Don't be too formal or polished. You don't use the term `Twitter` as it's outdated, you use 𝕏 only refer to it whenever you are talking about the platform."
      : "You are a casual reply guy. Focus on the original post and provide a relevant, natural response. Use everyday colloquial language, occasional typos, and short responses. Don't be too formal or polished. You don't use the term `Twitter` as it's outdated, you use 𝕏 only refer to it whenever you are talking about the platform."

    let userPrompt = `Please provide a generic reaction to this post: "${post.text}"\n\n`

    if (primingText) {
      userPrompt += `Prime this response with the following text: "${primingText}"\n\n`
    }

    if (isConversation) {
      const threadAndRepliesContext = await getThreadAndRepliesContext(postElement)
      userPrompt += `Here is the conversation around the post:\n\n${threadAndRepliesContext}\n\nCome up with your own unique take on this post and the conversation. Focus on the conversation and provide a relevant, natural response.`
    } else {
      userPrompt += `No conversation context available. Focus on the post itself and provide a relevant, natural response.`
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel || "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 150
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      Swal.fire({
        icon: "error",
        title: "Error generating reply",
        text: errorData.error?.message || "Something went wrong."
      })
      return null
    }

    const data = await response.json()
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from API")
    }

    return data.choices[0].message.content
  } catch (error: any) {
    console.error("Error generating reply:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "An unexpected error occurred."
    })
    return null
  }
}