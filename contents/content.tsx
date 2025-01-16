import { useEffect } from "react"

import type { PlasmoContentScript } from "@plasmohq/messaging"
import { querySelector } from "@plasmohq/selector"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoContentScript = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  all_frames: true
}

const storage = new Storage()

interface Post {
  id: string
  text: string
  author: string
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

function isPostAThread(text: string, postElement: Element): boolean {
  console.log("Checking if post is a thread. Post element:", postElement)

  try {
    // Find the timeline type
    const timeline = document.querySelector('main[role="main"]')
    const timelineLabel = timeline?.getAttribute("aria-label")
    console.log("Timeline type:", timelineLabel)

    // If we're in a conversation timeline, it's a thread
    if (timelineLabel?.includes("Timeline: Conversation")) {
      console.log("Thread detected - in Conversation timeline")
      return true
    }

    // If we're in home timeline, it's a single post
    if (timelineLabel?.includes("Timeline: Your Home Timeline")) {
      console.log("Single post detected - in Home timeline")
      return false
    }

    // Fallback to previous detection logic if timeline type is unknown
    // Check for thread indicators in text
    const threadKeywords = [
      "thread",
      "🧵",
      "1/",
      "1.",
      "part 1",
      "thread:",
      "a thread",
      "(1/",
      "1)",
      "beginning a thread",
      "start of thread"
    ]

    // Enhanced regex to catch more thread formats
    const threadRegex =
      /^\s*(?:(\d+)\/(\d+)|(\d+)\.\s|\((\d+)\/(\d+)\)|\[(\d+)\/(\d+)\])/i

    // Get the text content with better error handling
    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    let firstSpanText = ""
    let fullText = text || ""

    if (textElement) {
      // Get all spans to check for thread indicators
      const spans = textElement.querySelectorAll("span")
      spans.forEach((span) => {
        const spanText = span.textContent || ""
        if (threadRegex.test(spanText)) {
          firstSpanText = spanText
        }
      })

      // Get full text content
      fullText = textElement.textContent || text
    }

    // Log findings
    const findings = {
      keywords: threadKeywords.some((keyword) =>
        fullText.toLowerCase().includes(keyword)
      ),
      regexMatch: threadRegex.test(firstSpanText),
      fullText
    }
    console.log("Thread detection findings:", findings)

    // Return true if any thread indicator is found
    return findings.keywords || findings.regexMatch
  } catch (error) {
    console.error("Error in thread detection:", error)
    return false
  }
}

async function getThreadContext(postElement: Element): Promise<string> {
  try {
    // Get the current post text
    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    const currentText = textElement?.textContent || ""

    // Try to find "Show this thread" button and click it
    const threadButtons = Array.from(
      postElement.querySelectorAll("span")
    ).filter((span) =>
      span.textContent?.toLowerCase().includes("show this thread")
    )

    if (threadButtons.length > 0) {
      // Click the button to expand thread
      const button = threadButtons[0].closest(
        'div[role="button"]'
      ) as HTMLElement
      if (button) {
        button.click()

        // Wait for thread to load with retries
        let retries = 0
        const maxRetries = 3

        while (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Check if thread has loaded by looking for multiple posts
          const threadPosts = document.querySelectorAll(
            'article[role="article"]'
          )
          if (threadPosts.length > 1) {
            break
          }

          retries++
          if (retries === maxRetries) {
            console.warn("Thread expansion timed out after retries")
          }
        }
      }
    }

    // Get all posts in the thread
    const threadPosts = document.querySelectorAll('article[role="article"]')
    let threadContext = ""
    let seenTexts = new Set() // To avoid duplicates

    // Collect text from all posts
    threadPosts.forEach((post) => {
      const postText =
        post.querySelector('[data-testid="tweetText"]')?.textContent || ""
      if (postText && !seenTexts.has(postText)) {
        seenTexts.add(postText)
        threadContext += postText + "\n---\n"
      }
    })

    // If we couldn't get thread context, fall back to current post
    if (!threadContext.trim()) {
      console.warn("Could not get thread context, falling back to current post")
      return currentText
    }

    return threadContext
  } catch (error) {
    console.error("Error getting thread context:", error)
    // Fall back to current post text on error
    return (
      postElement.querySelector('[data-testid="tweetText"]')?.textContent || ""
    )
  }
}

async function generateReply(post: Post) {
  try {
    const apiKey = await storage.get("openRouterApiKey")
    const selectedModel = await storage.get("selectedModel")

    if (!apiKey) {
      alert("Please set your OpenRouter API key in the extension settings")
      return null
    }

    // Check if post is a thread
    const postElement = document.querySelector(
      `[aria-labelledby*="${post.id}"]`
    )
    const isThread = postElement ? isPostAThread(post.text, postElement) : false

    // Get appropriate context
    let context = post.text
    if (isThread && postElement) {
      context = await getThreadContext(postElement)
    }

    // Adjust system prompt based on whether it's a thread
    const systemPrompt = isThread
      ? "You are a casual reply guy replying to a thread. Keep it natural - use informal, everyday coloquial language, occasional typos, and short responses. Don't be too formal or polished. You don't use the term `Twitter` as it's outdated, you use 𝕏."
      : "You are a casual reply guy. Keep replies short, informal and natural everyday coloquial language. Use common internet slang, emojis occasionally, and don't worry about perfect grammar. You don't use the term `Twitter` as it's outdated, you use 𝕏."

    const userPrompt = `Very briefly reply to this ${isThread ? "thread" : "post"} like a regular person (not too formal, use everyday coloquial english):\n\n${context}\n\nREMEMBER DO NOT INCLUDE EVERY LITTLE DETAIL OF THE ${isThread ? "THREAD!" : "POST!"}, simply make a very short summarized statement on the ${isThread ? "thread" : "post"}, ALWAYS address the post in first person, context and highlight maybe one or two remarks that seems interesting from it! keep the reply relevant! if the context is regarding a video or a showcase, say something like "that looks amazing" nor "that sounds amazing"\n\nAn INCORRECT reply would be ie. "Dr. Steven Greer is talking about..." A CORRECT reply would be ie. "Whoa! the thing you were talking about is really..."`

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated")
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "ReplyGuy"
        },
        body: JSON.stringify({
          model: selectedModel || "microsoft/phi-4", // Fallback to default model
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ]
        })
      }
    )

    const data = await response.json()
    const reply = data.choices[0]?.message?.content

    // Sanitize the reply by removing all quotation marks
    return reply ? reply.replace(/["']/g, "") : null
  } catch (error) {
    if (error.message === "Extension context invalidated") {
      alert("Extension was reloaded. Please try again.")
    } else {
      console.error("Error in generateReply:", error)
      alert("Failed to generate reply. Please try again.")
    }
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
    const reply = await generateReply(post)
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

  // Add a small delay to allow for rendering
  await new Promise((resolve) => setTimeout(resolve, 500)) // Increased delay

  // Try multiple selectors for tweet actions
  const actionSelectors = [
    '[role="group"][aria-label="Tweet actions"]',
    '[role="group"][aria-label*="actions"]',
    '[role="group"]'
  ]

  let tweetActions = null
  for (const selector of actionSelectors) {
    tweetActions = postElement.querySelector(selector)
    if (tweetActions) {
      console.log("Found tweet actions with selector:", selector)
      break
    }
  }

  if (!tweetActions) {
    console.error(
      "Could not find tweet actions. Available elements:",
      postElement.innerHTML
    )
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

  try {
    tweetActions.insertBefore(button, tweetActions.firstChild)
    console.log("Successfully added ReplyGuy button")
  } catch (error) {
    console.error("Error adding button:", error)
  }
}

async function observePosts() {
  console.log("Setting up post observer")

  const observer = new MutationObserver(async (mutations) => {
    console.log("Mutation observed", mutations.length, "changes")

    // Debounce the processing of mutations
    if (observer.timeout) {
      clearTimeout(observer.timeout)
    }

    observer.timeout = setTimeout(async () => {
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
    if (observer.timeout) {
      clearTimeout(observer.timeout)
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
