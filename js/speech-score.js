/**
 * 录音打分模块
 * 优先使用浏览器语音识别（Web Speech API）自动评分
 * 不支持时降级为录音回放 + 手动自评
 */
const SpeechScore = {
  recognition: null,
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  audioUrl: null,

  supportsRecognition() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  supportsRecording() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  normalize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[''']/g, "'")
      .replace(/[^a-z0-9'\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  },

  scoreWord(expected, actual) {
    const e = this.normalize(expected);
    const a = this.normalize(actual);
    if (!a) return 0;
    if (e === a) return 100;
    const dist = this.levenshtein(e, a);
    const maxLen = Math.max(e.length, a.length);
    return Math.max(0, Math.round((1 - dist / maxLen) * 100));
  },

  scoreSentence(expected, actual) {
    const eWords = this.normalize(expected).split(' ').filter(Boolean);
    const aWords = this.normalize(actual).split(' ').filter(Boolean);
    if (!eWords.length) return 0;
    if (!aWords.length) return 0;

    let matched = 0;
    let aIdx = 0;
    for (const ew of eWords) {
      for (let j = aIdx; j < aWords.length; j++) {
        if (this.scoreWord(ew, aWords[j]) >= 75) {
          matched++;
          aIdx = j + 1;
          break;
        }
      }
    }
    const orderScore = Math.round((matched / eWords.length) * 100);
    const bestAlt = actual;
    const fuzzyFull = this.scoreWord(expected, bestAlt);
    return Math.round(orderScore * 0.75 + fuzzyFull * 0.25);
  },

  calcScore(expected, transcript, type) {
    const texts = Array.isArray(transcript) ? transcript : [transcript];
    let best = 0;
    let bestText = '';
    for (const t of texts) {
      if (!t) continue;
      const s = type === 'word' ? this.scoreWord(expected, t) : this.scoreSentence(expected, t);
      if (s > best) {
        best = s;
        bestText = t;
      }
    }
    return { score: best, transcript: bestText };
  },

  getGrade(score) {
    if (score >= 90) return { stars: '⭐⭐⭐', label: '太棒了！', class: 'excellent' };
    if (score >= 75) return { stars: '⭐⭐', label: '很不错！', class: 'good' };
    if (score >= 60) return { stars: '⭐', label: '继续加油', class: 'ok' };
    return { stars: '💪', label: '再练一次', class: 'low' };
  },

  recognizeOnce(maxMs = 8000) {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error('no-speech-api'));
        return;
      }

      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 5;

      let settled = false;
      const finish = (fn, val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.recognition = null;
        fn(val);
      };

      const timer = setTimeout(() => {
        try {
          rec.stop();
        } catch {}
        finish(resolve, []);
      }, maxMs);

      rec.onresult = (event) => {
        const list = [];
        for (let i = 0; i < event.results.length; i++) {
          for (let j = 0; j < event.results[i].length; j++) {
            list.push(event.results[i][j].transcript);
          }
        }
        finish(resolve, list);
      };

      rec.onerror = (e) => finish(reject, e);

      rec.onend = () => {
        if (!settled) finish(resolve, []);
      };

      try {
        rec.start();
        this.recognition = rec;
      } catch (e) {
        finish(reject, e);
      }
    });
  },

  stopRecognition() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  },

  async startRecording() {
    if (!this.supportsRecording()) throw new Error('no-mic');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start();
    this._recordStream = stream;
  },

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      this.mediaRecorder.onstop = () => {
        if (this._recordStream) {
          this._recordStream.getTracks().forEach((t) => t.stop());
          this._recordStream = null;
        }
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        resolve(this.audioUrl);
      };
      this.mediaRecorder.stop();
    });
  },

  playRecording() {
    if (!this.audioUrl) return;
    const audio = new Audio(this.audioUrl);
    audio.play();
  },

  cleanup() {
    this.stopRecognition();
    if (this._recordStream) {
      this._recordStream.getTracks().forEach((t) => t.stop());
      this._recordStream = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.mediaRecorder = null;
  }
};
