import { useEffect } from "react"

import type { PlasmoCSConfig } from "@plasmohq/messaging"
import { querySelector } from "@plasmohq/selector"
import { Storage } from "@plasmohq/storage"
import Swal from 'sweetalert2'

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  all_frames: true
}

const storage = new Storage()

interface Post {
  id: string
  text: string
  author: string
  replies?: string[] // Added to store replies
}

// Styles for the ReplyGuy button
const buttonStyles = {
  backgroundColor: "#00ff9d15",
  color: "#00ff9d",
  border: "1px solid #00ff9d50",
  padding: "8px 12px",
  borderRadius: "20px",
  fontSize: "15px",
  fontWeight: "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease",
  marginLeft: "0",
  height: "36px",
  position: "relative",
  zIndex: "1000",
  minWidth: "36px",
  justifyContent: "center",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
}

const loadingStyles = {
  ...buttonStyles,
  backgroundColor: "#00ff9d30",
  cursor: "not-allowed"
}

// Enhanced function to detect if a post is part of a conversation
function isPostInConversation(postElement: Element): boolean {
  try {
    // Check for "show this thread" button
    const threadButtons = Array.from(
      postElement.querySelectorAll("span")
    ).filter((span) =>
      span.textContent?.toLowerCase().includes("show this thread")
    )

    if (threadButtons.length > 0) {
      return true
    }

    // Check for replies to the post
    const replyElements = postElement.querySelectorAll('[data-testid="reply"]')
    if (replyElements.length > 0) {
      return true
    }

    // Additional check for conversation indicators
    const conversationIndicators = postElement.querySelectorAll('[data-testid="conversation"]')
    return conversationIndicators.length > 0
  } catch (error) {
    console.error("Error in conversation detection:", error)
    return false
  }
}

async function getThreadAndRepliesContext(postElement: Element): Promise<string> {
  try {
    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    const currentText = textElement?.textContent || ""

    const threadButtons = Array.from(
      postElement.querySelectorAll("span")
    ).filter((span) =>
      span.textContent?.toLowerCase().includes("show this thread")
    )

    if (threadButtons.length > 0) {
      const button = threadButtons[0].closest(
        'div[role="button"]'
      ) as HTMLElement
      if (button) {
        button.click()

        let retries = 0
        const maxRetries = 3

        while (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          const threadPosts = document.querySelectorAll(
            'article[role="article"]'
          )
          if (threadPosts.length > 1) {
            break
          }
          retries++
        }
      }
    }

    const threadPosts = document.querySelectorAll('article[role="article"]')
    let threadContext = ""
    let seenTexts = new Set()

    threadPosts.forEach((post) => {
      const postText =
        post.querySelector('[data-testid="tweetText"]')?.textContent || ""
      if (postText && !seenTexts.has(postText)) {
        seenTexts.add(postText)
        threadContext += postText + "\n---\n"
      }
    })

    if (!threadContext.trim()) {
      console.warn("Thread context not found, using single post")
      return currentText
    }

    return threadContext
  } catch (error) {
    console.error("Error getting thread and replies context:", error)
    return (
      postElement.querySelector('[data-testid="tweetText"]')?.textContent || ""
    )
  }
}

async function generateReply(post: Post, postElement: Element) {
  try {
    const apiKey = await storage.get("openRouterApiKey")
    const selectedModel = await storage.get("selectedModel")

    if (!apiKey) {
      Swal.fire({
        icon: 'warning',
        title: 'API Key Required',
        text: 'Please set your OpenRouter API key in the extension settings.',
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

    if (isConversation) {
      const threadAndRepliesContext = await getThreadAndRepliesContext(postElement)
      userPrompt += `Here is the conversation around the post:\n\n${threadAndRepliesContext}\n\nCome up with your own unique take on this post and the conversation.`
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
        icon: 'error',
        title: 'Error generating reply',
        text: errorData.error?.message || 'Something went wrong.',
      })
      return null
    }

    const data = await response.json()
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API')
    }
    return data.choices[0].message.content

  } catch (error: any) {
    console.error("Error generating reply:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'An unexpected error occurred.',
    })
    return null
  }
}

