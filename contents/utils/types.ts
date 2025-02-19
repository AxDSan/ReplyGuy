export interface Post {
  id: string
  text: string
  author: string
}

export interface PostElement {
  innerHTML: string
}

export interface EditorElement extends HTMLElement {
  contentEditable: "true"
}

export interface ModalElement extends Element {
  querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null
  querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null
  querySelector<E extends Element = Element>(selectors: string): E | null
}