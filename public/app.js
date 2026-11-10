const catalog = document.querySelector("#catalog");
let items = [];
const requestedFilter = new URLSearchParams(location.search).get("category");
let activeFilter = ["app", "game"].includes(requestedFilter) ? requestedFilter : "all";

document.querySelectorAll(".filter").forEach((button) => {
  button.setAttribute("aria-pressed", String(button.dataset.filter === activeFilter));
});

function renderCatalog() {
  const visibleItems = items.filter(
    (item) => activeFilter === "all" || item.category === activeFilter,
  );
  catalog.replaceChildren();

  if (visibleItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const heading = document.createElement("strong");
    heading.textContent = items.length
      ? "Nothing in this category yet"
      : "The collection is getting ready";
    const message = document.createElement("span");
    message.textContent = items.length
      ? "Try another filter."
      : "Check back soon for new apps and games.";
    empty.append(heading, message);
    catalog.append(empty);
    return;
  }

  for (const item of visibleItems) {
    const card = document.createElement("article");
    card.className = "card";
    const top = document.createElement("div");
    top.className = "card-top";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item.category;
    const platform = document.createElement("span");
    platform.className = "platform";
    platform.textContent = item.platform;
    top.append(badge, platform);

    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description;
    const action = document.createElement("a");
    action.className = "download";
    if (item.playUrl || item.appUrl) {
      const isApp = Boolean(item.appUrl);
      const destination = new URL(item.appUrl || item.playUrl, document.baseURI);
      const allowedPath = new URL(isApp ? "./apps/" : "./games/", document.baseURI).pathname;
      if (destination.origin !== location.origin || !destination.pathname.startsWith(allowedPath)) {
        throw new Error(`Catalog contains an invalid ${isApp ? "app" : "game"} URL.`);
      }
      action.href = destination.href;
      action.textContent = isApp ? "Open app" : "Play now";
    } else {
      const releaseUrl = new URL(item.downloadUrl);
      if (
        releaseUrl.protocol !== "https:" ||
        releaseUrl.hostname !== "github.com" ||
        !releaseUrl.pathname.includes("/releases/download/")
      ) {
        throw new Error("Catalog contains an invalid release URL.");
      }
      action.href = releaseUrl.href;
      action.textContent = Number.isFinite(item.size) && item.size > 0
        ? `Download · ${(item.size / (1024 * 1024)).toFixed(1)} MB`
        : "Download";
    }
    card.append(top, title, description, action);
    catalog.append(card);
  }
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((filter) => {
      filter.setAttribute("aria-pressed", String(filter === button));
    });
    const url = new URL(location.href);
    if (activeFilter === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", activeFilter);
    history.replaceState(null, "", url);
    renderCatalog();
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

function renderRecentScores() {
  const scoreList = document.querySelector("#recent-scores");
  const emptyMessage = document.querySelector("#score-empty");
  const history = JSON.parse(localStorage.getItem("surgeai-recent-scores") || "[]");
  if (!Array.isArray(history)) throw new Error("Recent game scores are invalid.");
  const recent = history.slice(0, 15);
  scoreList.replaceChildren();
  emptyMessage.hidden = recent.length > 0;

  for (const result of recent) {
    const item = document.createElement("li");
    item.className = "score-entry";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = result.title;
    const outcome = document.createElement("span");
    const date = new Date(result.playedAt);
    outcome.textContent = `${result.outcome} · ${Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()}`;
    details.append(title, outcome);
    if (result.highScore) {
      const badge = document.createElement("span");
      badge.className = "score-badge";
      badge.textContent = "New high";
      details.append(badge);
    }
    const score = document.createElement("span");
    score.className = "score-value";
    score.textContent = result.scoreLabel;
    item.append(details, score);
    scoreList.append(item);
  }
}

renderRecentScores();
window.addEventListener("surgeai:scores-updated", renderRecentScores);
window.addEventListener("pageshow", renderRecentScores);

function renderRecentActivity() {
  const activityList = document.querySelector("#recent-activity");
  const emptyMessage = document.querySelector("#activity-empty");
  const history = JSON.parse(localStorage.getItem("surgeai-app-activity") || "[]");
  if (!Array.isArray(history)) throw new Error("Recent app activity is invalid.");
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = history.filter((entry) =>
    entry &&
    typeof entry.timestamp === "string" &&
    Date.parse(entry.timestamp) >= cutoff &&
    typeof entry.title === "string" &&
    typeof entry.detail === "string",
  );
  if (recent.length !== history.length) {
    localStorage.setItem("surgeai-app-activity", JSON.stringify(recent));
  }
  activityList.replaceChildren();
  emptyMessage.hidden = recent.length > 0;

  for (const activity of recent.slice(0, 15)) {
    const item = document.createElement("li");
    item.className = "activity-entry";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = activity.title;
    const description = document.createElement("span");
    description.textContent = activity.detail;
    details.append(title, description);
    const time = document.createElement("span");
    time.className = "activity-time";
    time.textContent = new Date(activity.timestamp).toLocaleString();
    item.append(details, time);
    activityList.append(item);
  }
}

renderRecentActivity();
window.addEventListener("surgeai:activity-updated", renderRecentActivity);
window.addEventListener("pageshow", renderRecentActivity);

fetch("./catalog.json?v=20261110-sections-1")
  .then((response) => {
    if (!response.ok) throw new Error("Catalog request failed.");
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data)) throw new Error("Catalog response is invalid.");
    items = data;
    renderCatalog();
  })
  .catch(() => {
    catalog.replaceChildren();
    const message = document.createElement("div");
    message.className = "empty";
    message.textContent =
      "The collection could not be loaded. Please try again later.";
    catalog.append(message);
  });
