/* static/js/publications.js */

/** Escape to avoid HTML injection in content fields. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert "Ada Lovelace" → "Lovelace, A." like the prior site behavior. */
function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  const last = parts.pop();
  const inits = parts.map(p => (p[0] || "").toUpperCase() + ".").join(" ");
  return `${last}, ${inits}`;
}

/** Format a list of authors; collapse with “et al.” after 10. */
function formatAuthors(list) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const mapped = list.map(initials);
  return mapped.length <= 10 ? mapped.join(", ") : mapped.slice(0, 10).join(", ") + ", et al.";
}

/** Capitalize only the first character; leave the remainder unchanged. */
function capFirst(s) {
  s = String(s ?? "");
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Normalize an href so external links open as absolute URLs.
 * - Keeps absolute URLs (http:, https:, mailto:, tel:, etc.) unchanged.
 * - Keeps site-relative paths (starting with "/", "./", "../") unchanged.
 * - For bare hostnames like "github.com/foo", prefixes "https://".
 * - Trims whitespace; returns null for empty strings.
 */
function normalizeHref(href) {
  const raw = String(href ?? "").trim();
  if (!raw) return null;

  // Already absolute (scheme present)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;

  // Site-relative or dot-relative paths
  if (/^(\/|\.{1,2}\/)/.test(raw)) return raw;

  // Protocol-relative (e.g., //example.com)
  if (/^\/\//.test(raw)) return raw; // browser will inherit current protocol

  // Bare domain/path (e.g., github.com/owner/repo)
  if (/^[\w.-]+\.[a-zA-Z]{2,}(?:[:/]|$)/.test(raw)) return "https://" + raw;

  // Fallback: treat as-is (unlikely, but preserves original intent)
  return raw;
}

/**
 * Build a single action button for a provided label and href.
 * Label is the JSON key with only the first character uppercased.
 * Buttons render only when href is a non-empty string.
 */
function linkBtn(label, href) {
  const normalized = normalizeHref(href);
  if (!normalized) return null;

  const a = document.createElement("a");
  a.className = "btn ghost";
  a.textContent = capFirst(label);  // first letter capitalized
  a.href = normalized;              // normalized absolute or intended relative
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.referrerPolicy = "no-referrer";
  return a;
}

/**
 * Highlight "(Spotlight)" or "Spotlight" in venue text with a yellow background.
 */
function highlightSpotlight(venueText) {
  const escaped = esc(venueText);
  // Wrap "Spotlight" (with or without parentheses) in a highlighted span
  return escaped.replace(
    /\(Spotlight\)|Spotlight/gi,
    '<span class="spotlight-highlight">$&</span>'
  );
}

/** Build the citation block in the order: Title → Authors → Venue → Year. */
function renderCitation(item) {
  const wrap = document.createElement("div");
  wrap.className = "cite-row";

  const title = document.createElement("div");
  title.className = "cite-title";
  title.innerHTML = esc(item.title || "");
  wrap.appendChild(title);

  const authors = document.createElement("div");
  authors.className = "cite-authors";
  authors.textContent = formatAuthors(item.authors || []);
  wrap.appendChild(authors);

  const meta = document.createElement("div");
  meta.className = "cite-meta";
  const venue = item.venue ? `<span class="cite-venue">${highlightSpotlight(item.venue)}</span>` : "";
  const year = item.year != null ? `<span class="cite-year">${item.year}</span>` : "";
  const sep = item.venue && (item.year != null) ? " · " : "";
  meta.innerHTML = `${venue}${sep}${year}`;
  wrap.appendChild(meta);

  return wrap;
}

/**
 * Create the <li> node with citation + action buttons.
 * Only render buttons for keys present in item.links with non-empty string values.
 * Button labels are derived from the exact JSON keys, with only the first letter uppercased.
 */
function createCitationLi(item) {
  const li = document.createElement("li");

  // Citation block
  li.appendChild(renderCitation(item));

  // Action buttons
  const links = (item && item.links && typeof item.links === "object") ? item.links : null;
  if (links) {
    const actions = document.createElement("div");
    actions.className = "cite-actions";

    for (const [label, href] of Object.entries(links)) {
      const btn = linkBtn(label, href);
      if (btn) actions.appendChild(btn);
    }

    if (actions.childElementCount > 0) {
      li.appendChild(actions);
    }
  }

  return li;
}

/** Fetch and render publications.json. */
async function renderPublications() {
  const list = document.getElementById("pubList");
  if (!list) return;

  try {
    const url = new URL("/static/data/publications.json", document.baseURI).toString();
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    /** @type {Array} */
    const pubs = await res.json();

    // Newest first; break ties by title
    pubs.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || String(a.title).localeCompare(String(b.title)));

    list.innerHTML = "";
    pubs.forEach(p => list.appendChild(createCitationLi(p)));
  } catch (err) {
    console.error("Failed to load publications:", err);
    const li = document.createElement("li");
    li.textContent = "Publications unavailable.";
    list.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", renderPublications);
