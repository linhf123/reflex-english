(() => {
  "use strict";

  const preferredNames = {
    "en-US": [
      "sandy",
      "flo",
      "shelley",
      "reed",
      "eddy",
      "zira",
      "mark",
      "david",
      "ava",
      "allison",
      "susan",
      "google us english",
      "samantha",
    ],
    "en-GB": [
      "flo",
      "shelley",
      "reed",
      "eddy",
      "hazel",
      "george",
      "serena",
      "kate",
      "google uk english",
      "daniel",
    ],
  };

  const naturalTokens = ["natural", "neural", "premium", "enhanced"];

  function pickVoice(voices, lang) {
    let matching = voices.filter((voice) =>
      voice.lang.toLowerCase().replace("_", "-").startsWith(lang.toLowerCase()),
    );
    if (!matching.length) {
      matching = voices.filter((voice) =>
        voice.lang.toLowerCase().replace("_", "-").startsWith("en"),
      );
    }
    if (!matching.length) return null;

    const preferred = preferredNames[lang] || preferredNames["en-US"];
    const scored = matching.map((voice) => {
      const name = voice.name.toLowerCase();
      let score = 0;
      if (voice.localService) score += 120;
      if (naturalTokens.some((token) => name.includes(token))) score += 34;
      const preferredIndex = preferred.findIndex((candidate) => name.includes(candidate));
      if (preferredIndex >= 0) score += 76 - preferredIndex * 3;
      if (name.includes("google")) score += voice.localService ? 4 : -8;
      if (name.includes("microsoft")) score += 46;
      if (voice.default) score += 3;
      return { voice, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].voice;
  }

  function errorMessage(error) {
    if (error === "network") {
      return "当前语音需要联网且连接失败，请切换本地英文语音或检查网络";
    }
    if (error === "not-allowed") {
      return "浏览器阻止了语音播放，请先点击页面后再试";
    }
    if (error === "audio-busy") {
      return "音频设备正被占用，请关闭其他播放器后重试";
    }
    if (error === "voice-unavailable" || error === "language-unavailable") {
      return "系统缺少可用英文语音，请在 Windows 设置中安装英文语音包";
    }
    if (error === "synthesis-unavailable" || error === "synthesis-failed") {
      return "系统语音合成失败，请尝试安装本地英文语音或更换浏览器";
    }
    return "语音播放失败，请检查系统声音和设备输出";
  }

  window.ReflexSpeech = { pickVoice, errorMessage };
})();
