(() => {
  "use strict";

  const sentences = window.REFLEX_SENTENCES || [];
  const scenes = window.REFLEX_SCENES || [];
  const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));
  const sentenceMap = new Map(sentences.map((sentence) => [sentence.id, sentence]));
  const PAGE_SIZE = 48;
  const STORAGE_KEY = "reflex-english-progress-v1";
  const RATE_STEPS = [0.7, 0.85, 1, 1.15];
  const SCENE_COLORS = {
    opening: "#a8481e",
    people: "#536b4f",
    home: "#98722b",
    outside: "#465d79",
    table: "#79596f",
    work: "#4d6d67",
    memory: "#895a3f",
    goals: "#875876",
    opinion: "#5a6182",
    story: "#6d5738",
  };

  const elements = {
    grid: document.getElementById("sentence-grid"),
    scenePills: document.getElementById("scene-pills"),
    collectionPills: document.getElementById("collection-pills"),
    search: document.getElementById("search-input"),
    sectionTitle: document.getElementById("section-title"),
    sectionKicker: document.getElementById("section-kicker"),
    resultCount: document.getElementById("result-count"),
    sceneIntro: document.getElementById("scene-intro"),
    sceneIntroText: document.getElementById("scene-intro-text"),
    emptyState: document.getElementById("empty-state"),
    loadMoreWrap: document.getElementById("load-more-wrap"),
    loadMore: document.getElementById("load-more"),
    loadCount: document.getElementById("load-count"),
    resetFilters: document.getElementById("reset-filters"),
    masteredStat: document.getElementById("mastered-stat"),
    heroProgressBar: document.getElementById("hero-progress-bar"),
    heroProgressText: document.getElementById("hero-progress-text"),
    themeButton: document.getElementById("theme-button"),
    voiceButton: document.getElementById("voice-button"),
    voiceLabel: document.getElementById("voice-label"),
    rateButton: document.getElementById("rate-button"),
    rateLabel: document.getElementById("rate-label"),
    shuffleButton: document.getElementById("shuffle-button"),
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
    browseAll: document.getElementById("browse-all"),
    startPractice: document.getElementById("start-practice"),
    navPractice: document.getElementById("nav-practice"),
    primary: document.querySelector(".primary-button"),
    todayDate: document.getElementById("today-date"),
    todayEn: document.getElementById("today-en"),
    todayZh: document.getElementById("today-zh"),
    todayNumber: document.getElementById("today-number"),
    todayPlay: document.getElementById("today-play"),
    todayPractice: document.getElementById("today-practice"),
    aboutButton: document.getElementById("about-button"),
    infoModal: document.getElementById("info-modal"),
    infoClose: document.querySelector(".info-close"),
    infoStart: document.getElementById("info-start"),
    resetProgress: document.getElementById("reset-progress"),
    practiceModal: document.getElementById("practice-modal"),
    practicePanel: document.querySelector(".practice-panel"),
    practiceClose: document.querySelector(".practice-panel .close-button"),
    practiceIndex: document.getElementById("practice-index"),
    practiceTotal: document.getElementById("practice-total"),
    practiceBar: document.getElementById("practice-progress-bar"),
    practiceStage: document.getElementById("practice-stage"),
    practiceScene: document.getElementById("practice-scene"),
    practiceWordCount: document.getElementById("practice-word-count"),
    practiceMasteryDot: document.getElementById("practice-mastery-dot"),
    practiceCue: document.getElementById("practice-cue"),
    practiceCueLabel: document.getElementById("practice-cue-label"),
    practiceZh: document.getElementById("practice-zh"),
    dictationArea: document.getElementById("dictation-area"),
    dictationInput: document.getElementById("dictation-input"),
    practiceAnswer: document.getElementById("practice-answer"),
    practiceEn: document.getElementById("practice-en"),
    practiceAnswerZh: document.getElementById("practice-answer-zh"),
    answerFeedback: document.getElementById("answer-feedback"),
    practicePlay: document.getElementById("practice-play"),
    revealButton: document.getElementById("reveal-button"),
    revealLabel: document.getElementById("reveal-label"),
    ratingActions: document.getElementById("rating-actions"),
    againButton: document.getElementById("again-button"),
    knownButton: document.getElementById("known-button"),
    practicePrev: document.getElementById("practice-prev"),
    practiceNext: document.getElementById("practice-next"),
    practiceActions: document.getElementById("practice-actions"),
    practiceFooter: document.querySelector(".practice-footer"),
    practiceComplete: document.getElementById("practice-complete"),
    completeTotal: document.getElementById("complete-total"),
    completeMastered: document.getElementById("complete-mastered"),
    completeStarred: document.getElementById("complete-starred"),
    practiceAgain: document.getElementById("practice-again"),
    practiceDone: document.getElementById("practice-done"),
    toast: document.getElementById("toast"),
  };

  const state = {
    scene: "all",
    collection: "all",
    query: "",
    visible: PAGE_SIZE,
    practice: null,
    listen: null,
  };

  let progress = loadProgress();
  let searchTimer = 0;
  let toastTimer = 0;
  let lastFocusedElement = null;
  let voices = [];
  let speakingButton = null;
  let activeSpeech = null;

  function loadProgress() {
    const fallback = {
      mastered: [],
      starred: [],
      studyDates: [],
      voiceLang: "en-US",
      rate: 0.9,
      sessions: 0,
    };

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;

      return {
        mastered: Array.isArray(saved.mastered)
          ? [...new Set(saved.mastered.map(Number).filter((id) => sentenceMap.has(id)))]
          : [],
        starred: Array.isArray(saved.starred)
          ? [...new Set(saved.starred.map(Number).filter((id) => sentenceMap.has(id)))]
          : [],
        studyDates: Array.isArray(saved.studyDates)
          ? [...new Set(saved.studyDates.filter((date) => typeof date === "string"))].slice(-90)
          : [],
        voiceLang: saved.voiceLang === "en-GB" ? "en-GB" : "en-US",
        rate: RATE_STEPS.includes(Number(saved.rate)) ? Number(saved.rate) : 0.9,
        sessions: Number.isFinite(saved.sessions) ? saved.sessions : 0,
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

    const pattern = new RegExp(`(${escapeRegExp(term).replace(/\s+/g, "\\s+")})`, "gi");
    return safeText.replace(pattern, "<mark>$1</mark>");
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeSentence(value) {
    return value
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^a-z0-9'\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sentenceSimilarity(a, b) {
    const left = normalizeSentence(a);
    const right = normalizeSentence(b);
    if (!left && !right) return 1;
    if (!left || !right) return 0;
    if (left === right) return 1;

    const rows = left.length + 1;
    const cols = right.length + 1;
    const matrix = Array.from({ length: rows }, () => new Uint16Array(cols));

    for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
    for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col < cols; col += 1) {
        const cost = left[row - 1] === right[col - 1] ? 0 : 1;
        matrix[row][col] = Math.min(
          matrix[row - 1][col] + 1,
          matrix[row][col - 1] + 1,
          matrix[row - 1][col - 1] + cost,
        );
      }
    }

    return 1 - matrix[rows - 1][cols - 1] / Math.max(left.length, right.length);
  }

  function getFilteredSentences() {
    const mastered = new Set(progress.mastered);
    const starred = new Set(progress.starred);
    const query = state.query.trim().toLowerCase();

    return sentences.filter((sentence) => {
      if (state.scene !== "all" && sentence.scene !== state.scene) return false;
      if (state.collection === "mastered" && !mastered.has(sentence.id)) return false;
      if (state.collection === "learning" && mastered.has(sentence.id)) return false;
      if (state.collection === "starred" && !starred.has(sentence.id)) return false;
      if (query && !`${sentence.en} ${sentence.zh}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }

  function sceneColor(sceneId) {
    return SCENE_COLORS[sceneId] || "#a8481e";
  }

  function sceneBadge(sentence) {
    const scene = sceneMap.get(sentence.scene);
    return `<span class="scene-badge" style="--scene-color: ${sceneColor(sentence.scene)}">${escapeHTML(scene?.zh || "日常表达")}</span>`;
  }

  function renderScenePills() {
    const allCount = sentences.length;
    const sceneButtons = scenes
      .map(
        (scene) =>
          `<button class="scene-pill" type="button" data-scene="${scene.id}">${escapeHTML(scene.zh)}<span class="pill-count">100</span></button>`,
      )
      .join("");

    elements.scenePills.innerHTML = `
      <button class="scene-pill active" type="button" data-scene="all">全部<span class="pill-count">${allCount}</span></button>
      ${sceneButtons}
    `;
  }

  function renderCard(sentence, index) {
    const mastered = progress.mastered.includes(sentence.id);
    const starred = progress.starred.includes(sentence.id);
    const scene = sceneMap.get(sentence.scene);
    const classes = ["sentence-card"];
    if (mastered) classes.push("is-mastered");
    if (starred) classes.push("is-starred");

    return `
      <article
        class="${classes.join(" ")}"
        data-id="${sentence.id}"
        style="--scene-color: ${sceneColor(sentence.scene)}; --card-index: ${index % 24}"
        aria-label="第 ${sentence.id} 句，${escapeHTML(scene?.zh || "日常表达")}"
      >
        <div class="card-topline">
          <span class="card-number">${String(sentence.id).padStart(3, "0")}</span>
          ${sceneBadge(sentence)}
        </div>
        <div class="card-body">
          <p class="card-en" lang="en">${highlight(sentence.en, state.query)}</p>
          <p class="card-zh" lang="zh-CN">${highlight(sentence.zh, state.query)}</p>
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <button
              class="card-icon-button play-button"
              type="button"
              data-action="play"
              aria-label="播放第 ${sentence.id} 句"
              title="播放英文"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9.2 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
              </svg>
              <span class="sound-wave" aria-hidden="true"><i></i><i></i><i></i></span>
            </button>
            <span class="card-word-count">${sentence.words} words</span>
          </div>
          <div class="card-actions">
            <button
              class="card-icon-button star-button ${starred ? "is-active" : ""}"
              type="button"
              data-action="star"
              aria-label="${starred ? "取消收藏" : "收藏"}第 ${sentence.id} 句"
              aria-pressed="${starred}"
              title="${starred ? "取消收藏" : "收藏"}"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m12 3.7 2.56 5.18 5.72.83-4.14 4.04.98 5.7L12 16.76l-5.12 2.69.98-5.7-4.14-4.04 5.72-.83L12 3.7Z" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              class="card-icon-button mastery-button ${mastered ? "is-active" : ""}"
              type="button"
              data-action="mastery"
              aria-label="${mastered ? "标记为待掌握" : "标记为已掌握"}第 ${sentence.id} 句"
              aria-pressed="${mastered}"
              title="${mastered ? "已掌握，点击取消" : "标记已掌握"}"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.4" />
                <path d="m8.3 12.2 2.4 2.4 5.2-5.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function updateHeading(filtered) {
    const scene = sceneMap.get(state.scene);
    let title = "全部句子";
    let kicker = "The complete library";

    if (state.collection === "starred") {
      title = "我的收藏";
      kicker = "Saved for later";
    } else if (state.collection === "mastered") {
      title = "已经掌握";
      kicker = "Your mastered sentences";
    } else if (state.collection === "learning") {
      title = "待掌握";
      kicker = "Still in progress";
    } else if (scene) {
      title = scene.zh;
      kicker = scene.en;
    }

    elements.sectionTitle.textContent = title;
    elements.sectionKicker.textContent = kicker;
    elements.resultCount.textContent = `${filtered.length} 句`;

    const showSceneIntro =
      Boolean(scene) && state.collection === "all" && !state.query.trim() && filtered.length > 0;
    elements.sceneIntro.hidden = !showSceneIntro;
    elements.sceneIntroText.textContent = showSceneIntro ? scene.note : "";
  }

  function renderCards() {
    const filtered = getFilteredSentences();
    const visible = filtered.slice(0, state.visible);
    elements.grid.innerHTML = visible.map(renderCard).join("");
    elements.emptyState.hidden = filtered.length !== 0;
    elements.grid.hidden = filtered.length === 0;

    const hasMore = filtered.length > visible.length;
    elements.loadMoreWrap.hidden = !hasMore;
    elements.loadCount.textContent = hasMore
      ? `${visible.length} / ${filtered.length}`
      : "";
    updateHeading(filtered);
    updateProgressUI();
    syncListeningCardHighlight();
  }

  function updateProgressUI() {
    const mastered = progress.mastered.length;
    const percentage = (mastered / Math.max(sentences.length, 1)) * 100;
    elements.masteredStat.textContent = mastered.toLocaleString("zh-CN");
    elements.heroProgressBar.style.width = `${percentage}%`;

    if (mastered === 0) {
      elements.heroProgressText.textContent = "还差 1000 句，开始第一句吧";
    } else if (mastered >= sentences.length) {
      elements.heroProgressText.textContent = "1000 句都在这里了，回来复习吧";
    } else {
      elements.heroProgressText.textContent = `已走完 ${percentage.toFixed(1)}%，还差 ${sentences.length - mastered} 句`;
    }
  }

  function resetVisibleAndRender() {
    state.visible = PAGE_SIZE;
    renderCards();
  }

  function toggleStar(id) {
    const set = new Set(progress.starred);
    const sentence = sentenceMap.get(id);
    if (!sentence) return;

    if (set.has(id)) {
      set.delete(id);
      showToast("已取消收藏");
    } else {
      set.add(id);
      showToast("已加入收藏");
    }

    progress.starred = [...set];
    saveProgress();
    renderCards();
    if (state.listen) renderListeningDock();
  }

  function setMastered(id, value, options = {}) {
    const set = new Set(progress.mastered);
    const wasMastered = set.has(id);
    if (value) set.add(id);
    else set.delete(id);

    progress.mastered = [...set];
    saveProgress();
    renderCards();
    if (state.listen) renderListeningDock();

    if (state.practice?.revealed) {
      const current = sentenceMap.get(state.practice.queue[state.practice.index]);
      if (current?.id === id) updatePracticeMeta();
    }

    if (!options.silent) {
      if (value) showToast(wasMastered ? "这句本来就在掌握列表里" : "已标记掌握");
      else showToast("已移回待掌握");
    }

    return !wasMastered && value;
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
    activeSpeech = null;
    document.querySelectorAll(".is-speaking").forEach((button) => button.classList.remove("is-speaking"));
  }

  function createUtterance(text) {
    if (!voices.length) loadVoices();
    const utterance = new SpeechSynthesisUtterance(text);
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

  function speak(text, button = null) {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持语音朗读");
      return;
    }

    if (state.listen) stopListening();
    window.speechSynthesis.cancel();
    clearSpeakingState();

    const utterance = createUtterance(text);
    activeSpeech = utterance;

    if (button) {
      button.classList.add("is-speaking");
      speakingButton = button;
    }

    utterance.onend = () => {
      if (activeSpeech !== utterance) return;
      clearSpeakingState();
    };
    utterance.onerror = (event) => {
      if (activeSpeech !== utterance) return;
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

  function speakSentence(id, button = null) {
    const sentence = sentenceMap.get(id);
    if (sentence) speak(sentence.en, button);
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
      if (!state.listen.playing) {
        toggleListening();
      } else {
        elements.listenDock.focus?.();
      }
      return;
    }

    if (!elements.practiceModal.hidden) closePractice();
    if (!elements.infoModal.hidden) closeInfo();

    window.speechSynthesis.cancel();
    clearSpeakingState();
    state.listen = {
      queue: sentences.map((sentence) => sentence.id),
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
    playListeningSentence();
    if (window.matchMedia("(pointer: coarse)").matches) {
      showToast("已尝试保持屏幕常亮；息屏后部分手机仍会暂停语音");
    }
  }

  function renderListeningDock() {
    const listen = state.listen;
    if (!listen) return;
    const sentence = sentenceMap.get(listen.queue[listen.index]);
    if (!sentence) return;
    const scene = sceneMap.get(sentence.scene);
    const total = listen.queue.length;
    const position = `${String(sentence.id).padStart(3, "0")} / ${total}`;

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
    elements.listenScene.textContent = scene?.zh || "日常表达";
    elements.listenScene.style.setProperty("--scene-color", sceneColor(sentence.scene));
    elements.listenWordCount.textContent = `${sentence.words} words`;
    const starred = progress.starred.includes(sentence.id);
    const mastered = progress.mastered.includes(sentence.id);
    elements.listenStar.classList.toggle("is-active", starred);
    elements.listenStar.setAttribute("aria-pressed", String(starred));
    elements.listenStar.setAttribute(
      "aria-label",
      starred ? "取消收藏当前句" : "收藏当前句",
    );
    elements.listenStarLabel.textContent = starred ? "已收藏" : "收藏";
    elements.listenMastery.classList.toggle("is-active", mastered);
    elements.listenMastery.setAttribute("aria-pressed", String(mastered));
    elements.listenMastery.setAttribute(
      "aria-label",
      mastered ? "取消当前句的已掌握标记" : "标记当前句为已掌握",
    );
    elements.listenMasteryLabel.textContent = mastered ? "已掌握" : "标记掌握";
    elements.listenEn.textContent = sentence.en;
    elements.listenZh.textContent = sentence.zh;
    const progressPercent = ((listen.index + 1) / total) * 100;
    elements.listenScrubber.max = String(total);
    elements.listenScrubber.value = String(listen.index + 1);
    elements.listenScrubber.style.setProperty("--listen-progress", `${progressPercent}%`);
    elements.listenScrubber.setAttribute(
      "aria-valuetext",
      `第 ${sentence.id} 句，${scene?.zh || "日常表达"}，${sentence.en}`,
    );
    elements.listenScrubber.title = `第 ${sentence.id} 句 · 拖动跳转`;
    elements.listenToggle.setAttribute("aria-label", listen.playing ? "暂停连续播放" : "继续连续播放");
    elements.listenMiniToggle.setAttribute("aria-label", listen.playing ? "暂停连续播放" : "继续连续播放");
    elements.listenCollapse.setAttribute("aria-expanded", String(!listen.collapsed));
    elements.listenCollapse.setAttribute(
      "aria-label",
      listen.collapsed ? "展开连续听播放器" : "收起连续听播放器",
    );
    syncListeningCardHighlight();
  }

  function syncListeningCardHighlight() {
    document.querySelectorAll(".sentence-card.is-now-playing").forEach((card) => {
      card.classList.remove("is-now-playing");
    });
    const listen = state.listen;
    if (!listen) return;
    const sentence = sentenceMap.get(listen.queue[listen.index]);
    document.querySelector(`.sentence-card[data-id="${sentence?.id}"]`)?.classList.add("is-now-playing");
  }

  function playListeningSentence() {
    const listen = state.listen;
    if (!listen || !listen.playing) return;
    listen.scrubbing = false;
    const sentence = sentenceMap.get(listen.queue[listen.index]);
    if (!sentence) return;

    window.clearTimeout(listen.timer);
    listen.utterance = null;
    window.speechSynthesis.cancel();
    clearSpeakingState();

    const utterance = createUtterance(sentence.en);
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
        playListeningSentence();
      }, 520);
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
    playListeningSentence();
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
    clearSpeakingState();

    if (nextIndex >= listen.queue.length) {
      finishListening();
      return;
    }

    listen.index = nextIndex;
    listen.finished = false;
    listen.scrubbing = false;
    listen.playing = true;
    playListeningSentence();
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
    const index = Math.max(
      0,
      Math.min(listen.queue.length - 1, Number(value) - 1),
    );
    listen.index = index;
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
    if (shouldResume) playListeningSentence();
    else renderListeningDock();
  }

  function jumpToListeningSentence() {
    const listen = state.listen;
    if (!listen) return;
    const sentence = sentenceMap.get(listen.queue[listen.index]);
    if (!sentence) return;

    state.scene = "all";
    state.collection = "all";
    state.query = "";
    state.visible = Math.max(PAGE_SIZE, Math.ceil(sentence.id / PAGE_SIZE) * PAGE_SIZE);
    elements.search.value = "";
    document.querySelectorAll(".scene-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.scene === "all");
    });
    document.querySelectorAll(".collection-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.collection === "all");
    });
    renderCards();

    window.setTimeout(() => {
      document.querySelector(`.sentence-card[data-id="${sentence.id}"]`)?.scrollIntoView({
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
    elements.rateLabel.textContent = progress.rate === 1 ? "1.0" : String(progress.rate);
    elements.rateButton.setAttribute("aria-label", `当前语速 ${progress.rate} 倍，点击切换`);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("reflex-theme", theme);
    } catch {
      // Theme still applies for this session.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#17130f" : "#f7f1e6");
    elements.themeButton.setAttribute(
      "aria-label",
      theme === "dark" ? "切换浅色模式" : "切换深色模式",
    );
  }

  function setTodaySentence() {
    const now = new Date();
    const localDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
    );
    const sentence = sentences[localDay % sentences.length];
    if (!sentence) return;

    elements.todayEn.textContent = sentence.en;
    elements.todayZh.textContent = sentence.zh;
    elements.todayNumber.textContent = String(sentence.id).padStart(3, "0");
    elements.todayDate.textContent = new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(now);
    elements.todayPlay.dataset.id = sentence.id;
    elements.todayPractice.dataset.id = sentence.id;
  }

  function makePracticeQueue(count, options = {}) {
    if (options.singleId && sentenceMap.has(options.singleId)) {
      return [options.singleId];
    }

    let pool = options.useCurrentFilter ? getFilteredSentences().map((item) => item.id) : sentences.map((item) => item.id);
    if (!pool.length) pool = sentences.map((item) => item.id);

    const mastered = new Set(progress.mastered);
    const unmastered = shuffle(pool.filter((id) => !mastered.has(id)));
    const learned = shuffle(pool.filter((id) => mastered.has(id)));
    return [...unmastered, ...learned].slice(0, Math.min(count, pool.length));
  }

  function openPractice(options = {}) {
    if (state.listen) stopListening();
    const count = options.count || 10;
    const queue = makePracticeQueue(count, options);
    if (!queue.length) {
      showToast("当前筛选下没有可练习的句子");
      return;
    }

    lastFocusedElement = document.activeElement;
    state.practice = {
      queue,
      index: 0,
      mode: "recall",
      revealed: false,
      feedback: null,
      finished: false,
      sessionMastered: 0,
      starredAtStart: progress.starred.length,
    };

    elements.dictationInput.value = "";
    progress.sessions += 1;
    saveProgress();
    recordStudyDate();
    elements.practiceModal.hidden = false;
    syncBodyLock();
    renderPractice();
    window.setTimeout(() => elements.practiceClose.focus(), 20);
  }

  function updatePracticeMeta() {
    const practice = state.practice;
    if (!practice) return;
    const sentence = sentenceMap.get(practice.queue[practice.index]);
    if (!sentence) return;
    const isMastered = progress.mastered.includes(sentence.id);
    elements.practiceMasteryDot.hidden = !isMastered;
  }

  function renderPractice() {
    const practice = state.practice;
    if (!practice) return;

    if (practice.finished) {
      renderPracticeComplete();
      return;
    }

    const sentence = sentenceMap.get(practice.queue[practice.index]);
    if (!sentence) return;
    const scene = sceneMap.get(sentence.scene);
    const total = practice.queue.length;

    elements.practiceStage.hidden = false;
    elements.practiceActions.hidden = false;
    elements.practiceFooter.hidden = false;
    elements.practiceComplete.hidden = true;
    elements.practiceIndex.textContent = String(practice.index + 1).padStart(2, "0");
    elements.practiceTotal.textContent = String(total).padStart(2, "0");
    elements.practiceBar.style.width = `${((practice.index + 1) / total) * 100}%`;
    elements.practiceScene.textContent = scene?.zh || "日常表达";
    elements.practiceScene.style.setProperty("--scene-color", sceneColor(sentence.scene));
    elements.practiceWordCount.textContent = `${sentence.words} words`;
    elements.practiceZh.textContent = sentence.zh;
    elements.practiceEn.textContent = sentence.en;
    elements.practiceAnswerZh.textContent = sentence.zh;
    updatePracticeMeta();

    document.querySelectorAll(".mode-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === practice.mode);
    });

    elements.practiceCue.hidden = practice.mode === "dictation";
    elements.dictationArea.hidden = practice.mode !== "dictation" || practice.revealed;
    elements.practiceAnswer.hidden = !practice.revealed;
    elements.revealButton.hidden = practice.revealed;
    elements.ratingActions.hidden = !practice.revealed;
    elements.revealLabel.textContent = practice.mode === "dictation" ? "对照答案" : "揭晓英文";

    if (practice.mode === "recall") {
      elements.practiceCueLabel.textContent = practice.revealed
        ? "再看一眼中文，确认意思"
        : "先想一想，这句话用英语怎么说？";
    }

    if (practice.revealed && practice.feedback) {
      elements.answerFeedback.hidden = false;
      elements.answerFeedback.textContent = practice.feedback.text;
      elements.answerFeedback.className = `answer-feedback ${practice.feedback.level || ""}`.trim();
    } else {
      elements.answerFeedback.hidden = true;
      elements.answerFeedback.textContent = "";
    }
  }

  function resetPracticeCard(options = {}) {
    const practice = state.practice;
    if (!practice) return;
    practice.revealed = false;
    practice.feedback = null;
    elements.dictationInput.value = "";
    elements.answerFeedback.hidden = true;
    renderPractice();

    if (practice.mode === "dictation" && options.focus) {
      window.setTimeout(() => elements.dictationInput.focus(), 40);
    }
  }

  function revealCurrent() {
    const practice = state.practice;
    if (!practice || practice.finished || practice.revealed) return;
    const sentence = sentenceMap.get(practice.queue[practice.index]);
    if (!sentence) return;

    practice.revealed = true;

    if (practice.mode === "dictation") {
      const typed = elements.dictationInput.value.trim();
      if (!typed) {
        practice.feedback = {
          text: "还没有写下答案，再听一遍试试。",
          level: "is-off",
        };
      } else {
        const similarity = sentenceSimilarity(typed, sentence.en);
        if (similarity >= 0.98) {
          practice.feedback = { text: "完全正确，耳朵和拼写都在线。", level: "" };
        } else if (similarity >= 0.72) {
          practice.feedback = { text: "很接近了，留意漏掉或拼错的词。", level: "is-close" };
        } else {
          practice.feedback = { text: "先抓住整句节奏，再对照原句听一遍。", level: "is-off" };
        }
      }
    }

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
    elements.practiceBar.style.width = "100%";
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
    elements.completeStarred.textContent = String(
      Math.max(0, progress.starred.length - practice.starredAtStart),
    );
    elements.practiceIndex.textContent = String(practice.queue.length).padStart(2, "0");
    elements.practiceTotal.textContent = String(practice.queue.length).padStart(2, "0");
    window.setTimeout(() => elements.practiceAgain.focus(), 30);
  }

  function closePractice() {
    if (elements.practiceModal.hidden) return;
    window.speechSynthesis?.cancel();
    clearSpeakingState();
    elements.practiceModal.hidden = true;
    state.practice = null;
    syncBodyLock();
    lastFocusedElement?.focus?.();
  }

  function openInfo() {
    lastFocusedElement = document.activeElement;
    elements.infoModal.hidden = false;
    syncBodyLock();
    window.setTimeout(() => elements.infoClose.focus(), 20);
  }

  function closeInfo() {
    if (elements.infoModal.hidden) return;
    elements.infoModal.hidden = true;
    syncBodyLock();
    lastFocusedElement?.focus?.();
  }

  function syncBodyLock() {
    document.body.style.overflow =
      !elements.practiceModal.hidden || !elements.infoModal.hidden ? "hidden" : "";
  }

  function startPracticeFromCurrent() {
    openPractice({ count: 10, useCurrentFilter: true });
  }

  function resetFilters() {
    state.scene = "all";
    state.collection = "all";
    state.query = "";
    elements.search.value = "";
    document.querySelectorAll(".scene-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.scene === "all");
    });
    document.querySelectorAll(".collection-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.collection === "all");
    });
    resetVisibleAndRender();
  }

  function bindEvents() {
    elements.scenePills.addEventListener("click", (event) => {
      const button = event.target.closest(".scene-pill");
      if (!button) return;
      state.scene = button.dataset.scene;
      document.querySelectorAll(".scene-pill").forEach((item) => {
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

    elements.grid.addEventListener("click", (event) => {
      const card = event.target.closest(".sentence-card");
      const actionButton = event.target.closest("[data-action]");
      if (!card || !actionButton) return;
      const id = Number(card.dataset.id);

      if (actionButton.dataset.action === "play") {
        speakSentence(id, actionButton);
      } else if (actionButton.dataset.action === "star") {
        toggleStar(id);
      } else if (actionButton.dataset.action === "mastery") {
        setMastered(id, !progress.mastered.includes(id));
      }
    });

    elements.loadMore.addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      renderCards();
    });

    elements.resetFilters.addEventListener("click", resetFilters);
    elements.browseAll.addEventListener("click", () => {
      document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.themeButton.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });

    elements.voiceButton.addEventListener("click", () => {
      progress.voiceLang = progress.voiceLang === "en-US" ? "en-GB" : "en-US";
      saveProgress();
      updateVoiceButton();
      if (state.listen?.playing) playListeningSentence();
      const voiceName = findVoice(progress.voiceLang)?.name.split(" (")[0] || "系统默认";
      showToast(
        `已切换为${progress.voiceLang === "en-US" ? "美式" : "英式"} · ${voiceName}`,
      );
    });

    elements.rateButton.addEventListener("click", () => {
      const currentIndex = RATE_STEPS.indexOf(progress.rate);
      progress.rate = RATE_STEPS[(currentIndex + 1) % RATE_STEPS.length];
      saveProgress();
      updateRateButton();
      if (state.listen?.playing) playListeningSentence();
      showToast(`朗读语速 ${progress.rate} 倍`);
    });

    elements.todayPlay.addEventListener("click", () => {
      speakSentence(Number(elements.todayPlay.dataset.id), elements.todayPlay);
    });

    elements.todayPractice.addEventListener("click", () => {
      openPractice({ count: 1, singleId: Number(elements.todayPractice.dataset.id) });
    });

    elements.startPractice.addEventListener("click", () => {
      openPractice({ count: 10, useCurrentFilter: false });
    });
    elements.navPractice.addEventListener("click", startPracticeFromCurrent);

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
    elements.listenJump.addEventListener("click", jumpToListeningSentence);
    elements.listenStar.addEventListener("click", () => {
      const listen = state.listen;
      if (!listen) return;
      const id = listen.queue[listen.index];
      toggleStar(id);
    });
    elements.listenMastery.addEventListener("click", () => {
      const listen = state.listen;
      if (!listen) return;
      const id = listen.queue[listen.index];
      setMastered(id, !progress.mastered.includes(id));
    });

    elements.shuffleButton.addEventListener("click", () => {
      const pool = getFilteredSentences();
      const source = pool.length ? pool : sentences;
      const candidate = source[Math.floor(Math.random() * source.length)];
      if (candidate) openPractice({ count: 1, singleId: candidate.id });
    });

    elements.aboutButton.addEventListener("click", openInfo);
    elements.infoClose.addEventListener("click", closeInfo);
    elements.infoModal.querySelector("[data-close-info]").addEventListener("click", closeInfo);
    elements.infoStart.addEventListener("click", () => {
      closeInfo();
      openPractice({ count: 10, useCurrentFilter: false });
    });
    elements.resetProgress.addEventListener("click", () => {
      if (elements.resetProgress.dataset.confirm !== "true") {
        elements.resetProgress.dataset.confirm = "true";
        elements.resetProgress.textContent = "再点一次，确认清除";
        window.setTimeout(() => {
          elements.resetProgress.dataset.confirm = "";
          elements.resetProgress.textContent = "清除本机学习记录";
        }, 3000);
        return;
      }

      progress = {
        mastered: [],
        starred: [],
        studyDates: [],
        voiceLang: "en-US",
        rate: 0.9,
        sessions: 0,
      };
      saveProgress();
      recordStudyDate();
      updateVoiceButton();
      updateRateButton();
      resetFilters();
      elements.resetProgress.dataset.confirm = "";
      elements.resetProgress.textContent = "清除本机学习记录";
      closeInfo();
      showToast("学习记录已清除");
    });

    elements.practiceModal.querySelectorAll("[data-close-practice]").forEach((element) => {
      element.addEventListener("click", closePractice);
    });

    document.querySelectorAll(".mode-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (!state.practice) return;
        state.practice.mode = button.dataset.mode;
        resetPracticeCard({ focus: true });
      });
    });

    elements.revealButton.addEventListener("click", revealCurrent);
    elements.practicePlay.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      const sentence = sentenceMap.get(practice.queue[practice.index]);
      if (sentence) speak(sentence.en, elements.practicePlay);
    });

    elements.practicePrev.addEventListener("click", () => movePractice(-1));
    elements.practiceNext.addEventListener("click", () => movePractice(1));

    elements.knownButton.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      const id = practice.queue[practice.index];
      if (setMastered(id, true, { silent: true })) practice.sessionMastered += 1;
      movePractice(1);
    });

    elements.againButton.addEventListener("click", () => {
      const practice = state.practice;
      if (!practice) return;
      setMastered(practice.queue[practice.index], false, { silent: true });
      movePractice(1);
    });

    elements.practiceAgain.addEventListener("click", () => {
      openPractice({ count: 10, useCurrentFilter: true });
    });
    elements.practiceDone.addEventListener("click", closePractice);

    elements.dictationInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (state.practice && !state.practice.revealed) revealCurrent();
        else movePractice(1);
      }
    });

    document.addEventListener("keydown", handleKeyboard);

    if ("speechSynthesis" in window) {
      loadVoices();
      updateVoiceButton();
      window.speechSynthesis.addEventListener?.("voiceschanged", () => {
        loadVoices();
        updateVoiceButton();
      });
    }
  }

  function trapFocus(event, container) {
    if (event.key !== "Tab") return;
    const focusable = [
      ...container.querySelectorAll(
        'button:not([hidden]):not([disabled]), a[href], input:not([hidden]), textarea:not([hidden]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeyboard(event) {
    const practiceOpen = !elements.practiceModal.hidden;
    const infoOpen = !elements.infoModal.hidden;

    if (infoOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeInfo();
      }
      trapFocus(event, elements.infoModal.querySelector(".info-panel"));
      return;
    }

    if (practiceOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePractice();
        return;
      }

      trapFocus(event, elements.practicePanel);

      const target = event.target;
      const inTextarea = target instanceof HTMLTextAreaElement;
      if (event.key === " " && !inTextarea && !(target instanceof HTMLButtonElement)) {
        event.preventDefault();
        elements.practicePlay.click();
      }

      if (event.key === "Enter" && !inTextarea) {
        if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return;
        event.preventDefault();
        if (!state.practice?.revealed) revealCurrent();
        else movePractice(1);
      }

      if (event.key === "ArrowRight" && !inTextarea) {
        event.preventDefault();
        movePractice(1);
      }

      if (event.key === "ArrowLeft" && !inTextarea) {
        event.preventDefault();
        movePractice(-1);
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.search.focus();
      elements.search.select();
      return;
    }

    if (event.key === "/" && document.activeElement !== elements.search) {
      event.preventDefault();
      elements.search.focus();
    }
  }

  function initialize() {
    if (!sentences.length) {
      elements.emptyState.hidden = false;
      elements.emptyState.querySelector("h3").textContent = "句子数据没有加载成功";
      elements.emptyState.querySelector("p").textContent = "请通过本地网页服务器打开这个网站。";
      return;
    }

    applyTheme(document.documentElement.dataset.theme || "light");
    updateVoiceButton();
    updateRateButton();
    setTodaySentence();
    renderScenePills();
    recordStudyDate();
    renderCards();
    bindEvents();

    const nav = document.getElementById("library-nav");
    window.addEventListener(
      "scroll",
      () => nav.classList.toggle("is-scrolled", window.scrollY > 90),
      { passive: true },
    );

    if (window.location.hash === "#library") {
      window.setTimeout(() => {
        document.getElementById("library").scrollIntoView({ block: "start" });
      }, 100);
    }
  }

  initialize();
})();
