/*
 * 中英双向练习的显隐状态机。
 * 句子库（英译中 / 中译英）与 COCA（词译中 / 中译词）共用这一份实现，
 * 差异只在数据来源、卡片选择器和文案上。
 */
(() => {
  "use strict";

  const CJK = /[\u3400-\u9fff]/;

  /**
   * @param {object} options
   * @param {object} options.progress    读写 { direction, answerVisible } 的对象（可用 getter）
   * @param {Function} options.save      持久化
   * @param {Function} options.rerender  全量重绘
   * @param {Function} options.toast     轻提示
   * @param {Function} [options.getQuery] 当前搜索词
   * @param {string} options.primary     主行选择器（英译中时可见）
   * @param {string} options.secondary   答案行选择器（英译中时隐藏）
   * @param {Function} options.cardSelector (id) => 卡片选择器
   * @param {object} [options.button]    { root, label, icon }
   * @param {Element} [options.switchRoot] 方向胶囊容器
   * @param {object} [options.labels]    { primary: "英文", secondary: "中文" }
   */
  function create(options) {
    const overrides = new Map();
    const labels = options.labels || { primary: "英文", secondary: "中文" };
    const { primary, secondary } = options;

    const isReverse = () => options.progress.direction === "zh2en";
    const isShown = () => options.progress.answerVisible === true;

    function answerName() {
      return isReverse() ? labels.primary : labels.secondary;
    }

    // 用答案那一侧的语言搜索时自动展开，否则会搜到一堆看不见的匹配项。
    function queryForces() {
      const query = (options.getQuery?.() || "").trim();
      if (!query) return false;
      return isReverse() ? !CJK.test(query) : CJK.test(query);
    }

    function isVisible(id) {
      if (overrides.has(id)) return overrides.get(id);
      if (queryForces()) return true;
      return isShown();
    }

    function classesFor(id) {
      const visible = isVisible(id);
      const reverse = isReverse();
      return {
        reverse,
        primaryHidden: !visible && reverse,
        secondaryHidden: !visible && !reverse,
      };
    }

    function applyCard(card, visible) {
      if (!card) return;
      const reverse = isReverse();
      card.classList.toggle("is-reverse", reverse);
      card
        .querySelector(primary)
        ?.classList.toggle("is-answer-hidden", !visible && reverse);
      card
        .querySelector(secondary)
        ?.classList.toggle("is-answer-hidden", !visible && !reverse);

      const trigger = card.querySelector(secondary);
      if (trigger) trigger.title = `${visible ? "点击隐藏" : "点击查看"}${answerName()}`;
    }

    function toggle(id, card) {
      const next = !isVisible(id);
      overrides.set(id, next);
      applyCard(card || document.querySelector(options.cardSelector(id)), next);
      return next;
    }

    function updateButton() {
      const { root, label, icon } = options.button || {};
      if (!root) return;
      const name = answerName();
      const visible = isShown();
      if (label) label.textContent = `${visible ? "隐藏" : "显示"}${name}`;
      if (icon) icon.textContent = isReverse() ? "EN" : "中";
      root.classList.toggle("is-on", visible);
      root.title = visible
        ? `当前显示${name}，点击全部隐藏`
        : `当前隐藏${name}，点击全部显示`;
      root.setAttribute("aria-label", root.title);
    }

    function updateSwitch() {
      const root = options.switchRoot;
      if (!root) return;
      root.querySelectorAll("[data-direction]").forEach((button) => {
        const active = button.dataset.direction === options.progress.direction;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function setVisible(visible, config = {}) {
      options.progress.answerVisible = visible;
      overrides.clear();
      options.save();
      updateButton();
      options.rerender();
      if (config.silent) return;

      const name = answerName();
      if (visible) {
        options.toast(`已显示全部${name}`);
      } else {
        options.toast(
          queryForces() ? "搜索答案语言时保持展开，清空搜索后生效" : `已隐藏全部${name}`,
        );
      }
    }

    function setDirection(direction) {
      if (options.progress.direction === direction) return;
      options.progress.direction = direction;
      overrides.clear();
      options.save();
      updateSwitch();
      updateButton();
      options.rerender();
      options.toast(direction === "zh2en" ? "已切换为中译英" : "已切换为英译中");
    }

    function reset() {
      overrides.clear();
      updateSwitch();
      updateButton();
    }

    function bind() {
      options.button?.root?.addEventListener("click", () => setVisible(!isShown()));
      options.switchRoot
        ?.querySelectorAll("[data-direction]")
        .forEach((button) =>
          button.addEventListener("click", () => setDirection(button.dataset.direction)),
        );
    }

    return {
      isReverse,
      isVisible,
      classesFor,
      applyCard,
      toggle,
      setVisible,
      setDirection,
      updateButton,
      updateSwitch,
      reset,
      bind,
      answerName,
    };
  }

  window.ReflexAnswerMode = { create };
})();
