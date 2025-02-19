import { Storage } from "@plasmohq/storage"
import { generateReply } from "../services/replyService"
import { buttonStyles, loadingStyles } from "../../styles/buttonStyles"
import { addPrimeButtonToModal } from "./modalHandler"
import type { Post } from "../types"

const storage = new Storage()

export async function handleReplyClick(postElement: Element) {
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