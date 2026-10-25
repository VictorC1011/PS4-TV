(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const state = {
    categories: [],
    channels: [],
    categoryId: 0,
    favoritesOnly: false,
    favorites: new Set(readStorage("ps4tv-favorites", [])),
    currentChannel: null,
    toastTimer: null
  };

  const categoryNav = $("#categoryNav");
  const channelGrid = $("#channelGrid");
  const searchInput = $("#searchInput");
  const playerView = $("#playerView");
  const homeView = $("#homeView");
  const channelFrame = $("#channelFrame");

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function getCategoryName(ids) {
    const category = state.categories.find((item) => ids.includes(item.id) && item.id !== 0);
    return category ? category.name : "Canal";
  }

  function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  async function init() {
    try {
      const response = await fetch("./channels.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar channels.json");
      const data = await response.json();
      state.categories = Array.isArray(data.categories) ? data.categories : [];
      state.channels = Array.isArray(data.channels) ? data.channels : [];
      renderCategories();
      renderChannels();
      renderRecent();
      $("#channelCount").textContent = `${state.channels.length} canais`;
      $("#footerStatus").textContent = "Lista carregada";
    } catch (error) {
      $("#channelGrid").innerHTML = "";
      $("#emptyState").classList.remove("hidden");
      $("#emptyState h2").textContent = "Não foi possível carregar os canais";
      $("#emptyState p").textContent = "Confira se channels.json está na mesma pasta do index.html.";
      $("#footerStatus").textContent = "Erro ao carregar";
      console.error(error);
    }
  }

  function renderCategories() {
    const icons = ["▦", "◉", "⚽", "▣", "▤", "▶", "◈", "▣", "✦", "◎"];
    const categories = state.categories.length ? state.categories : [{ id: 0, name: "Todos" }];
    categoryNav.innerHTML = categories.map((category, index) => `
      <button class="category-button ${Number(category.id) === Number(state.categoryId) ? "active" : ""}"
        data-category="${escapeText(category.id)}" type="button">
        <span>${icons[index % icons.length]}</span>${escapeText(category.name)}
      </button>`).join("");
  }

  function getVisibleChannels() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    return state.channels.filter((channel) => {
      const matchesCategory = Number(state.categoryId) === 0 ||
        (Array.isArray(channel.categories) && channel.categories.map(Number).includes(Number(state.categoryId)));
      const matchesSearch = !query || String(channel.name || "").toLocaleLowerCase("pt-BR").includes(query);
      const matchesFavorites = !state.favoritesOnly || state.favorites.has(String(channel.id));
      return matchesCategory && matchesSearch && matchesFavorites;
    });
  }

  function channelCard(channel, compact = false) {
    const favorite = state.favorites.has(String(channel.id));
    const logo = channel.image ? escapeText(channel.image) : "";
    return `<button class="channel-card" type="button" data-channel="${escapeText(channel.id)}" aria-label="Abrir ${escapeText(channel.name)}">
      <div class="channel-art">
        ${logo ? `<img src="${logo}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` : ""}
        <span class="fallback-logo" ${logo ? 'style="display:none"' : ""}>${escapeText(shortName(channel.name))}</span>
        <span class="favorite-star ${favorite ? "is-favorite" : ""}" data-favorite="${escapeText(channel.id)}" role="button" tabindex="0" aria-label="${favorite ? "Remover dos" : "Adicionar aos"} favoritos" title="Favorito">${favorite ? "★" : "☆"}</span>
      </div>
      <div class="card-copy"><span class="card-name">${escapeText(channel.name)}</span><span class="card-category">${escapeText(getCategoryName(channel.categories || []))}</span></div>
    </button>`;
  }

  function shortName(name) {
    const cleaned = String(name || "TV").replace(/\s*[-–].*$/, "").trim();
    return cleaned.length > 15 ? cleaned.slice(0, 14) + "…" : cleaned || "TV";
  }

  function renderChannels() {
    const visible = getVisibleChannels();
    const category = state.categories.find((item) => Number(item.id) === Number(state.categoryId));
    $("#sectionTitle").textContent = state.favoritesOnly ? "Seus favoritos" : (category ? category.name : "Todos os canais");
    $("#sectionSubtitle").textContent = state.favoritesOnly
      ? "Seus canais salvos para encontrar mais rápido."
      : "Escolha um canal para começar a assistir.";
    $("#gridHeading").textContent = searchInput.value.trim() ? "Resultados da busca" : (state.favoritesOnly ? "Favoritos" : "Canais");
    $("#gridMeta").textContent = `${visible.length} ${visible.length === 1 ? "CANAL" : "CANAIS"}`;
    $("#channelCount").textContent = `${visible.length} de ${state.channels.length}`;
    channelGrid.innerHTML = visible.map((channel) => channelCard(channel)).join("");
    $("#emptyState").classList.toggle("hidden", visible.length > 0);
    channelGrid.classList.toggle("hidden", visible.length === 0);
    renderCategories();
  }

  function renderRecent() {
    const recentId = readStorage("ps4tv-last-channel", null);
    const channel = state.channels.find((item) => String(item.id) === String(recentId));
    if (!channel) return;
    $("#recentSection").classList.remove("hidden");
    $("#recentCard").innerHTML = channelCard(channel, true);
  }

  function toggleFavorite(id) {
    const key = String(id);
    if (state.favorites.has(key)) {
      state.favorites.delete(key);
      notify("Canal removido dos favoritos");
    } else {
      state.favorites.add(key);
      notify("Canal adicionado aos favoritos");
    }
    saveStorage("ps4tv-favorites", [...state.favorites]);
    renderChannels();
    renderRecent();
  }

  function openChannel(id) {
    const channel = state.channels.find((item) => String(item.id) === String(id));
    if (!channel || !channel.url) {
      notify("Esse canal não possui uma URL válida.");
      return;
    }
    state.currentChannel = channel;
    homeView.classList.add("hidden");
    playerView.classList.remove("hidden");
    $("#playerChannelName").textContent = channel.name;
    $("#playerInfoName").textContent = channel.name;
    $("#footerStatus").textContent = "Reprodução selecionada";
    $("#playerPlaceholder").style.display = "flex";
    channelFrame.src = "about:blank";
    // A URL do fornecedor é carregada em iframe. Alguns sites bloqueiam incorporação;
    // nesse caso, o botão "Abrir link" oferece a página original em uma nova aba.
    setTimeout(() => { channelFrame.src = channel.url; }, 50);
    saveStorage("ps4tv-last-channel", channel.id);
    renderRecent();
    document.title = `${channel.name} — PS4 TV`;
    $("#backButton").focus();
    setTimeout(() => { $("#playerPlaceholder").style.display = "none"; }, 7000);
  }

  function closePlayer() {
    channelFrame.src = "about:blank";
    playerView.classList.add("hidden");
    homeView.classList.remove("hidden");
    $("#footerStatus").textContent = "Pronto";
    document.title = "PS4 TV";
    const focused = document.querySelector(`.channel-card[data-channel="${CSS.escape(String(state.currentChannel?.id ?? ""))}"]`);
    if (focused) focused.focus();
    else $("#searchInput").focus();
  }

  categoryNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.categoryId = Number(button.dataset.category);
    state.favoritesOnly = false;
    $("#favoritesToggle").setAttribute("aria-pressed", "false");
    renderChannels();
  });

  document.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      event.stopPropagation();
      toggleFavorite(favorite.dataset.favorite);
      return;
    }
    const card = event.target.closest("[data-channel]");
    if (card) openChannel(card.dataset.channel);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== searchInput) {
      event.preventDefault();
      searchInput.focus();
      return;
    }
    if (event.key === "Escape" || event.key.toLowerCase() === "o") {
      if (!playerView.classList.contains("hidden")) {
        event.preventDefault();
        closePlayer();
      } else if (document.activeElement === searchInput) {
        searchInput.value = "";
        searchInput.blur();
        renderChannels();
      }
      return;
    }
    if (event.key === "Enter" && event.target.matches("[data-favorite]")) {
      event.preventDefault();
      toggleFavorite(event.target.dataset.favorite);
      return;
    }
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key) &&
        document.activeElement.matches(".channel-card, .category-button, #backButton, #openExternalButton")) {
      const focusables = [...document.querySelectorAll(
        playerView.classList.contains("hidden")
          ? ".category-button:not(.hidden), .channel-card, #favoritesToggle, #searchInput"
          : "#backButton, #openExternalButton"
      )].filter((element) => element.offsetParent !== null);
      const current = focusables.indexOf(document.activeElement);
      if (current < 0) return;
      // Let the browser's native focus behavior work where possible; this is a fallback
      // for TV browsers with limited directional focus navigation.
      const direction = event.key;
      const currentRect = focusables[current].getBoundingClientRect();
      const candidates = focusables.map((element, index) => {
        if (index === current) return null;
        const rect = element.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - (currentRect.left + currentRect.width / 2);
        const dy = rect.top + rect.height / 2 - (currentRect.top + currentRect.height / 2);
        const valid = direction === "ArrowRight" ? dx > 4 :
          direction === "ArrowLeft" ? dx < -4 :
          direction === "ArrowDown" ? dy > 4 : dy < -4;
        if (!valid) return null;
        const primary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx);
        return { element, score: primary + secondary * 2.3 };
      }).filter(Boolean).sort((a, b) => a.score - b.score);
      if (candidates.length) {
        event.preventDefault();
        candidates[0].element.focus();
      }
    }
  });

  searchInput.addEventListener("input", renderChannels);
  $("#favoritesToggle").addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    $("#favoritesToggle").setAttribute("aria-pressed", String(state.favoritesOnly));
    if (state.favoritesOnly) state.categoryId = 0;
    renderChannels();
  });
  $("#backButton").addEventListener("click", closePlayer);
  $("#openExternalButton").addEventListener("click", () => {
    if (state.currentChannel?.url) {
      const opened = window.open(state.currentChannel.url, "_blank", "noopener");
      if (!opened) notify("O navegador bloqueou a nova aba. Tente novamente pelo botão.");
    }
  });

  init();
})();