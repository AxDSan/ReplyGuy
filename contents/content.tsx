// content.tsx

// Kept only the necessary imports for the content script logic and UI handling
import { useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import Swal from "sweetalert2" // for handling alerts

// Import the separated logic
import { generateReply } from "./utils/services/replyService"

import { Storage } from "@plasmohq/storage"
import { querySelector } from "@plasmohq/selector"

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  all_frames: true
}

// -----------------------------------------------------
// NOTE: The storage and interfaces remain the same
// -----------------------------------------------------
const storage = new Storage()

interface Post {
  id: string
  text: string
  author: string
  replies?: string[]
}

// -----------------------------------------------------
// Button style definitions remain the same
// -----------------------------------------------------
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

// -------------------------------------------------------------
// handleReplyClick now uses "generateReply" imported from our service
// -------------------------------------------------------------
async function handleReplyClick(postElement: Element) {
  if (!chrome.runtime?.id) {
    alert("Extension context invalid. Please refresh the page and try again.")
    return
  }

  const primeEnabled = await storage.get<boolean>("primeEnabled")
  const textElement = postElement.querySelector('[data-testid="tweetText"]')
  const authorElement = postElement.querySelector('[data-testid="User-Name"]')

  if (!textElement || !authorElement) return

  const post: Post = {
    id: postElement.getAttribute("aria-labelledby") || "",
    text: textElement.textContent || "",
    author: authorElement.textContent || ""
  }

  const button = postElement.querySelector(".replyguy-button") as HTMLButtonElement
  if (button) {
    Object.assign(button.style, loadingStyles)
    button.innerHTML = "🤖 Generating..."
    button.disabled = true
  }

  if (primeEnabled) {
    const replyButton = postElement.querySelector('[data-testid="reply"]')
    if (replyButton) {
      ;(replyButton as HTMLElement).click()
    }

    sessionStorage.setItem("replyguy_post_context", JSON.stringify(post))
    sessionStorage.setItem("replyguy_post_element", JSON.stringify({
      innerHTML: postElement.innerHTML
    }))

    setTimeout(() => {
      const modal = document.querySelector('[aria-labelledby="modal-header"]')
      if (modal) {
        addPrimeButtonToModal(modal, post, postElement)
      }
    }, 500)
  } else {
    try {
      const reply = await generateReply(post, postElement, undefined)
      if (reply && button) {
        const replyButton = postElement.querySelector('[data-testid="reply"]')
        if (replyButton) {
          ;(replyButton as HTMLElement).click()

          const modalTimeout = setTimeout(async () => {
            if (!chrome.runtime?.id) {
              clearTimeout(modalTimeout)
              return
            }

            const modals = document.querySelectorAll('[aria-labelledby="modal-header"]')
            const modal = modals[modals.length - 1]
            if (!modal) {
              console.error("Could not find reply modal")
              return
            }

            const editorRoot = modal.querySelector(".DraftEditor-root")
            if (editorRoot) {
              const placeholder = editorRoot.querySelector(".public-DraftEditorPlaceholder-root")
              if (placeholder) {
                placeholder.remove()
              }

              const editor = editorRoot.querySelector('[contenteditable="true"]') as HTMLElement
              if (editor) {
                editor.focus()
                const textNode = document.createTextNode(reply)
                const firstDiv = editor.querySelector('div[data-contents="true"]')
                if (firstDiv) {
                  const firstBlock = firstDiv.firstElementChild
                  if (firstBlock) {
                    const textContainer = firstBlock.querySelector(".public-DraftStyleDefault-block")
                    if (textContainer) {
                      textContainer.innerHTML = ""
                      textContainer.appendChild(textNode)

                      const inputEvent = new InputEvent("input", {
                        bubbles: true,
                        cancelable: true,
                        composed: true
                      })
                      editor.dispatchEvent(inputEvent)

                      setTimeout(async () => {
                        const submitButton = modal.querySelector('[data-testid="tweetButton"]') as HTMLButtonElement
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
      if ((error as Error).message === "Extension context invalidated") {
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
}

// --------------------------------------------------------
// The Prime button logic remains the same, referencing generateReply
// --------------------------------------------------------
async function addPrimeButtonToModal(modal: Element, post: Post, postElement: Element) {
  const primeButton = document.createElement("button")
  primeButton.textContent = "Prime Reply"
  Object.assign(primeButton.style, buttonStyles)
  primeButton.style.marginTop = "10px"

  primeButton.addEventListener("click", async () => {
    const editor = modal.querySelector<HTMLElement>('[contenteditable="true"]')
    const primingText = editor?.textContent || ""

    Object.assign(primeButton.style, loadingStyles)
    primeButton.textContent = "🤖 Generating..."
    primeButton.disabled = true

    const reply = await generateReply(post, postElement, primingText)
    if (reply) {
      const editorRoot = modal.querySelector(".DraftEditor-root")
      if (editorRoot) {
        const placeholder = editorRoot.querySelector(".public-DraftEditorPlaceholder-root")
        if (placeholder) {
          placeholder.remove()
        }

        const editorElem = editorRoot.querySelector('[contenteditable="true"]') as HTMLElement
        if (editorElem) {
          editorElem.focus()
          const textNode = document.createTextNode(reply)
          const firstDiv = editorElem.querySelector('div[data-contents="true"]')
          if (firstDiv) {
            const firstBlock = firstDiv.firstElementChild
            if (firstBlock) {
              const textContainer = firstBlock.querySelector(".public-DraftStyleDefault-block")
              if (textContainer) {
                textContainer.innerHTML = ""
                textContainer.appendChild(textNode)

                const inputEvent = new InputEvent("input", {
                  bubbles: true,
                  cancelable: true,
                  composed: true
                })
                editorElem.dispatchEvent(inputEvent)
              }
            }
          }
        }
      }
    }

    Object.assign(primeButton.style, buttonStyles)
    primeButton.textContent = "Prime Reply"
    primeButton.disabled = false
  })

  storage.get("primeEnabled").then(primeEnabled => {
    if (primeEnabled) {
      modal.querySelector('[data-testid="tweetButton"]')!.parentElement!.appendChild(primeButton)
    }
  })
}

// --------------------------------------------------------
// addReplyGuyButton now focuses on UI injection only,
// relying on handleReplyClick to do the rest
// --------------------------------------------------------
async function addReplyGuyButton(postElement: Element) {
  console.log("Attempting to add ReplyGuy button to:", postElement)

  const findTweetActions = async (maxAttempts: number = 5): Promise<Element | null> => {
    console.log("findTweetActions started")
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      const tweetActions = postElement.querySelector('div[role="group"].r-1kbdv8c')
      if (tweetActions) {
        return tweetActions
      }
    }
    console.warn("Could not find tweet actions after multiple attempts")
    return null
  }

  try {
    const tweetActions = await findTweetActions()
    if (!tweetActions) {
      console.error("Could not find tweet actions after multiple attempts. Post HTML:", postElement.innerHTML)
      return
    }

    console.log("Tweet actions found:", tweetActions)
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

    const button = document.createElement("button")
    button.classList.add("replyguy-button")
    Object.assign(button.style, buttonStyles)
    button.innerHTML = "🤖"

    button.addEventListener("click", async () => {
      await handleReplyClick(postElement)
    })

    tweetActions.insertAdjacentElement("afterend", button)
    console.log("Successfully added ReplyGuy button")
  } catch (error) {
    console.error("Error adding button:", error)
  }
}

// --------------------------------------------------------
// observePosts remains our entry point, hooking everything up
// --------------------------------------------------------
async function observePosts() {
  console.log("Setting up post observer")

  let observerTimeout: NodeJS.Timeout | null = null

  const observer = new MutationObserver(async () => {
    if (observerTimeout) {
      clearTimeout(observerTimeout)
    }
    observerTimeout = setTimeout(async () => {
      console.log("Processing mutations")
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

// --------------------------------------------------------
// The main ContentScript component now just initializes everything
// --------------------------------------------------------
const ContentScript = () => {
  console.log("ContentScript component is running")
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      cleanup = await observePosts()
    }

    init()

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