async function handleReplyClick(postElement: Element) {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    alert("Extension context invalid. Please refresh the page and try again.")
    return
  }

  const textElement = postElement.querySelector('[data-testid="tweetText"]')
  const authorElement = postElement.querySelector('[data-testid="User-Name"]')

  if (!textElement || !authorElement) return

  const post: Post = {
    id: postElement.getAttribute("aria-labelledby") || "",
    text: textElement.textContent || "",
    author: authorElement.textContent || ""
  }

  const button = postElement.querySelector(
    ".replyguy-button"
  ) as HTMLButtonElement
  if (button) {
    Object.assign(button.style, loadingStyles)
    button.innerHTML = "🤖 Generating..."
    button.disabled = true
  }

  try {
    // Get thread context first if it's a thread
    const isThread = isPostInConversation(postElement)
    if (isThread) {
      console.log("Detected thread, getting context...")
      const threadContext = await getThreadAndRepliesContext(postElement)
      post.text = threadContext // Replace post text with full thread context
      console.log("Thread Context:", threadContext)
    }

    // Now generate reply with the complete context
    const reply = await generateReply(post, postElement)
    
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated")
    }

    if (reply && button) {
      const replyButton = postElement.querySelector('[data-testid="reply"]')
      if (replyButton) {
        ;(replyButton as HTMLElement).click()

        // Wait for reply modal to open and find it
        const modalTimeout = setTimeout(async () => {
          if (!chrome.runtime?.id) {
            clearTimeout(modalTimeout)
            return
          }

          // Find the most recently opened modal
          const modals = document.querySelectorAll(
            '[aria-labelledby="modal-header"]'
          )
          const modal = modals[modals.length - 1] // Get the last (most recent) modal
          if (!modal) {
            console.error("Could not find reply modal")
            return
          }

          // Find the DraftJS editor root within this specific modal
          const editorRoot = modal.querySelector(".DraftEditor-root")
          if (editorRoot) {
            // Remove placeholder within this modal
            const placeholder = editorRoot.querySelector(
              ".public-DraftEditorPlaceholder-root"
            )
            if (placeholder) {
              placeholder.remove()
            }

            // Find the contenteditable div within this modal
            const editor = editorRoot.querySelector(
              '[contenteditable="true"]'
            ) as HTMLElement
            if (editor) {
              // Focus the editor first
              editor.focus()

              // Create text node and insert it
              const textNode = document.createTextNode(reply)
              const firstDiv = editor.querySelector('div[data-contents="true"]')
              if (firstDiv) {
                const firstBlock = firstDiv.firstElementChild
                if (firstBlock) {
                  const textContainer = firstBlock.querySelector(
                    ".public-DraftStyleDefault-block"
                  )
                  if (textContainer) {
                    textContainer.innerHTML = ""
                    textContainer.appendChild(textNode)

                    // Dispatch input event
                    const inputEvent = new InputEvent("input", {
                      bubbles: true,
                      cancelable: true,
                      composed: true
                    })
                    editor.dispatchEvent(inputEvent)

                    // Wait a bit for Twitter to process the input
                    setTimeout(async () => {
                      // Find the submit button within this specific modal
                      const submitButton = modal.querySelector(
                        '[data-testid="tweetButton"]'
                      ) as HTMLButtonElement
                      if (submitButton) {
                        submitButton.disabled = false
                        submitButton.click()
                      }
                    }, 100)
                  }
                }
              }
            }
          }
        }, 1000)
      }
    }
  } catch (error) {
    if (error.message === "Extension context invalidated") {
      alert("Extension was reloaded. Please refresh the page and try again.")
    } else {
      console.error("Error generating reply:", error)
      alert("Failed to generate reply. Please try again.")
    }
  } finally {
    if (button && chrome.runtime?.id) {
      Object.assign(button.style, buttonStyles)
      button.innerHTML = "🤖"
      button.disabled = false
    }
  }
}

