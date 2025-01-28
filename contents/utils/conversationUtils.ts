// conversationUtils.ts

// Moved and refactored the conversation detection logic here

/**
 * Checks if a given post element is part of a conversation.
 */
export function isPostInConversation(postElement: Element): boolean {
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

/**
 * Gathers context from the thread and replies around a post.
 */
export async function getThreadAndRepliesContext(postElement: Element): Promise<string> {
  try {
    const textElement = postElement.querySelector('[data-testid="tweetText"]')
    const currentText = textElement?.textContent || ""

    const threadButtons = Array.from(
      postElement.querySelectorAll("span")
    ).filter((span) =>
      span.textContent?.toLowerCase().includes("show this thread")
    )

    if (threadButtons.length > 0) {
      const button = threadButtons[0].closest('div[role="button"]') as HTMLElement
      if (button) {
        button.click()

        let retries = 0
        const maxRetries = 3
        while (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          const threadPosts = document.querySelectorAll('article[role="article"]')
          if (threadPosts.length > 1) {
            break
          }
          retries++
        }
      }
    }

    const threadPosts = document.querySelectorAll('article[role="article"]')
    let threadContext = ""
    let seenTexts = new Set<string>()

    threadPosts.forEach((post) => {
      const postText = post.querySelector('[data-testid="tweetText"]')?.textContent || ""
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
    return postElement.querySelector('[data-testid="tweetText"]')?.textContent || ""
  }
}