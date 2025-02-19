// content.tsx
/**
 * @fileoverview Content script for the ReplyGuy browser extension.
 * This script handles the injection of ReplyGuy buttons into Twitter/X posts
 * and manages the observation of DOM changes to ensure buttons are added to new posts.
 */

import { useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { querySelector } from "@plasmohq/selector"
import { ReplyGuyButton } from "./components/ReplyGuyButton"

/**
 * Configuration for the Plasmo content script
 * Specifies which URLs the script should run on and whether it runs in all frames
 */
export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  all_frames: true
}

/**
 * Adds a ReplyGuy button to a specific post element in the Twitter/X interface.
 * This function handles the UI injection logic, including finding the appropriate
 * location for the button and ensuring all required elements are present.
 *
 * @param {Element} postElement - The DOM element representing the tweet/post
 * @returns {Promise<void>}
 */
async function addReplyGuyButton(postElement: Element) {
  console.log("Attempting to add ReplyGuy button to:", postElement)

  /**
   * Helper function to find the tweet actions container with retry logic
   * @param {number} maxAttempts - Maximum number of attempts to find the container
   * @returns {Promise<Element|null>} The found container element or null if not found
   */
  const findTweetActions = async (maxAttempts: number = 5): Promise<Element | null> => {
    console.log("findTweetActions started")
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      // First try to find the Grok button container
      const grokContainer = postElement.querySelector('div[role="group"] button[aria-label="Grok actions"]')?.closest('.css-175oi2r.r-18u37iz.r-1h0z5md')
      if (grokContainer) {
        return grokContainer
      }
      // Fallback to the original tweet actions container if Grok button is not found
      const tweetActions = postElement.querySelector('div[role="group"].r-1kbdv8c')
      if (tweetActions) {
        return tweetActions
      }
    }
    console.warn("Could not find tweet actions after multiple attempts")
    return null
  }

  try {
    // Find the tweet actions container where we'll inject our button
    const tweetActions = await findTweetActions()
    if (!tweetActions) {
      console.error("Could not find tweet actions after multiple attempts. Post HTML:", postElement.innerHTML)
      return
    }

    console.log("Tweet actions found:", tweetActions)
    
    // Prevent duplicate buttons
    if (postElement.querySelector(".replyguy-button")) {
      console.log("ReplyGuy button already exists")
      return
    }

    // Verify required elements are present
    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    const authorElement = postElement.querySelector('[data-testid="User-Name"]')
    if (!textElement || !authorElement) {
      console.error("Missing required elements:", {
        hasText: !!textElement,
        hasAuthor: !!authorElement
      })
      return
    }

    // Create container div to match Twitter's button container structure
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "css-175oi2r r-18u37iz r-1h0z5md r-13awgt0"
    
    // Create and inject the ReplyGuy button
    const button = ReplyGuyButton({ postElement })
    buttonContainer.appendChild(button)
    tweetActions.appendChild(buttonContainer)
    console.log("Successfully added ReplyGuy button")
  } catch (error) {
    console.error("Error adding button:", error)
  }
}

/**
 * Sets up and manages the mutation observer to watch for new posts being added to the timeline.
 * This function is responsible for detecting DOM changes and ensuring ReplyGuy buttons are added
 * to new posts as they appear.
 *
 * @returns {Promise<() => void>} A cleanup function that disconnects the observers
 */
async function observePosts() {
  console.log("Setting up post observer")

  // Debounce timer for handling mutations
  let observerTimeout: NodeJS.Timeout | null = null

  // Create mutation observer to watch for new posts
  const observer = new MutationObserver(async () => {
    if (observerTimeout) {
      clearTimeout(observerTimeout)
    }
    observerTimeout = setTimeout(async () => {
      console.log("Processing mutations")
      const allPosts = document.querySelectorAll('article[role="article"]')
      console.log("Found posts:", allPosts.length)

      // Add ReplyGuy button to any posts that don't have one
      for (const post of allPosts) {
        if (!post.querySelector(".replyguy-button")) {
          await addReplyGuyButton(post)
        }
      }
    }, 500)
  })

  try {
    // List of possible selectors for finding the timeline element
    const timelineSelectors = [
      '[data-testid="primaryColumn"]',
      'main[role="main"]',
      "#react-root"
    ]

    // Find the timeline element using the first matching selector
    let timeline = null
    for (const selector of timelineSelectors) {
      timeline = await querySelector(selector)
      if (timeline) {
        console.log("Found timeline with selector:", selector)
        break
      }
    }

    if (timeline) {
      // Set up the observer to watch for changes in the timeline
      console.log("Setting up observer on timeline")
      observer.observe(timeline, {
        childList: true,
        subtree: true,
        attributes: true
      })

      // Add buttons to any posts that already exist
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

  // Return cleanup function
  return () => {
    if (observerTimeout) {
      clearTimeout(observerTimeout)
    }
    observer.disconnect()
  }
}

/**
 * The main ContentScript component that initializes the ReplyGuy functionality.
 * This component sets up observers for both post additions and URL changes,
 * ensuring the extension works properly as users navigate through Twitter/X.
 *
 * @returns {null} This component doesn't render any visible elements
 */
const ContentScript = () => {
  console.log("ContentScript component is running")
  useEffect(() => {
    let cleanup: (() => void) | undefined

    // Initialize the post observer
    const init = async () => {
      cleanup = await observePosts()
    }

    init()

    // Set up URL change detection
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

    // Cleanup function for React useEffect
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