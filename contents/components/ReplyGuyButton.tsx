/**
 * @fileoverview ReplyGuyButton component that creates and manages the AI reply button
 * for Twitter/X posts. This component is injected into each tweet's action bar.
 */

import { buttonStyles, loadingStyles } from "../styles/buttonStyles"
import { handleReplyClick } from "../utils/handlers/replyHandler"

/**
 * Props interface for the ReplyGuyButton component
 * @interface ReplyGuyButtonProps
 */
interface ReplyGuyButtonProps {
  /** The DOM element representing the tweet/post where the button will be added */
  postElement: Element
}

/**
 * Creates a button element that, when clicked, triggers the AI reply functionality
 * for a specific tweet/post.
 * 
 * @param {ReplyGuyButtonProps} props - The component props
 * @param {Element} props.postElement - The DOM element of the tweet where the button will be added
 * @returns {HTMLButtonElement} A configured button element ready to be inserted into the DOM
 */
export const ReplyGuyButton = ({ postElement }: ReplyGuyButtonProps) => {
  // Create a new button element
  const button = document.createElement("button")
  
  // Add the identifying class and Twitter's button classes
  button.classList.add(
    "replyguy-button",
    "css-175oi2r",
    "r-1777fci",
    "r-bt1l66",
    "r-bztko3",
    "r-lrvibr",
    "r-1loqt21",
    "r-1ny4l3l"
  )
  button.setAttribute("role", "button")
  button.setAttribute("aria-label", "Generate AI Reply")
  
  // Create the inner structure to match Twitter's button layout
  const innerDiv = document.createElement("div")
  innerDiv.className = "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q"
  innerDiv.style.color = "rgb(113, 118, 123)"
  
  const iconDiv = document.createElement("div")
  iconDiv.className = "css-175oi2r r-xoduu5"
  iconDiv.innerHTML = "🤖"
  
  innerDiv.appendChild(iconDiv)
  button.appendChild(innerDiv)

  // Add click event listener to handle AI reply generation
  button.addEventListener("click", async () => {
    await handleReplyClick(postElement)
  })

  return button
}