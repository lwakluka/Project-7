/* ============ config & placeholders ============ */
const API_BASE = "https://youtube-search-and-download.p.rapidapi.com";
const RAPIDAPI_KEY = "e9920a5998msh40fe7569276b00bp1d407bjsna0c5ea60a69b";
const headers = {
  "x-rapidapi-key": RAPIDAPI_KEY,
  "x-rapidapi-host": "youtube-search-and-download.p.rapidapi.com",
};

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
       <rect width="100%" height="100%" fill="#0f0f0f"/>
       <text x="50%" y="50%" fill="#666" font-family="Plus Jakarta Sans, Arial" font-size="18" dominant-baseline="middle" text-anchor="middle">No thumbnail</text>
     </svg>`
  );

/* ============ DOM references ============ */
const resultsEl = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const miniToggle = document.getElementById("miniToggle"); // 

/* ============ network helpers ============ */
async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchJson error:", err);
    throw err;
  }
}

/* ============ fetch functions ============ */
async function fetchTrendingVideos() {
  const url = `${API_BASE}/search?query=trending&hl=en&gl=US`;
  try {
    showLoadingSkeleton();
    const data = await fetchJson(url, { headers });
    displayVideos(data);
  } catch (err) {
    displayEmptyVideos();
  }
}

async function searchVideos(query) {
  if (!query || !query.trim()) {
    fetchTrendingVideos();
    return;
  }
  const url = `${API_BASE}/search?query=${encodeURIComponent(
    query
  )}&hl=en&gl=US`;
  try {
    showLoadingSkeleton();
    const data = await fetchJson(url, { headers });
    displayVideos(data);
  } catch (err) {
    displayEmptyVideos();
  }
}

/* ============ rendering helpers ============ */
function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

function makeVideoCard(vid) {
  const thumbUrl = vid?.thumbnails?.[0]?.url ?? PLACEHOLDER;
  const channelIconUrl = vid?.channelThumbnail?.url || PLACEHOLDER;

  const card = document.createElement("div");
  card.className =
    "flex flex-col gap-2 hover:scale-[1.03] transition-all duration-200 rounded-xl cursor-pointer hover:bg-[#111] p-2";

  // Thumbnail
  const img = document.createElement("img");
  img.className = "rounded-lg w-full aspect-video object-cover";
  img.loading = "lazy";
  img.src = thumbUrl;
  img.alt = escapeHtml(vid?.title || "video thumbnail");
  img.addEventListener("error", () => {
    if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
  });

  // Title
  const title = document.createElement("h3");
  title.className =
    "text-white font-medium text-sm sm:text-base card-title line-clamp-2";
  title.textContent = vid?.title ?? "Untitled";

  // Meta row
  const meta = document.createElement("div");
  meta.className = "flex items-center gap-3";

  const avatar = document.createElement("img");
  avatar.className = "rounded-full w-8 h-8 object-cover";
  avatar.src = channelIconUrl;
  avatar.alt = escapeHtml(vid?.channelName || "channel");
  avatar.addEventListener("error", () => {
    if (avatar.src !== PLACEHOLDER) avatar.src = PLACEHOLDER;
  });

  const metaText = document.createElement("div");
  const channelNameEl = document.createElement("p");
  channelNameEl.className = "text-gray-400 text-sm";
  channelNameEl.textContent = vid?.channelName ?? "";

  const extraEl = document.createElement("p");
  extraEl.className = "text-gray-500 text-xs";
  extraEl.textContent = `${vid?.viewCountText ?? "Unknown views"} • ${
    vid?.publishedTimeText ?? ""
  }`;

  metaText.appendChild(channelNameEl);
  metaText.appendChild(extraEl);

  meta.appendChild(avatar);
  meta.appendChild(metaText);

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(meta);

  // open YouTube on click
  card.addEventListener("click", () => {
    if (vid?.videoId) {
      window.open(
        `https://www.youtube.com/watch?v=${encodeURIComponent(vid.videoId)}`,
        "_blank"
      );
    }
  });

  return card;
}

/* ============ display logic ============ */
function displayVideos(data) {
  resultsEl.innerHTML = "";
  if (!data || !Array.isArray(data.contents) || data.contents.length === 0) {
    displayEmptyVideos();
    return;
  }

  data.contents.forEach((item) => {
    const vid = item?.video;
    if (!vid || !vid.videoId) return;
    const card = makeVideoCard(vid);
    resultsEl.appendChild(card);
  });
}

function showLoadingSkeleton(count = 8) {
  resultsEl.innerHTML = "";
  Array.from({ length: count }).forEach(() => {
    const skel = document.createElement("div");
    skel.className =
      "flex flex-col animate-pulse gap-2 bg-[#111]/20 rounded-xl p-3";
    skel.innerHTML = `
      <div class="w-full h-40 bg-gray-700/20 rounded-md"></div>
      <div class="h-5 w-2/3 bg-gray-700/20 rounded"></div>
      <div class="flex items-center gap-3 mt-2">
        <div class="rounded-full h-8 w-8 bg-gray-700/20"></div>
        <div class="space-y-1">
          <div class="h-4 w-24 bg-gray-700/20 rounded"></div>
          <div class="h-3 w-20 bg-gray-700/20 rounded"></div>
        </div>
      </div>`;
    resultsEl.appendChild(skel);
  });
}

function displayEmptyVideos() {
  resultsEl.innerHTML = "";
  const info = document.createElement("div");
  info.className = "text-gray-400 col-span-full";
  info.textContent = "No videos available.";
  resultsEl.appendChild(info);
}

/* ============ events & sidebar behavior ============ */

// Search button & Enter key
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    searchVideos(searchInput?.value ?? "");
  });
}
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchVideos(e.target.value);
  });
}

// Mobile hamburger button opens sidebar (off-canvas)
if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// Mobile close button
if (closeSidebar && sidebar) {
  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
}

// Mini toggle (desktop) - toggles persistent expanded state and updates icon
if (miniToggle && sidebar) {
  miniToggle.addEventListener("click", () => {
    sidebar.classList.toggle("expanded");
    // update chevron icon direction
    const icon = miniToggle.querySelector("ion-icon");
    if (!icon) return;
    if (sidebar.classList.contains("expanded")) {
      icon.setAttribute("name", "chevron-forward-outline");
    } else {
      icon.setAttribute("name", "chevron-back-outline");
    }
  });
}

// Click outside closes off-canvas sidebar on mobile
document.addEventListener("click", (e) => {
  if (!sidebar) return;
  if (window.innerWidth < 768 && sidebar.classList.contains("open")) {
    const isInside =
      sidebar.contains(e.target) || (menuBtn && menuBtn.contains(e.target));
    if (!isInside) sidebar.classList.remove("open");
  }
});

window.addEventListener("resize", () => {
  if (!sidebar) return;
  if (window.innerWidth >= 768) sidebar.classList.remove("open");
});

/* ============ init ============ */
window.addEventListener("load", () => {
  fetchTrendingVideos();
});
