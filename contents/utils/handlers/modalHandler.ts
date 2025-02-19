import { buttonStyles, loadingStyles } from "../../styles/buttonStyles"
import { generateReply } from "../services/replyService"
import { Storage } from "@plasmohq/storage"
import type { Post } from "../types"

const storage = new Storage()

export async function addPrimeButtonToModal(modal: Element, post: Post, postElement: Element) {
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