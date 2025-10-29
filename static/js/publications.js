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
  
  /** Build a single, stateful action button for a link type. */
  function linkBtn(type, href) {
    const labels = { manuscript: "Manuscript", presentation: "Presentation", video: "Video", blog: "Blog" };
    const label = labels[type] || type;
    const a = document.createElement("a");
    a.className = "btn ghost";
    a.textContent = label;
  
    if (href) {
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.classList.add("disabled");
      a.setAttribute("aria-disabled", "true");
      a.tabIndex = -1;
    }
    return a;
  }
  
  /** Build the citation block in the requested order: Title → Authors → Venue → Year. */
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
    const venue = item.venue ? `<span class="cite-venue">${esc(item.venue)}</span>` : "";
    const year = item.year != null ? `<span class="cite-year">${item.year}</span>` : "";
    const sep = item.venue && (item.year != null) ? " · " : "";
    meta.innerHTML = `${venue}${sep}${year}`;
    wrap.appendChild(meta);
  
    return wrap;
  }
  
  /** Create the <li> node with citation + action buttons. */
  function createCitationLi(item) {
    const li = document.createElement("li");
  
    // Citation block
    li.appendChild(renderCitation(item));
  
    // Action buttons
    const actions = document.createElement("div");
    actions.className = "cite-actions";
    const links = item.links || {};
    actions.appendChild(linkBtn("manuscript", links.manuscript));
    actions.appendChild(linkBtn("presentation", links.presentation));
    actions.appendChild(linkBtn("video", links.video));
    actions.appendChild(linkBtn("blog", links.blog));
    li.appendChild(actions);
  
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
  
      // Optional: stable order in file is respected. To show newest first, uncomment:
      // pubs.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || String(a.title).localeCompare(String(b.title)));
  
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
  