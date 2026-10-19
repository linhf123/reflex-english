(() => {
  "use strict";

  const preferredNames = {
    "en-US": [
      "sandy",
      "flo",
      "shelley",
      "reed",
      "eddy",
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
      "serena",
      "kate",
      "google uk english",
      "daniel",
    ],
  };

  const naturalTokens = ["natural", "neural", "premium", "enhanced"];

  function pickVoice(voices, lang) {
    const matching = voices.filter((voice) =>
      voice.lang.toLowerCase().replace("_", "-").startsWith(lang.toLowerCase()),
    );
    if (!matching.length) return null;

    const preferred = preferredNames[lang] || preferredNames["en-US"];
    const scored = matching.map((voice) => {
      const name = voice.name.toLowerCase();
      let score = 0;
      if (naturalTokens.some((token) => name.includes(token))) score += 120;
      const preferredIndex = preferred.findIndex((candidate) => name.includes(candidate));
      if (preferredIndex >= 0) score += 90 - preferredIndex * 4;
      if (name.includes("google")) score += 64;
      if (name.includes("microsoft")) score += 45;
      if (voice.default) score += 3;
      if (voice.localService) score += 2;
      return { voice, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].voice;
  }

  window.ReflexSpeech = { pickVoice };
})();