async function addReplyGuyButton(postElement: Element) {
  console.log("Attempting to add ReplyGuy button to:", postElement)

  // Function to find tweet actions
  const findTweetActions = async (maxAttempts = 5): Promise<Element | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Wait between attempts
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Updated selectors based on X/Twitter's current structure
      const actionSelectors = [
        '[data-testid="tweetButtonInline"]',  // Try to find the inline actions first
        '[data-testid="tweet"] [role="group"]',
        '[data-testid="tweetButtonInline"] [role="group"]',
        '[data-testid="tweetActionBar"]',
        '[data-testid="reply"]'  // If we can find the reply button, we can find its parent
      ]

      for (const selector of actionSelectors) {
        const element = postElement.querySelector(selector)
        if (element) {
          // If we found the reply button, get its parent group
          if (selector === '[data-testid="reply"]') {
            return element.closest('[role="group"]') || element.parentElement
          }
          return element
        }
      }
      
      console.log(`Attempt ${attempt + 1}: Waiting for tweet actions to load...`)
    }
    return null
  }

  try {
    const tweetActions = await findTweetActions()
    
    if (!tweetActions) {
      console.error("Could not find tweet actions after multiple attempts. Post HTML:", postElement.innerHTML)
      return
    }

    // Check if a button already exists
    if (postElement.querySelector(".replyguy-button")) {
      console.log("ReplyGuy button already exists")
      return
    }

    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    const authorElement = postElement.querySelector('[data-testid="User-Name"]')

    if (!textElement || !authorElement) {
      console.error("Missing required elements:", {
        hasText: !!textElement,
        hasAuthor: !!authorElement
      })
      return
    }

    const post: Post = {
      id: postElement.getAttribute("aria-labelledby") || "",
      text: textElement.textContent || "",
      author: authorElement.textContent || ""
    }

    console.log("Creating button for post:", post)

    const button = document.createElement("button")
    button.classList.add("replyguy-button")
    Object.assign(button.style, buttonStyles)
    button.innerHTML = "🤖"

    button.addEventListener("click", async () => {
      await handleReplyClick(postElement)
    })

    // Insert the button in the tweet actions area
    tweetActions.insertBefore(button, tweetActions.firstChild)
    console.log("Successfully added ReplyGuy button")
  } catch (error) {
    console.error("Error adding button:", error)
  }
}

async function observePosts() {
  console.log("Setting up post observer")

  let observerTimeout: NodeJS.Timeout | null = null;

  const observer = new MutationObserver(async (mutations) => {

    // Debounce the processing of mutations
    if (observerTimeout) {
      clearTimeout(observerTimeout)
    }

    observerTimeout = setTimeout(async () => {
      console.log("Processing mutations")
      // Find all articles, even if deeply nested
      const allPosts = document.querySelectorAll('article[role="article"]')
      console.log("Found posts:", allPosts.length)

      for (const post of allPosts) {
        if (!post.querySelector(".replyguy-button")) {
          await addReplyGuyButton(post)
        }
      }
    }, 500)
  })

  try {
    // Try multiple possible timeline selectors
    const timelineSelectors = [
      '[data-testid="primaryColumn"]',
      'main[role="main"]',
      "#react-root"
    ]

    let timeline = null
    for (const selector of timelineSelectors) {
      timeline = await querySelector(selector)
      if (timeline) {
        console.log("Found timeline with selector:", selector)
        break
      }
    }

    if (timeline) {
      console.log("Setting up observer on timeline")
      observer.observe(timeline, {
        childList: true,
        subtree: true,
        attributes: true
      })

      // Add buttons to existing posts
      const existingPosts = document.querySelectorAll('article[role="article"]')
      console.log("Found existing posts:", existingPosts.length)
      for (const post of existingPosts) {
        await addReplyGuyButton(post)
      }
    } else {
      console.error("Could not find timeline element")
    }
  } catch (error) {
    console.error("Error initializing ReplyGuy:", error)
  }

  return () => {
    if (observerTimeout) {
      clearTimeout(observerTimeout)
    }
    observer.disconnect()
  }
}

const ContentScript = () => {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      cleanup = await observePosts()
    }

    // Initialize when the component mounts
    init()

    // Re-initialize when URL changes (for Twitter's SPA navigation)
    let lastUrl = location.href
    const urlObserver = new MutationObserver(() => {
      const url = location.href
      if (url !== lastUrl) {
        lastUrl = url
        if (cleanup) {
          cleanup()
        }
        init()
      }
    })

    urlObserver.observe(document, { subtree: true, childList: true })

    // Cleanup when component unmounts
    return () => {
      if (cleanup) {
        cleanup()
      }
      urlObserver.disconnect()
    }
  }, [])

  return null
}

export default ContentScript
