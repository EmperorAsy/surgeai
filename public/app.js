const catalog = document.querySelector("#catalog");
let items = [];
let activeFilter = "all";

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
    const download = document.createElement("a");
    download.className = "download";
    const releaseUrl = new URL(item.downloadUrl);
    if (
      releaseUrl.protocol !== "https:" ||
      releaseUrl.hostname !== "github.com" ||
      !releaseUrl.pathname.includes("/releases/download/")
    ) {
      throw new Error("Catalog contains an invalid release URL.");
    }
    download.href = releaseUrl.href;
    download.textContent = Number.isFinite(item.size) && item.size > 0
      ? `Download · ${(item.size / (1024 * 1024)).toFixed(1)} MB`
      : "Download";
    card.append(top, title, description, download);
    catalog.append(card);
  }
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((filter) => {
      filter.setAttribute("aria-pressed", String(filter === button));
    });
    renderCatalog();
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
fetch("/catalog.json")
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
