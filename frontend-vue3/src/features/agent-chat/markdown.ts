import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: true })

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'span', 'div', 'img'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
}

export function renderMarkdownSafe(content: string): string {
  if (!content) return ''
  const rawHtml = md.render(content)
  return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG) as unknown as string
}
