(() => {
  "use strict";

  const words = window.COCA_WORDS || [];
  const meta = window.COCA_META || {};
  const bands = meta.bands || [];
  const registers = meta.registers || [];
  const posLabels = meta.posLabels || {};
  const bandMap = new Map(bands.map((band) => [band.id, band]));
  const wordByRank = new Map(words.map((word) => [word.rank, word]));
  const PAGE_SIZE = 60;
  const STORAGE_KEY = "coca-progress-v1";
  const RATE_STEPS = [0.65, 0.8, 1];
  const FUNCTION_POS = new Set(["i", "p", "c", "d", "m", "u", "a", "t", "x", "e"]);
  const BAND_COLORS = {
    core: "var(--rust)",
    daily: "var(--moss)",
    everyday: "var(--gold)",
    working: "var(--blue)",
    advanced: "var(--plum)",
    extended: "#776554",
  };

  const elements = {
    bandPills: document.getElementById("band-pills"),
    posPills: document.getElementById("pos-pills"),
    collectionPills: document.getElementById("collection-pills"),
    search: document.getElementById("word-search"),
    sort: document.getElementById("sort-select"),
    listenAll: document.getElementById("listen-all"),
    listenDock: document.getElementById("listen-dock"),
    listenStateLabel: document.getElementById("listen-state-label"),
    listenPositionHead: document.getElementById("listen-position-head"),
    listenScene: document.getElementById("listen-scene"),
    listenWordCount: document.getElementById("listen-word-count"),
    listenStar: document.getElementById("listen-star"),
    listenStarLabel: document.getElementById("listen-star-label"),
    listenMastery: document.getElementById("listen-mastery"),
    listenMasteryLabel: document.getElementById("listen-mastery-label"),
    listenEn: document.getElementById("listen-en"),
    listenZh: document.getElementById("listen-zh"),
    listenScrubber: document.getElementById("listen-scrubber"),
    listenToggle: document.getElementById("listen-toggle"),
    listenMiniToggle: document.getElementById("listen-mini-toggle"),
    listenPrev: document.getElementById("listen-prev"),
    listenNext: document.getElementById("listen-next"),
    listenCollapse: document.getElementById("listen-collapse"),
    listenClose: document.getElementById("listen-close"),
    listenJump: document.getElementById("listen-jump"),
    sectionTitle: document.getElementById("section-title"),
    sectionKicker: document.getElementById("section-kicker"),
    resultCount: document.getElementById("result-count"),
    bandIntro: document.getElementById("band-intro"),
    bandIntroText: document.getElementById("band-intro-text"),
    grid: document.getElementById("word-grid"),
    emptyState: document.getElementById("empty-state"),
    resetFilters: document.getElementById("reset-filters"),
    loadMoreWrap: document.getElementById("load-more-wrap"),
    loadMore: document.getElementById("load-more"),
    loadCount: document.getElementById("load-count"),
    masteredStat: document.getElementById("mastered-stat"),
    lemmaStat: document.getElementById("lemma-stat"),
    heroProgressBar: document.getElementById("hero-progress-bar"),
    heroProgressText: document.getElementById("hero-progress-text"),
    browseWords: document.getElementById("browse-words"),
    randomWord: document.getElementById("random-word"),
    themeButton: document.getElementById("theme-button"),
    voiceButton: document.getElementById("voice-button"),
    voiceLabel: document.getElementById("voice-label"),
    rateButton: document.getElementById("rate-button"),
    rateLabel: document.getElementById("rate-label"),
    spotlightDate: document.getElementById("spotlight-date"),
    spotlightRank: document.getElementById("spotlight-rank"),
    spotlightWord: document.getElementById("spotlight-word"),
    spotlightPos: document.getElementById("spotlight-pos"),
    spotlightFrequency: document.getElementById("spotlight-frequency"),
    spotlightZh: document.getElementById("spotlight-zh"),
    spotlightRegister: document.getElementById("spotlight-register"),
    spotlightPlay: document.getElementById("spotlight-play"),
    spotlightOpen: document.getElementById("spotlight-open"),
    detailModal: document.getElementById("detail-modal"),
    detailPanel: document.querySelector(".detail-panel"),
    detailClose: document.getElementById("detail-close"),
    detailRank: document.getElementById("detail-rank"),
    detailBand: document.getElementById("detail-band"),
    detailWord: document.getElementById("detail-word"),
    detailPos: document.getElementById("detail-pos"),
    detailFrequency: document.getElementById("detail-frequency"),
    detailZh: document.getElementById("detail-zh"),
    detailPlay: document.getElementById("detail-play"),
    detailPerMillion: document.getElementById("detail-per-million"),
    detailCoverage: document.getElementById("detail-coverage"),
    detailDispersion: document.getElementById("detail-dispersion"),
    registerChart: document.getElementById("register-chart"),
    definitionBox: document.getElementById("definition-box"),
    cambridgeLink: document.getElementById("cambridge-link"),
    youglishLink: document.getElementById("youglish-link"),
    detailStar: document.getElementById("detail-star"),
    detailStarLabel: document.getElementById("detail-star-label"),
    detailMastery: document.getElementById("detail-mastery"),
    detailMasteryLabel: document.getElementById("detail-mastery-label"),
    wordPractice: document.getElementById("word-practice"),
    practiceModal: document.getElementById("word-practice-modal"),
    practicePanel: document.querySelector(".word-practice-panel"),
    practiceClose: document.getElementById("practice-close"),
    practiceIndex: document.getElementById("practice-index"),
    practiceTotal: document.getElementById("practice-total"),
    practiceProgressBar: document.getElementById("practice-progress-bar"),
    practiceStage: document.getElementById("practice-stage"),
    practiceBand: document.getElementById("practice-band"),
    practicePos: document.getElementById("practice-pos"),
    practiceFrequency: document.getElementById("practice-frequency"),
    practiceInstruction: document.getElementById("practice-instruction"),
    practiceZhHint: document.getElementById("practice-zh-hint"),
    practicePlay: document.getElementById("practice-play"),
    practiceInput: document.getElementById("practice-input"),
    practiceAnswer: document.getElementById("practice-answer"),
    practiceAnswerWord: document.getElementById("practice-answer-word"),
    practiceAnswerMeta: document.getElementById("practice-answer-meta"),
    practiceAnswerZh: document.getElementById("practice-answer-zh"),
    practiceFeedback: document.getElementById("practice-feedback"),
    practiceCheck: document.getElementById("practice-check"),
    practiceRatings: document.getElementById("practice-ratings"),
    practiceAgain: document.getElementById("practice-again"),
    practiceKnown: document.getElementById("practice-known"),
    practicePrev: document.getElementById("practice-prev"),
    practiceNext: document.getElementById("practice-next"),
    practiceActions: document.getElementById("practice-actions"),
    practiceFooter: document.querySelector(".word-practice-footer"),
    practiceComplete: document.getElementById("practice-complete"),
    completeTotal: document.getElementById("complete-total"),
    completeMastered: document.getElementById("complete-mastered"),
    practiceRestart: document.getElementById("practice-restart"),
    practiceDone: document.getElementById("practice-done"),
    resetProgress: document.getElementById("reset-progress"),
    toast: document.getElementById("toast"),
  };

  const state = {
    band: "all",
    pos: "all",
    collection: "all",
    query: "",
    sort: "rank",
    visible: PAGE_SIZE,
    detailRank: null,
    listen: null,
    practice: null,
  };

  let progress = loadProgress();
  let searchTimer = 0;
  let toastTimer = 0;
  let lastFocusedElement = null;
  let voices = [];
  let speakingButton = null;
  let definitionToken = 0;

  function loadProgress() {
    const fallback = {
      starred: [],
      mastered: [],
      studyDates: [],
      voiceLang: "en-US",
      rate: 0.8,
    };

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        starred: Array.isArray(saved.starred)
          ? [...new Set(saved.starred.map(Number).filter((rank) => wordByRank.has(rank)))]
          : [],
        mastered: Array.isArray(saved.mastered)
          ? [...new Set(saved.mastered.map(Number).filter((rank) => wordByRank.has(rank)))]
          : [],
        studyDates: Array.isArray(saved.studyDates)
          ? [...new Set(saved.studyDates.filter((date) => typeof date === "string"))].slice(-90)
          : [],
        voiceLang: saved.voiceLang === "en-GB" ? "en-GB" : "en-US",
        rate: RATE_STEPS.includes(Number(saved.rate)) ? Number(saved.rate) : 0.8,
      };
    } catch {
      return fallback;
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      showToast("浏览器没有允许保存进度");
    }
  }

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function recordStudyDate() {
    const today = dateKey();
    if (!progress.studyDates.includes(today)) {
      progress.studyDates.push(today);
      progress.studyDates = progress.studyDates.slice(-90);
      saveProgress();
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(text, query) {
    const safeText = escapeHTML(text);
    const term = query.trim();
    if (!term) return safeText;
    return safeText.replace(
      new RegExp(`(${escapeRegExp(term)})`, "gi"),
      "<mark>$1</mark>",
    );
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function formatNumber(value, digits = 0) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function getBand(rank) {
    return bands.find((band) => rank >= band.min && rank <= band.max) || bands.at(-1);
  }

  function getBandColor(rank) {
    return BAND_COLORS[getBand(rank)?.id] || "var(--blue)";
  }

  function posName(pos) {
    return posLabels[pos]?.zh || pos.toUpperCase();
  }

  function registerName(id) {
    return registers.find((register) => register.id === id)?.zh || id;
  }

  function maxRegister(word) {
    return Math.max(...registers.map((register) => Number(word.registers[register.id]) || 0), 1);
  }

  function registerLevels(word) {
    const max = maxRegister(word);
    return Object.fromEntries(
      registers.map((register) => [
        register.id,
        Math.max(3, Math.round((Number(word.registers[register.id]) || 0) / max * 100)),
      ]),
    );
  }

  function getFilteredWords() {
    const starred = new Set(progress.starred);
    const mastered = new Set(progress.mastered);
    const query = state.query.trim().toLowerCase();
    const band = state.band === "all" ? null : bandMap.get(state.band);

    const filtered = words.filter((word) => {
      if (band && (word.rank < band.min || word.rank > band.max)) return false;
      if (state.pos === "function" && !FUNCTION_POS.has(word.pos)) return false;
      if (state.pos !== "all" && state.pos !== "function" && word.pos !== state.pos) return false;
      if (state.collection === "mastered" && !mastered.has(word.rank)) return false;
      if (state.collection === "learning" && mastered.has(word.rank)) return false;
      if (state.collection === "starred" && !starred.has(word.rank)) return false;
      if (query && !`${word.word} ${word.zh}`.toLowerCase().includes(query)) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (state.sort === "alpha") return a.word.localeCompare(b.word) || a.rank - b.rank;
      if (state.sort === "dispersion") {
        return (b.dispersion ?? -1) - (a.dispersion ?? -1) || a.rank - b.rank;
      }
      if (state.sort === "coverage") return b.coverage - a.coverage || a.rank - b.rank;
      return a.rank - b.rank;
    });
  }

  function renderBandPills() {
    const items = [
      `<button class="band-pill active" type="button" data-band="all">全部<sup>5000</sup></button>`,
      ...bands.map((band) => {
        const count = band.max - band.min + 1;
        return `<button class="band-pill" type="button" data-band="${band.id}">${escapeHTML(band.zh)}<sup>${count}</sup></button>`;
      }),
    ];
    elements.bandPills.innerHTML = items.join("");
  }

  function renderCard(word, index) {
    const band = getBand(word.rank);
    const color = getBandColor(word.rank);
    const levels = registerLevels(word);
    const dispersion = word.dispersion === null ? "—" : word.dispersion.toFixed(2);
    const classes = ["word-card"];
    if (progress.starred.includes(word.rank)) classes.push("is-starred");
    if (progress.mastered.includes(word.rank)) classes.push("is-mastered");

    return `
      <article
        class="${classes.join(" ")}"
        data-rank="${word.rank}"
        style="--band-color: ${color}; --card-index: ${index % 24}"
        aria-label="第 ${word.rank} 名，${escapeHTML(word.word)}"
      >
        <div class="card-topline">
          <span class="rank-label">#${String(word.rank).padStart(4, "0")}</span>
          <span class="band-badge">${escapeHTML(band.zh)}</span>
        </div>
        <div class="word-main">
          <button class="word-open" type="button" data-action="detail" aria-label="查看 ${escapeHTML(word.word)} 的详情">
            <span class="word" lang="en">${highlight(word.word, state.query)}</span>
          </button>
          <div class="word-subline">
            <span class="pos-badge">${escapeHTML(posName(word.pos))}</span>
            <span>${formatNumber(word.perMillion, word.perMillion < 100 ? 1 : 0)} / 百万词</span>
          </div>
          <p class="word-zh" lang="zh-CN">${highlight(word.zh, state.query)}</p>
          <p class="word-context">
            <strong>${escapeHTML(registerName(word.topRegister))}</strong> 最常出现
            · 离散度 ${dispersion} · 覆盖 ${word.coverage.toFixed(1)}%
          </p>
        </div>
        <div class="register-strip" aria-hidden="true">
          ${registers.map((register) => `<span style="--level: ${levels[register.id]}" title="${escapeHTML(register.zh)}"></span>`).join("")}
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <button class="card-icon-button play-word" type="button" data-action="play" aria-label="播放 ${escapeHTML(word.word)}" title="播放读音">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9.2 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
              </svg>
              <span class="sound-wave" aria-hidden="true"><i></i><i></i><i></i></span>
            </button>
            <button class="card-icon-button card-star" type="button" data-action="star" aria-label="${progress.starred.includes(word.rank) ? "取消收藏" : "收藏"} ${escapeHTML(word.word)}" aria-pressed="${progress.starred.includes(word.rank)}" title="收藏">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m12 3.7 2.56 5.18 5.72.83-4.14 4.04.98 5.7L12 16.76l-5.12 2.69.98-5.7-4.14-4.04 5.72-.83L12 3.7Z" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="card-icon-button card-mastery" type="button" data-action="mastery" aria-label="${progress.mastered.includes(word.rank) ? "取消掌握标记" : "标记掌握"} ${escapeHTML(word.word)}" aria-pressed="${progress.mastered.includes(word.rank)}" title="标记掌握">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.4" />
                <path d="m8.3 12.2 2.4 2.4 5.2-5.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <button class="card-open-button" type="button" data-action="detail">
            词频详情 <span aria-hidden="true">↗</span>
          </button>
        </div>
      </article>
    `;
  }

  function updateHeading(filtered) {
    const band = bandMap.get(state.band);
    let title = "全部词汇";
    let kicker = "The frequency library";

    if (state.collection === "starred") {
      title = "我的收藏";
      kicker = "Saved words";
    } else if (state.collection === "mastered") {
      title = "已经掌握";
      kicker = "Mastered words";
    } else if (state.collection === "learning") {
      title = "待掌握";
      kicker = "Still learning";
    } else if (band) {
      title = band.zh;
      kicker = `${band.en} band · #${band.min}–${band.max}`;
    }

    elements.sectionTitle.textContent = title;
    elements.sectionKicker.textContent = kicker;
    elements.resultCount.textContent = `${filtered.length} 条`;
    elements.bandIntro.hidden = !band || state.collection !== "all" || Boolean(state.query);
    elements.bandIntroText.textContent = band
      ? `COCA 排名 #${band.min}–${band.max}，每一条都保留原始词性与语域分布。`
      : "";
  }

  function renderWords() {
    const filtered = getFilteredWords();
    const visible = filtered.slice(0, state.visible);
    elements.grid.innerHTML = visible.map(renderCard).join("");
    elements.grid.hidden = filtered.length === 0;
    elements.emptyState.hidden = filtered.length !== 0;
    elements.loadMoreWrap.hidden = filtered.length <= visible.length;
    elements.loadCount.textContent = filtered.length > visible.length
      ? `${visible.length} / ${filtered.length}`
      : "";
    updateHeading(filtered);
    updateProgressUI();
    syncListeningCardHighlight();
  }

  function updateProgressUI() {
    const mastered = progress.mastered.length;
    const percentage = mastered / Math.max(words.length, 1) * 100;
    elements.masteredStat.textContent = mastered.toLocaleString("zh-CN");
    elements.lemmaStat.textContent = formatNumber(meta.uniqueLemmas || 0);
    elements.heroProgressBar.style.width = `${percentage}%`;
    if (!mastered) {
      elements.heroProgressText.textContent = "从最高频的 the 开始";
    } else if (mastered >= words.length) {
      elements.heroProgressText.textContent = "5000 个词频条目都已标记掌握";
    } else {
      elements.heroProgressText.textContent = `已掌握 ${percentage.toFixed(1)}%，还差 ${words.length - mastered} 条`;
    }
  }

  function resetVisibleAndRender() {
    state.visible = PAGE_SIZE;
    renderWords();
  }

  function toggleStar(rank) {
    const sentence = wordByRank.get(rank);
    if (!sentence) return;
    const set = new Set(progress.starred);
    if (set.has(rank)) {
      set.delete(rank);
      showToast("已取消收藏");
    } else {
      set.add(rank);
      showToast("已加入收藏");
    }
    progress.starred = [...set];
    saveProgress();
    renderWords();
    if (state.detailRank === rank) renderDetailState();
    if (state.listen) renderListeningDock();
  }

  function setMastered(rank, value) {
    const word = wordByRank.get(rank);
    if (!word) return;
    const set = new Set(progress.mastered);
    const existed = set.has(rank);
    if (value) set.add(rank);
    else set.delete(rank);
    progress.mastered = [...set];
    saveProgress();
    renderWords();
    if (state.detailRank === rank) renderDetailState();
    if (state.listen) renderListeningDock();
    if (!existed && value) showToast("已标记掌握");
    if (existed && !value) showToast("已移回待掌握");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2100);
  }

  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    voices = window.speechSynthesis.getVoices();
  }

  function findVoice(lang) {
    return window.ReflexSpeech?.pickVoice(voices, lang) || null;
  }

  function clearSpeakingState() {
    if (speakingButton) speakingButton.classList.remove("is-speaking");
    speakingButton = null;
    document.querySelectorAll(".is-speaking").forEach((button) => button.classList.remove("is-speaking"));
  }

  function createUtterance(textValue) {
    if (!voices.length) loadVoices();
    const utterance = new SpeechSynthesisUtterance(textValue);
    utterance.lang = progress.voiceLang;
    utterance.rate = progress.rate;
    utterance.pitch = 1;
    const voice = findVoice(progress.voiceLang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    return utterance;
  }

  function speak(textValue, button = null) {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持语音朗读");
      return;
    }
    if (state.listen) stopListening();
    window.speechSynthesis.cancel();
    clearSpeakingState();
    const utterance = createUtterance(textValue);
    if (button) {
      speakingButton = button;
      button.classList.add("is-speaking");
    }
    utterance.onend = clearSpeakingState;
    utterance.onerror = (event) => {
      clearSpeakingState();
      if (event.error === "canceled" || event.error === "interrupted") return;
      showToast(
        window.ReflexSpeech?.errorMessage(event.error) ||
          "朗读没有成功，请再试一次",
      );
    };
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  }

  function startListening() {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持连续朗读");
      return;
    }
    loadVoices();
    if (!voices.some((voice) => voice.lang.toLowerCase().startsWith("en") && voice.localService)) {
      showToast("未检测到本地英文语音，Windows 请在系统中安装英文语音包");
    }
    if (state.listen) {
      elements.listenDock.hidden = false;
      if (!state.listen.playing) toggleListening();
      return;
    }
    if (state.practice) closePractice();
    window.speechSynthesis.cancel();
    clearSpeakingState();
    state.listen = {
      queue: words.map((word) => word.rank),
      index: 0,
      playing: true,
      finished: false,
      collapsed: false,
      scrubbing: false,
      scrubResume: false,
      utterance: null,
      timer: 0,
    };
    window.ReflexPlayback?.setActive(true);
    elements.listenDock.hidden = false;
    playListeningWord();
    if (window.matchMedia("(pointer: coarse)").matches) {
      showToast("已尝试保持屏幕常亮；息屏后部分手机仍会暂停语音");
    }
  }

  function renderListeningDock() {
    const listen = state.listen;
    if (!listen) return;
    const word = wordByRank.get(listen.queue[listen.index]);
    if (!word) return;
    const band = getBand(word.rank);
    const color = getBandColor(word.rank);
    const total = listen.queue.length;
    const position = `${String(word.rank).padStart(4, "0")} / ${total}`;
    const starred = progress.starred.includes(word.rank);
    const mastered = progress.mastered.includes(word.rank);

    elements.listenDock.classList.toggle("is-playing", listen.playing && !listen.finished);
    elements.listenDock.classList.toggle("is-collapsed", listen.collapsed);
    elements.listenStateLabel.textContent = listen.scrubbing
      ? "正在定位"
      : listen.finished
        ? "全部听完"
        : listen.playing
          ? "正在播放"
          : "已暂停";
    elements.listenPositionHead.textContent = position;
    elements.listenScene.textContent = band.zh;
    elements.listenScene.style.setProperty("--band-color", color);
    elements.listenWordCount.textContent =
      `${posName(word.pos)} · ${formatNumber(word.perMillion, 1)} / 百万词`;
    elements.listenStar.classList.toggle("is-active", starred);
    elements.listenStar.setAttribute("aria-pressed", String(starred));
    elements.listenStarLabel.textContent = starred ? "已收藏" : "收藏";
    elements.listenMastery.classList.toggle("is-active", mastered);
    elements.listenMastery.setAttribute("aria-pressed", String(mastered));
    elements.listenMasteryLabel.textContent = mastered ? "已掌握" : "标记掌握";
    elements.listenEn.textContent = word.word;
    elements.listenZh.textContent = word.zh;
    const progressPercent = ((listen.index + 1) / total) * 100;
    elements.listenScrubber.max = String(total);
    elements.listenScrubber.value = String(listen.index + 1);
    elements.listenScrubber.style.setProperty("--listen-progress", `${progressPercent}%`);
    elements.listenScrubber.setAttribute(
      "aria-valuetext",
      `第 ${word.rank} 名，${word.word}，${posName(word.pos)}`,
    );
    elements.listenToggle.setAttribute(
      "aria-label",
      listen.playing ? "暂停连续播放" : "继续连续播放",
    );
    elements.listenMiniToggle.setAttribute(
      "aria-label",
      listen.playing ? "暂停连续播放" : "继续连续播放",
    );
    elements.listenCollapse.setAttribute("aria-expanded", String(!listen.collapsed));
    syncListeningCardHighlight();
  }

  function syncListeningCardHighlight() {
    document.querySelectorAll(".word-card.is-now-playing").forEach((card) => {
      card.classList.remove("is-now-playing");
    });
    const listen = state.listen;
    if (!listen) return;
    const word = wordByRank.get(listen.queue[listen.index]);
    document.querySelector(`.word-card[data-rank="${word?.rank}"]`)?.classList.add("is-now-playing");
  }

  function playListeningWord() {
    const listen = state.listen;
    if (!listen || !listen.playing) return;
    listen.scrubbing = false;
    const word = wordByRank.get(listen.queue[listen.index]);
    if (!word) return;
    window.clearTimeout(listen.timer);
    listen.utterance = null;
    window.speechSynthesis.cancel();
    clearSpeakingState();
    const utterance = createUtterance(word.word);
    listen.utterance = utterance;
    window.ReflexPlayback?.setActive(true);

    utterance.onend = () => {
      if (state.listen !== listen || listen.utterance !== utterance) return;
      listen.utterance = null;
      if (!listen.playing) return;
      listen.timer = window.setTimeout(() => {
        if (state.listen !== listen || !listen.playing || listen.utterance) return;
        if (listen.index >= listen.queue.length - 1) {
          finishListening();
          return;
        }
        listen.index += 1;
        renderListeningDock();
        playListeningWord();
      }, 650);
    };

    utterance.onerror = (event) => {
      if (state.listen !== listen || listen.utterance !== utterance) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      listen.utterance = null;
      listen.playing = false;
      window.ReflexPlayback?.setActive(false);
      renderListeningDock();
      showToast(
        window.ReflexSpeech?.errorMessage(event.error) ||
          "连续朗读中断了，请点播放继续",
      );
    };

    renderListeningDock();
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  }

  function pauseListening() {
    const listen = state.listen;
    if (!listen) return;
    listen.playing = false;
    listen.finished = false;
    listen.scrubbing = false;
    listen.utterance = null;
    window.clearTimeout(listen.timer);
    window.speechSynthesis.cancel();
    window.ReflexPlayback?.setActive(false);
    clearSpeakingState();
    renderListeningDock();
  }

  function resumeListening() {
    const listen = state.listen;
    if (!listen) return;
    if (listen.finished) listen.index = 0;
    listen.finished = false;
    listen.scrubbing = false;
    listen.playing = true;
    window.ReflexPlayback?.setActive(true);
    playListeningWord();
  }

  function toggleListening() {
    const listen = state.listen;
    if (!listen) return;
    if (listen.playing) pauseListening();
    else resumeListening();
  }

  function moveListening(direction) {
    const listen = state.listen;
    if (!listen) return;
    const nextIndex = listen.index + direction;
    if (nextIndex < 0) return;
    listen.utterance = null;
    window.clearTimeout(listen.timer);
    window.speechSynthesis.cancel();
    window.ReflexPlayback?.setActive(false);
    clearSpeakingState();
    if (nextIndex >= listen.queue.length) {
      finishListening();
      return;
    }
    listen.index = nextIndex;
    listen.finished = false;
    listen.scrubbing = false;
    listen.playing = true;
    playListeningWord();
  }

  function finishListening() {
    const listen = state.listen;
    if (!listen) return;
    listen.playing = false;
    listen.finished = true;
    listen.scrubbing = false;
    listen.utterance = null;
    window.clearTimeout(listen.timer);
    window.speechSynthesis.cancel();
    window.ReflexPlayback?.setActive(false);
    clearSpeakingState();
    renderListeningDock();
  }

  function stopListening() {
    const listen = state.listen;
    if (!listen) return;
    window.clearTimeout(listen.timer);
    listen.utterance = null;
    state.listen = null;
    window.speechSynthesis.cancel();
    window.ReflexPlayback?.setActive(false);
    clearSpeakingState();
    elements.listenDock.hidden = true;
    syncListeningCardHighlight();
  }

  function toggleListeningCollapsed() {
    const listen = state.listen;
    if (!listen) return;
    listen.collapsed = !listen.collapsed;
    renderListeningDock();
  }

  function beginListeningScrub() {
    const listen = state.listen;
    if (!listen || listen.scrubbing) return;
    listen.scrubbing = true;
    listen.scrubResume = listen.playing && !listen.finished;
    listen.playing = false;
    listen.utterance = null;
    window.clearTimeout(listen.timer);
    window.speechSynthesis.cancel();
    clearSpeakingState();
  }

  function previewListeningScrub(value) {
    const listen = state.listen;
    if (!listen) return;
    beginListeningScrub();
    listen.index = Math.max(0, Math.min(listen.queue.length - 1, Number(value) - 1));
    listen.finished = false;
    renderListeningDock();
  }

  function commitListeningScrub() {
    const listen = state.listen;
    if (!listen || !listen.scrubbing) return;
    const shouldResume = listen.scrubResume;
    listen.scrubbing = false;
    listen.scrubResume = false;
    listen.playing = shouldResume;
    if (shouldResume) playListeningWord();
    else renderListeningDock();
  }

  function jumpToListeningWord() {
    const listen = state.listen;
    if (!listen) return;
    const word = wordByRank.get(listen.queue[listen.index]);
    if (!word) return;
    state.band = "all";
    state.pos = "all";
    state.collection = "all";
    state.query = word.word;
    state.visible = PAGE_SIZE;
    elements.search.value = word.word;
    document.querySelectorAll(".band-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.band === "all");
    });
    document.querySelectorAll(".pos-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.pos === "all");
    });
    document.querySelectorAll(".collection-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.collection === "all");
    });
    renderWords();
    window.setTimeout(() => {
      document.querySelector(`.word-card[data-rank="${word.rank}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 40);
  }

  function updateVoiceButton() {
    const us = progress.voiceLang === "en-US";
    const voice = findVoice(progress.voiceLang);
    const voiceName = voice?.name || "系统默认语音";
    const voiceScope = voice ? (voice.localService ? "本地" : "联网") : "默认";
    elements.voiceLabel.textContent = us ? "美音" : "英音";
    elements.voiceButton.querySelector(".tool-icon").textContent = us ? "US" : "UK";
    elements.voiceButton.title = `当前音色：${voiceName}（${voiceScope}）· 点击切换美式/英式`;
    elements.voiceButton.setAttribute(
      "aria-label",
      `当前${us ? "美" : "英"}式发音，音色 ${voiceName}，点击切换`,
    );
  }

  function updateRateButton() {
    elements.rateLabel.textContent = String(progress.rate);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("reflex-theme", theme);
    } catch {
      // Theme still applies for this session.
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#17130f" : "#f7f1e6",
    );
    elements.themeButton.setAttribute(
      "aria-label",
      theme === "dark" ? "切换浅色模式" : "切换深色模式",
    );
  }

  function setSpotlight() {
    const now = new Date();
    const localDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
    );
    const word = words[localDay % 1000] || words[0];
    if (!word) return;
    const band = getBand(word.rank);
    const levels = registerLevels(word);
    elements.spotlightDate.textContent = new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(now);
    elements.spotlightRank.textContent = `#${String(word.rank).padStart(4, "0")}`;
    elements.spotlightWord.textContent = word.word;
    elements.spotlightPos.textContent = posName(word.pos);
    elements.spotlightFrequency.textContent = `${formatNumber(word.perMillion, 1)} / 百万词`;
    elements.spotlightZh.textContent = word.zh;
    elements.spotlightPlay.dataset.rank = String(word.rank);
    elements.spotlightOpen.dataset.rank = String(word.rank);
    elements.spotlightRegister.innerHTML = registers
      .map((register) => `<span style="--level: ${levels[register.id]}" title="${escapeHTML(register.zh)}"></span>`)
      .join("");
    elements.spotlightRegister.style.setProperty("--band-color", getBandColor(word.rank));
    elements.spotlightRank.title = band?.zh || "";
  }

  function renderDetailState() {
    const word = wordByRank.get(state.detailRank);
    if (!word) return;
    const starred = progress.starred.includes(word.rank);
    const mastered = progress.mastered.includes(word.rank);
    elements.detailStar.setAttribute("aria-pressed", String(starred));
    elements.detailStarLabel.textContent = starred ? "已收藏" : "收藏";
    elements.detailMastery.setAttribute("aria-pressed", String(mastered));
    elements.detailMasteryLabel.textContent = mastered ? "已掌握" : "标记掌握";
  }

  function renderRegisterChart(word) {
    const max = maxRegister(word);
    elements.registerChart.innerHTML = registers
      .map((register) => {
        const value = Number(word.registers[register.id]) || 0;
        const width = Math.max(1, value / max * 100);
        return `
          <div class="register-row">
            <span class="register-label">${escapeHTML(register.zh)}</span>
            <span class="register-track"><span style="--width: ${width.toFixed(1)}%"></span></span>
            <span class="register-value">${formatNumber(value, value < 100 ? 1 : 0)}</span>
          </div>
        `;
      })
      .join("");
  }

  async function loadDefinition(word, token) {
    elements.definitionBox.innerHTML = '<span class="definition-status">正在读取在线词典…</span>';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.word)}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("No definition");
      const data = await response.json();
      if (token !== definitionToken || state.detailRank !== word.rank) return;
      const entry = Array.isArray(data) ? data[0] : null;
      if (!entry) throw new Error("No definition");
      const meanings = (entry.meanings || []).slice(0, 2);
      const definitions = meanings.flatMap((meaning) =>
        (meaning.definitions || []).slice(0, 1).map((definition) => ({
          partOfSpeech: meaning.partOfSpeech || "",
          definition: definition.definition || "",
          example: definition.example || "",
        })),
      );
      if (!definitions.length) throw new Error("No definition");
      elements.definitionBox.innerHTML = `
        <p class="definition-word">${escapeHTML(entry.word || word.word)}</p>
        ${definitions.map((item) => `
          <div class="definition-item">
            <em>${escapeHTML(item.partOfSpeech)}</em>
            <p>${escapeHTML(item.definition)}</p>
            ${item.example ? `<p class="definition-example">“${escapeHTML(item.example)}”</p>` : ""}
          </div>
        `).join("")}
      `;
    } catch {
      if (token !== definitionToken || state.detailRank !== word.rank) return;
      elements.definitionBox.innerHTML =
        '<span class="definition-status">在线释义暂不可用，打开下方剑桥词典查看中英释义。</span>';
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function openDetail(rank) {
    const word = wordByRank.get(rank);
    if (!word) return;
    const band = getBand(word.rank);
    const color = getBandColor(word.rank);
    lastFocusedElement = document.activeElement;
    state.detailRank = word.rank;
    definitionToken += 1;
    const token = definitionToken;

    elements.detailRank.textContent = `#${String(word.rank).padStart(4, "0")}`;
    elements.detailBand.textContent = band.zh;
    elements.detailBand.style.setProperty("--band-color", color);
    elements.detailWord.textContent = word.word;
    elements.detailPos.textContent = posName(word.pos);
    elements.detailFrequency.textContent = `${formatNumber(word.perMillion, 2)} / 百万词`;
    elements.detailZh.textContent = word.zh;
    elements.detailPerMillion.textContent = formatNumber(word.perMillion, word.perMillion < 100 ? 1 : 0);
    elements.detailCoverage.textContent = `${word.coverage.toFixed(1)}%`;
    elements.detailDispersion.textContent =
      word.dispersion === null ? "—" : word.dispersion.toFixed(2);
    elements.detailPlay.dataset.rank = String(word.rank);
    elements.cambridgeLink.href =
      `https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${encodeURIComponent(word.word)}`;
    elements.youglishLink.href =
      `https://youglish.com/pronounce/${encodeURIComponent(word.word)}/english`;
    renderRegisterChart(word);
    renderDetailState();
    elements.detailModal.hidden = false;
    syncBodyLock();
    window.setTimeout(() => elements.detailClose.focus(), 20);
    loadDefinition(word, token);
  }

  function closeDetail() {
    if (elements.detailModal.hidden) return;
    elements.detailModal.hidden = true;
    state.detailRank = null;
    definitionToken += 1;
    syncBodyLock();
    lastFocusedElement?.focus?.();
  }

  function syncBodyLock() {
    document.body.style.overflow =
      !elements.detailModal.hidden || !elements.practiceModal.hidden ? "hidden" : "";
  }

  function makePracticeQueue() {
    let pool = getFilteredWords().map((word) => word.rank);
    if (!pool.length) pool = words.map((word) => word.rank);
    const mastered = new Set(progress.mastered);
    const unmastered = shuffle(pool.filter((rank) => !mastered.has(rank)));
    const learned = shuffle(pool.filter((rank) => mastered.has(rank)));
    return [...unmastered, ...learned].slice(0, Math.min(10, pool.length));
  }

  function openPractice() {
    if (state.listen) stopListening();
    if (!elements.detailModal.hidden) closeDetail();
    const queue = makePracticeQueue();
    if (!queue.length) {
      showToast("当前筛选下没有可练习的单词");
      return;
    }
    lastFocusedElement = document.activeElement;
    state.practice = {
      queue,
      index: 0,
      checked: false,
      feedback: null,
      finished: false,
      sessionMastered: 0,
    };
    elements.practiceInput.value = "";
    elements.practiceModal.hidden = false;
    syncBodyLock();
    renderPractice();
    window.setTimeout(() => elements.practiceClose.focus(), 20);
  }

  function renderPractice() {
    const practice = state.practice;
    if (!practice) return;
    if (practice.finished) {
      renderPracticeComplete();
      return;
    }
    const word = wordByRank.get(practice.queue[practice.index]);
    if (!word) return;
    const band = getBand(word.rank);
    const total = practice.queue.length;

    elements.practiceStage.hidden = false;
    elements.practiceActions.hidden = false;
    elements.practiceFooter.hidden = false;
    elements.practiceComplete.hidden = true;
    elements.practiceIndex.textContent = String(practice.index + 1).padStart(2, "0");
    elements.practiceTotal.textContent = String(total).padStart(2, "0");
    elements.practiceProgressBar.style.width = `${((practice.index + 1) / total) * 100}%`;
    elements.practiceBand.textContent = band.zh;
    elements.practiceBand.style.setProperty("--band-color", getBandColor(word.rank));
    elements.practicePos.textContent = posName(word.pos);
    elements.practiceFrequency.textContent = `${formatNumber(word.perMillion, 1)} / 百万词`;
    elements.practiceZhHint.textContent = word.zh;
    elements.practicePlay.dataset.rank = String(word.rank);
    elements.practiceAnswer.hidden = !practice.checked;
    elements.practiceRatings.hidden = !practice.checked;
    elements.practiceCheck.hidden = practice.checked;
    elements.practiceInput.disabled = practice.checked;
    elements.practiceInstruction.textContent = practice.checked
      ? "对照原词，再听一遍确认发音"
      : "听发音，写出你听到的单词";

    if (practice.checked) {
      elements.practiceAnswerWord.textContent = word.word;
      elements.practiceAnswerMeta.textContent =
        `${posName(word.pos)} · #${word.rank} · ${formatNumber(word.perMillion, 1)} / 百万词`;
      elements.practiceAnswerZh.textContent = word.zh;
      elements.practiceFeedback.textContent = practice.feedback.text;
      elements.practiceFeedback.className = `practice-feedback ${practice.feedback.level || ""}`.trim();
    }
  }

  function resetPracticeCard(options = {}) {
    const practice = state.practice;
    if (!practice) return;
    practice.checked = false;
    practice.feedback = null;
    elements.practiceInput.value = "";
    elements.practiceInput.disabled = false;
    elements.practiceFeedback.textContent = "";
    elements.practiceFeedback.className = "practice-feedback";
    renderPractice();
    if (options.focus) {
      window.setTimeout(() => elements.practiceInput.focus(), 40);
    }
  }

  function editDistance(left, right) {
    const a = left.toLowerCase();
    const b = right.toLowerCase();
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => new Uint16Array(cols));
    for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
    for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col < cols; col += 1) {
        const cost = a[row - 1] === b[col - 1] ? 0 : 1;
        matrix[row][col] = Math.min(
          matrix[row - 1][col] + 1,
          matrix[row][col - 1] + 1,
          matrix[row - 1][col - 1] + cost,
        );
      }
    }
    return matrix[rows - 1][cols - 1];
  }

  function checkPractice() {
    const practice = state.practice;
    if (!practice || practice.finished || practice.checked) return;
    const word = wordByRank.get(practice.queue[practice.index]);
    const typed = elements.practiceInput.value.trim();
    if (!typed) {
      elements.practiceInput.focus();
      showToast("先听一遍，再写下你听到的单词");
      return;
    }
    const distance = editDistance(typed, word.word);
    if (distance === 0) {
      practice.feedback = { text: "完全正确，声音和拼写已经连上了。", level: "" };
    } else if (distance <= (word.word.length >= 8 ? 2 : 1)) {
      practice.feedback = { text: "很接近了，注意漏掉或拼错的字母。", level: "is-close" };
    } else {
      practice.feedback = { text: "再听一遍，留意单词的开头和结尾。", level: "is-off" };
    }
    practice.checked = true;
    renderPractice();
  }

  function movePractice(direction) {
    const practice = state.practice;
    if (!practice || practice.finished) return;
    const nextIndex = practice.index + direction;
    if (nextIndex >= practice.queue.length) {
      finishPractice();
      return;
    }
    if (nextIndex < 0) return;
    practice.index = nextIndex;
    resetPracticeCard();
  }

  function finishPractice() {
    const practice = state.practice;
    if (!practice) return;
    practice.finished = true;
    renderPracticeComplete();
  }

  function renderPracticeComplete() {
    const practice = state.practice;
    if (!practice) return;
    elements.practiceStage.hidden = true;
    elements.practiceActions.hidden = true;
    elements.practiceFooter.hidden = true;
    elements.practiceComplete.hidden = false;
    elements.completeTotal.textContent = String(practice.queue.length);
    elements.completeMastered.textContent = String(practice.sessionMastered);
    elements.practiceIndex.textContent = String(practice.queue.length).padStart(2, "0");
    window.setTimeout(() => elements.practiceRestart.focus(), 30);
  }

  function closePractice() {
    if (elements.practiceModal.hidden) return;
    window.speechSynthesis.cancel();
    clearSpeakingState();
    elements.practiceModal.hidden = true;
    state.practice = null;
    syncBodyLock();
    lastFocusedElement?.focus?.();
  }

  function resetFilters() {
    state.band = "all";
    state.pos = "all";
    state.collection = "all";
    state.query = "";
    elements.search.value = "";
    elements.sort.value = "rank";
    state.sort = "rank";
    document.querySelectorAll(".band-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.band === "all");
    });
    document.querySelectorAll(".pos-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.pos === "all");
    });
    document.querySelectorAll(".collection-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.collection === "all");
    });
    resetVisibleAndRender();
  }

  function bindEvents() {
    elements.bandPills.addEventListener("click", (event) => {
      const button = event.target.closest(".band-pill");
      if (!button) return;
      state.band = button.dataset.band;
      document.querySelectorAll(".band-pill").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      resetVisibleAndRender();
    });

    elements.posPills.addEventListener("click", (event) => {
      const button = event.target.closest(".pos-pill");
      if (!button) return;
      state.pos = button.dataset.pos;
      document.querySelectorAll(".pos-pill").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      resetVisibleAndRender();
    });

    elements.collectionPills.addEventListener("click", (event) => {
      const button = event.target.closest(".collection-pill");
      if (!button) return;
      state.collection = button.dataset.collection;
      document.querySelectorAll(".collection-pill").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      resetVisibleAndRender();
    });

    elements.search.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.query = elements.search.value;
        resetVisibleAndRender();
      }, 80);
    });

    elements.sort.addEventListener("change", () => {
      state.sort = elements.sort.value;
      resetVisibleAndRender();
    });

    elements.listenAll.addEventListener("click", startListening);
    elements.listenToggle.addEventListener("click", toggleListening);
    elements.listenMiniToggle.addEventListener("click", toggleListening);
    elements.listenPrev.addEventListener("click", () => moveListening(-1));
    elements.listenNext.addEventListener("click", () => moveListening(1));
    elements.listenScrubber.addEventListener("input", (event) => {
      previewListeningScrub(event.target.value);
    });
    elements.listenScrubber.addEventListener("change", commitListeningScrub);
    elements.listenCollapse.addEventListener("click", toggleListeningCollapsed);
    elements.listenClose.addEventListener("click", stopListening);
    elements.listenJump.addEventListener("click", jumpToListeningWord);
    elements.listenStar.addEventListener("click", () => {
      const listen = state.listen;
      if (listen) toggleStar(listen.queue[listen.index]);
    });
    elements.listenMastery.addEventListener("click", () => {
      const listen = state.listen;
      if (listen) {
        const rank = listen.queue[listen.index];
        setMastered(rank, !progress.mastered.includes(rank));
      }
    });

    elements.wordPractice.addEventListener("click", openPractice);
    elements.practiceClose.addEventListener("click", closePractice);
    elements.practiceModal
      .querySelector("[data-close-practice]")
      .addEventListener("click", closePractice);
    elements.practicePlay.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      const word = wordByRank.get(practice.queue[practice.index]);
      if (word) speak(word.word, elements.practicePlay);
    });
    elements.practiceCheck.addEventListener("click", checkPractice);
    elements.practiceInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (state.practice && !state.practice.checked) checkPractice();
        else movePractice(1);
      }
    });
    elements.practicePrev.addEventListener("click", () => movePractice(-1));
    elements.practiceNext.addEventListener("click", () => movePractice(1));
    elements.practiceAgain.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      setMastered(practice.queue[practice.index], false);
      movePractice(1);
    });
    elements.practiceKnown.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      const rank = practice.queue[practice.index];
      if (!progress.mastered.includes(rank)) {
        setMastered(rank, true);
        practice.sessionMastered += 1;
      }
      movePractice(1);
    });
    elements.practiceRestart.addEventListener("click", openPractice);
    elements.practiceDone.addEventListener("click", closePractice);

    elements.grid.addEventListener("click", (event) => {
      const card = event.target.closest(".word-card");
      const actionButton = event.target.closest("[data-action]");
      if (!card || !actionButton) return;
      const rank = Number(card.dataset.rank);
      const word = wordByRank.get(rank);
      if (!word) return;
      if (actionButton.dataset.action === "detail") {
        openDetail(rank);
      } else if (actionButton.dataset.action === "play") {
        speak(word.word, actionButton);
      } else if (actionButton.dataset.action === "star") {
        toggleStar(rank);
      } else if (actionButton.dataset.action === "mastery") {
        setMastered(rank, !progress.mastered.includes(rank));
      }
    });

    elements.loadMore.addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      renderWords();
    });

    elements.resetFilters.addEventListener("click", resetFilters);
    elements.browseWords.addEventListener("click", () => {
      document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.themeButton.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });

    elements.voiceButton.addEventListener("click", () => {
      progress.voiceLang = progress.voiceLang === "en-US" ? "en-GB" : "en-US";
      saveProgress();
      updateVoiceButton();
      if (state.listen?.playing) playListeningWord();
      const voiceName = findVoice(progress.voiceLang)?.name.split(" (")[0] || "系统默认";
      showToast(
        `已切换为${progress.voiceLang === "en-US" ? "美式" : "英式"} · ${voiceName}`,
      );
    });

    elements.rateButton.addEventListener("click", () => {
      const index = RATE_STEPS.indexOf(progress.rate);
      progress.rate = RATE_STEPS[(index + 1) % RATE_STEPS.length];
      saveProgress();
      updateRateButton();
      if (state.listen?.playing) playListeningWord();
      showToast(`朗读语速 ${progress.rate} 倍`);
    });

    elements.spotlightPlay.addEventListener("click", () => {
      const rank = Number(elements.spotlightPlay.dataset.rank);
      const word = wordByRank.get(rank);
      if (word) speak(word.word, elements.spotlightPlay);
    });
    elements.spotlightOpen.addEventListener("click", () => {
      openDetail(Number(elements.spotlightOpen.dataset.rank));
    });

    elements.randomWord.addEventListener("click", () => {
      const pool = getFilteredWords();
      const source = pool.length ? pool : words;
      openDetail(source[Math.floor(Math.random() * source.length)].rank);
    });

    elements.detailClose.addEventListener("click", closeDetail);
    elements.detailModal.querySelector("[data-close-detail]").addEventListener("click", closeDetail);
    elements.detailPlay.addEventListener("click", () => {
      const word = wordByRank.get(Number(elements.detailPlay.dataset.rank));
      if (word) speak(word.word, elements.detailPlay);
    });
    elements.detailStar.addEventListener("click", () => {
      if (state.detailRank) toggleStar(state.detailRank);
    });
    elements.detailMastery.addEventListener("click", () => {
      if (state.detailRank) {
        setMastered(state.detailRank, !progress.mastered.includes(state.detailRank));
      }
    });

    elements.resetProgress.addEventListener("click", () => {
      if (elements.resetProgress.dataset.confirm !== "true") {
        elements.resetProgress.dataset.confirm = "true";
        elements.resetProgress.textContent = "再点一次确认";
        window.setTimeout(() => {
          elements.resetProgress.dataset.confirm = "";
          elements.resetProgress.textContent = "清除本栏进度";
        }, 3000);
        return;
      }
      progress.starred = [];
      progress.mastered = [];
      saveProgress();
      renderWords();
      elements.resetProgress.dataset.confirm = "";
      elements.resetProgress.textContent = "清除本栏进度";
      showToast("本栏学习进度已清除");
    });

    document.addEventListener("keydown", (event) => {
      if (!elements.practiceModal.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          closePractice();
          return;
        }
        const target = event.target;
        const inInput = target instanceof HTMLInputElement;
        if (event.key === " " && !inInput && !(target instanceof HTMLButtonElement)) {
          event.preventDefault();
          elements.practicePlay.click();
        }
        if (event.key === "Enter" && !inInput) {
          if (target instanceof HTMLButtonElement) return;
          event.preventDefault();
          if (state.practice?.checked) movePractice(1);
          else checkPractice();
        }
        if (event.key === "ArrowRight" && !inInput) {
          event.preventDefault();
          movePractice(1);
        }
        if (event.key === "ArrowLeft" && !inInput) {
          event.preventDefault();
          movePractice(-1);
        }
        return;
      }

      if (!elements.detailModal.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDetail();
        }
        if (event.key === "Tab") {
          const focusable = [
            ...elements.detailPanel.querySelectorAll('button:not([hidden]), a[href]'),
          ].filter((element) => !element.closest("[hidden]"));
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        elements.search.focus();
        elements.search.select();
      } else if (event.key === "/" && document.activeElement !== elements.search) {
        event.preventDefault();
        elements.search.focus();
      }
    });

    const nav = document.getElementById("library-nav");
    window.addEventListener(
      "scroll",
      () => nav.classList.toggle("is-scrolled", window.scrollY > 90),
      { passive: true },
    );

    if ("speechSynthesis" in window) {
      loadVoices();
      updateVoiceButton();
      window.speechSynthesis.addEventListener?.("voiceschanged", () => {
        loadVoices();
        updateVoiceButton();
      });
    }
  }

  function initialize() {
    if (!words.length) {
      elements.emptyState.hidden = false;
      elements.emptyState.querySelector("h3").textContent = "词频数据没有加载成功";
      elements.emptyState.querySelector("p").textContent = "请运行 npm run build:coca 后重试。";
      return;
    }
    applyTheme(document.documentElement.dataset.theme || "light");
    updateVoiceButton();
    updateRateButton();
    setSpotlight();
    renderBandPills();
    recordStudyDate();
    renderWords();
    bindEvents();
  }

  initialize();
})();
