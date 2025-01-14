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
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
}

const loadingStyles = {
  ...buttonStyles,
  backgroundColor: "#00ff9d30",
  cursor: "not-allowed"
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
          model: selectedModel || "mistralai/mistral-7b-instruct", // Fallback to default model
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates engaging and relevant replies to social media posts. Keep responses concise, natural, and engaging. Aim for a friendly and conversational tone in plain everyday coloquial english."
            },
            {
              role: "user",
              content: `Please generate a short and brief reply to this post by ${post.author}: "${post.text}"`
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

  const textElement = await querySelector(
    '[data-testid="tweetText"]',
    postElement
  )
  const authorElement = await querySelector(
    '[data-testid="User-Name"]',
    postElement
  )

  if (!textElement || !authorElement) return

  const post: Post = {
    id: postElement.getAttribute("aria-labelledby") || "",
    text: textElement.textContent || "",
    author: authorElement.textContent || ""
  }

  const button = (await querySelector(
    ".replyguy-button",
    postElement
  )) as HTMLButtonElement
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
      const replyButton = await querySelector(
        '[data-testid="reply"]',
        postElement
      )
      if (replyButton) {
        ;(replyButton as HTMLElement).click()

        // Wait for reply modal to open
        const modalTimeout = setTimeout(async () => {
          if (!chrome.runtime?.id) {
            clearTimeout(modalTimeout)
            return
          }

          // Find the DraftJS editor root
          const editorRoot = await querySelector(".DraftEditor-root")
          if (editorRoot) {
            // Remove placeholder
            const placeholder = await querySelector(
              ".public-DraftEditorPlaceholder-root",
              editorRoot
            )
            if (placeholder) {
              placeholder.remove()
            }

            // Find the contenteditable div
            const editor = await querySelector(
              '[contenteditable="true"]',
              editorRoot
            )
            if (editor) {
              // Focus the editor first
              editor.focus()

              // Create text node and insert it
              const textNode = document.createTextNode(reply)
              const firstDiv = await querySelector(
                'div[data-contents="true"]',
                editor
              )
              if (firstDiv) {
                const firstBlock = firstDiv.firstElementChild
                if (firstBlock) {
                  const textContainer = await querySelector(
                    ".public-DraftStyleDefault-block",
                    firstBlock
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
                      const submitButton = (await querySelector(
                        '[data-testid="tweetButton"]'
                      )) as HTMLButtonElement
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
  // Check if button already exists
  if (await querySelector(".replyguy-button", postElement)) {
    return
  }

  // Find the actions group (where reply, retweet, like buttons are)
  const actionsGroup = await querySelector(
    '[role="group"][id*="id__"]',
    postElement
  )
  if (!actionsGroup) return

  // Create button container to match Twitter's structure
  const buttonContainer = document.createElement("div")
  buttonContainer.className = "css-175oi2r r-18u37iz r-1h0z5md r-13awgt0"

  const button = document.createElement("button")
  button.className =
    "replyguy-button css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-1loqt21 r-1ny4l3l"
  Object.assign(button.style, buttonStyles)

  button.innerHTML =
    '<div dir="ltr" class="css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q" style="color: rgb(113, 118, 123);"><div class="css-175oi2r r-xoduu5"><div class="css-175oi2r r-xoduu5 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-1niwhzg r-sdzlij r-xf4iuw r-o7ynqc r-6416eg r-1ny4l3l"></div>🤖</div></div>'

  // Add hover effects
  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#00ff9d25"
    button.style.transform = "scale(1.05)"
  })
  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#00ff9d15"
    button.style.transform = "scale(1)"
  })
  button.addEventListener("mousedown", () => {
    button.style.transform = "scale(0.95)"
  })
  button.addEventListener("mouseup", () => {
    button.style.transform = "scale(1.05)"
  })

  button.addEventListener("click", () => handleReplyClick(postElement))

  buttonContainer.appendChild(button)
  actionsGroup.insertBefore(buttonContainer, actionsGroup.lastElementChild)
}

async function observePosts() {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          // Check if the added node is a tweet
          if (node.matches('article[role="article"]')) {
            await addReplyGuyButton(node)
          }
          // Also check children in case the tweet is nested
          const tweets = node.querySelectorAll('article[role="article"]')
          for (const tweet of tweets) {
            await addReplyGuyButton(tweet)
          }
        }
      }
    }
  })

  try {
    // Try to find the timeline with error handling
    const timeline = await querySelector('[data-testid="primaryColumn"]')
    if (timeline) {
      observer.observe(timeline, {
        childList: true,
        subtree: true
      })

      // Add buttons to existing posts
      const existingPosts = document.querySelectorAll('article[role="article"]')
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
