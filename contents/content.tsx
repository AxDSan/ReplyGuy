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
  const threadKeywords = ["thread", "🧵"];
  // Allow for leading whitespace
  const threadRegex = /^\s*\d+\/\d+/;
  const textElement = postElement.querySelector('[data-testid="tweetText"]')
  let firstSpanText = ""
  if (textElement) {
    const firstSpan = textElement.querySelector('span')
    if (firstSpan) {
      firstSpanText = firstSpan.textContent || ""
    }
  }
  console.log("Checking if post is a thread:", firstSpanText)

  if (threadKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
    console.log("Thread keyword found:", text)
    return true;
  }

  if (threadRegex.test(firstSpanText)) {
      console.log("Thread regex match found:", firstSpanText)
    return true;
  }
    console.log("No thread found:", firstSpanText)
  return false;
}

async function generateReply(post: Post) {
  try {
    const apiKey = await storage.get("openRouterApiKey")
    const selectedModel = await storage.get("selectedModel")

    if (!apiKey) {
      alert("Please set your OpenRouter API key in the extension settings")
      return null
    }

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated")
    }

    const isThread = isPostAThread(post.text, document.querySelector(`[aria-labelledby="${post.id}"]`))
    let systemPrompt =
      "You are a casual social media user. Keep responses short, informal, and natural. Avoid corporate language, excessive enthusiasm, or marketing speak. Don't use hashtags unless specifically relevant. Occasionally use lowercase, simple punctuation, and brief responses. Don't overuse emojis - one at most. Never use exclamation points more than once. Avoid buzzwords and clichés. Write like a real person having a quick conversation."

    let userPrompt = `Generate a brief, casual reply to this post "${post.text}". Keep it natural and conversational, as if you're just another person on the platform.`

    if (isThread) {
      systemPrompt =
        "You are a casual social media user engaging in a thread. Keep responses short, informal, and natural. Avoid corporate language, excessive enthusiasm, or marketing speak. Don't use hashtags unless specifically relevant. Occasionally use lowercase, simple punctuation, and brief responses. Don't overuse emojis - one at most. Never use exclamation points more than once. Avoid buzzwords and clichés. Write like a real person having a quick conversation. Make sure to acknowledge the thread context."
      userPrompt = `Generate a brief, casual reply to this post "${post.text}", within the context of a thread. Keep it natural and conversational, as if you're just another person on the platform.`
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
  // Add a small delay to allow for rendering
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Directly use postElement as the tweet container
  const tweetActions = postElement.querySelector(
    '[role="group"][aria-label="Tweet actions"]'
  )
  if (!tweetActions) {
    console.log("Could not find tweet actions", postElement)
    return
  }

  // Check if a button already exists
  if (postElement.querySelector(".replyguy-button")) {
    console.log("ReplyGuy button already exists", postElement)
    return
  }

  const textElement = postElement.querySelector('[data-testid="tweetText"]')
  const authorElement = postElement.querySelector('[data-testid="User-Name"]')

  if (!textElement || !authorElement) {
    console.log("Could not find text or author element", postElement)
    return
  }

  const post: Post = {
    id: postElement.getAttribute("aria-labelledby") || "",
    text: textElement.textContent || "",
    author: authorElement.textContent || ""
  }

  const button = document.createElement("button")
  button.classList.add("replyguy-button")
  Object.assign(button.style, buttonStyles)
  button.innerHTML = "🤖 Reply"

  button.addEventListener("click", async () => {
    await handleReplyClick(postElement)
  })

  tweetActions.insertBefore(button, tweetActions.firstChild)
}

async function observePosts() {
  console.log("Setting up post observer")
  const observer = new MutationObserver(async (mutations) => {
    console.log("Mutation observed", mutations)
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          // Check if the added node is a tweet
          if (node.matches('article[role="article"]')) {
            console.log("Found tweet article", node)
            await addReplyGuyButton(node)
          }
          // Also check children in case the tweet is nested
          const tweets = node.querySelectorAll('article[role="article"]')
          if (tweets.length > 0) {
            console.log("Found nested tweets", tweets)
            for (const tweet of tweets) {
              await addReplyGuyButton(tweet)
            }
          }
        }
      }
    }
  })

  try {
    console.log("Looking for timeline")
    // Try to find the timeline with error handling
    const timeline = await querySelector('[data-testid="primaryColumn"]')
    if (timeline) {
      console.log("Found timeline, setting up observer", timeline)
      observer.observe(timeline, {
        childList: true,
        subtree: true
      })

      // Add buttons to existing posts
      const existingPosts = document.querySelectorAll('article[role="article"]')
      console.log("Found existing posts:", existingPosts.length)
      for (const post of existingPosts) {
        await addReplyGuyButton(post)
      }
    }
  } catch (error) {
    console.error("Error initializing ReplyGuy:", error)
  }

  return () => observer.disconnect()
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
