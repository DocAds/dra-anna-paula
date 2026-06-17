import sanitizeHtml from "sanitize-html";

// Sanitiza o HTML de um post (editor TipTap ou IA) preservando formatação,
// imagens e embeds de vídeo, e removendo scripts/handlers perigosos.
// Usa sanitize-html (parser próprio, sem jsdom) — seguro no runtime serverless.
export function sanitizePostHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "blockquote", "pre", "code",
      "ul", "ol", "li",
      "strong", "b", "em", "i", "u", "s", "span", "mark", "sub", "sup",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "iframe", "video", "source",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "class", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "class", "style"],
      video: ["src", "controls", "preload", "class", "width", "height", "poster"],
      source: ["src", "type"],
      div: ["class", "style"],
      span: ["class"],
      "*": ["class"],
    },
    allowedIframeHostnames: [
      "www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com",
    ],
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      "*": {
        width: [/^\d+(?:px|%)$/],
        height: [/^\d+(?:px|%)$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}
