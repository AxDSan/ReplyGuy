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
  
  // Add the identifying class for the ReplyGuy button
  button.classList.add("replyguy-button")
  
  // Apply the predefined styles to the button
  Object.assign(button.style, buttonStyles)
  
  // Set the button content to a robot emoji
  button.innerHTML = "🤖"

  // Add click event listener to handle AI reply generation
  button.addEventListener("click", async () => {
    await handleReplyClick(postElement)
  })

  return button
}