(() => {
  "use strict";

  const preferredNames = {
    "en-US": [
      "samantha",
      "alex",
      "ava",
      "google us english",
      "zira",
      "mark",
      "david",
    ],
    "en-GB": [
      "daniel",
      "serena",
      "kate",
      "google uk english",
      "hazel",
      "george",
    ],
  };

  function matchingVoices(voices, lang) {
    let matching = voices.filter((voice) =>
      voice.lang.toLowerCase().replace("_", "-").startsWith(lang.toLowerCase()),
    );
    if (!matching.length) {
      matching = voices.filter((voice) =>
        voice.lang.toLowerCase().replace("_", "-").startsWith("en"),
      );
    }
    return matching;
  }

  function pickVoice(voices, lang) {
    const matching = matchingVoices(voices, lang);
    if (!matching.length) return null;

    const preferred = preferredNames[lang] || preferredNames["en-US"];
    for (const candidate of preferred) {
      const voice = matching.find((item) => item.name.toLowerCase().includes(candidate));
      if (voice) return voice;
    }
    return matching.find((voice) => voice.default)
      || matching.find((voice) => voice.localService)
      || matching[0];
  }

  function pickFallbackVoice(voices, lang) {
    const matching = matchingVoices(voices, lang);
    if (!matching.length) return null;
    return matching.find((voice) => voice.localService)
      || matching.find((voice) => voice.default)
      || matching[0];
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

  function isRecoverableError(error) {
    return [
      "network",
      "voice-unavailable",
      "language-unavailable",
      "synthesis-unavailable",
      "synthesis-failed",
    ].includes(error);
  }

  window.ReflexSpeech = {
    pickVoice,
    pickFallbackVoice,
    errorMessage,
    isRecoverableError,
  };
})();
