/**
 * 英语打卡小助手 - 主程序
 * 数据存储在 localStorage，键名：pep_grade3_records
 */

const STORAGE_KEY = 'pep_grade3_records';

const App = {
  currentUnitId: 'unit1',
  currentTab: 'daily',
  checkinFilter: 'all',
  dictation: { queue: [], index: 0, correct: 0, wrong: 0, answered: false },
  wrongbookFilter: 'all',
  wbPractice: { queue: [], index: 0, correct: 0, wrong: 0, answered: false },
  lessonAudio: null,
  readingLineIndex: -1,
  speechSession: null,
  speechRecording: false,
  // 是否存在真人 mp3 音频；默认 false，启动时探测。
  // 为 false 时点击直接同步朗读，保证 iOS Safari 能发声。
  audioAvailable: false,

  init() {
    this.loadState();
    this.renderUnitSelect();
    this.bindTabs();
    this.bindUnitChange();
    this.bindCheckin();
    this.bindDictation();
    this.bindWrongBook();
    this.bindReading();
    this.bindRecite();
    this.bindRecords();
    this.bindSpeechModal();
    this.bindDaily();
    this.setupSpeechUnlock();
    this.probeAudioAvailability();
    this.renderAll();
    DailyPush.init(() => this.getRecords(), (r) => this.saveRecords(r));
    this.setupServiceWorkerMessages();
  },

  /* ---------- 存储 ---------- */
  getRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : this.defaultRecords();
    } catch {
      return this.defaultRecords();
    }
  },

  defaultRecords() {
    return {
      words: {},
      dictation: {},
      reading: {},
      recite: {},
      wrongWords: {},
      speechScores: {},
      dailyLog: {},
      pushSettings: DailyPush.defaultSettings(),
      streak: { current: 0, best: 0, lastDoneDate: null },
      lastUnit: 'unit1',
      updatedAt: null
    };
  },

  saveRecords(records) {
    records = DailyPush.ensureStructures(records);
    records = DailyPush.updateStreak(records);
    records.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.updateDailyBadge();
  },

  loadState() {
    const records = this.getRecords();
    this.currentUnitId = records.lastUnit || 'unit1';
  },

  getUnit() {
    return PEP_GRADE3_BOOK.units.find((u) => u.id === this.currentUnitId);
  },

  wordKey(unitId, en) {
    return `${unitId}::${en.toLowerCase()}`;
  },

  getWordFromBook(unitId, en) {
    const unit = PEP_GRADE3_BOOK.units.find((u) => u.id === unitId);
    return unit?.words.find((w) => w.en.toLowerCase() === en.toLowerCase());
  },

  getWrongWordEntries(filterUnitOnly = false) {
    const records = this.getRecords();
    const entries = Object.entries(records.wrongWords || {})
      .filter(([, w]) => !w.mastered)
      .map(([key, w]) => ({ key, ...w }));
    if (filterUnitOnly) {
      return entries.filter((w) => w.unitId === this.currentUnitId);
    }
    return entries;
  },

  updateWrongBookBadge() {
    const count = this.getWrongWordEntries().length;
    const badge = document.getElementById('wrongBookBadge');
    if (!badge) return;
    badge.textContent = count;
    badge.hidden = count === 0;
  },

  /* ---------- 单元选择 ---------- */
  renderUnitSelect() {
    const select = document.getElementById('unitSelect');
    select.innerHTML = PEP_GRADE3_BOOK.units
      .map(
        (u) =>
          `<option value="${u.id}">Unit ${u.number} ${u.titleCn}（${u.title}）</option>`
      )
      .join('');
    select.value = this.currentUnitId;
  },

  bindUnitChange() {
    document.getElementById('unitSelect').addEventListener('change', (e) => {
      this.currentUnitId = e.target.value;
      const records = this.getRecords();
      records.lastUnit = this.currentUnitId;
      this.saveRecords(records);
      this.resetDictation();
      this.renderAll();
    });
  },

  /* ---------- 标签页 ---------- */
  bindTabs() {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.tab;
        this.switchTab(name);
      });
    });
  },

  switchTab(name) {
    this.currentTab = name;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.panel').forEach((p) => {
      p.classList.toggle('active', p.id === `panel-${name}`);
    });
    if (name === 'records') this.renderRecords();
    if (name === 'daily') this.renderDaily();
    if (name === 'dictation') this.focusDictationInput();
    if (name === 'wrongbook') this.renderWrongBook();
  },

  renderAll() {
    this.renderLessonSelects();
    this.renderDaily();
    this.renderCheckin();
    this.renderDictation();
    this.renderWrongBook();
    this.renderReading();
    this.renderRecite();
    this.updateWrongBookBadge();
    this.updateDailyBadge();
  },

  renderLessonSelects() {
    const unit = this.getUnit();
    const options = unit.lessons
      .map((l) => `<option value="${l.id}">${l.title} - ${l.titleCn}</option>`)
      .join('');
    document.getElementById('lessonSelectReading').innerHTML = options;
    document.getElementById('lessonSelectRecite').innerHTML = options;
  },

  getLessonById(lessonId) {
    const unit = this.getUnit();
    return unit.lessons.find((l) => l.id === lessonId);
  },

  /* ---------- 今日任务与推送 ---------- */
  trackDailyActivity(type, amount = 1) {
    const records = this.getRecords();
    DailyPush.ensureStructures(records);
    const log = records.dailyLog[DailyPush.getTodayKey()];

    if (type === 'dictation' || type === 'reading' || type === 'recite') {
      log[type] = true;
    } else if (type === 'wrongbook') {
      log.wrongbook = (log.wrongbook || 0) + amount;
    } else {
      log[type] = (log[type] || 0) + amount;
    }

    this.saveRecords(records);
    if (this.currentTab === 'daily') this.renderDaily();
  },

  updateDailyBadge() {
    const badge = document.getElementById('dailyTaskBadge');
    if (!badge) return;
    const status = DailyPush.getTodayStatus(this.getRecords());
    const pending = status.total - status.doneCount;
    badge.textContent = pending;
    badge.hidden = pending === 0;
  },

  bindDaily() {
    document.getElementById('pushEnabled').addEventListener('change', (e) => {
      const records = this.getRecords();
      DailyPush.ensureStructures(records);
      records.pushSettings.enabled = e.target.checked;
      this.saveRecords(records);
      this.renderPushStatus();
    });

    document.getElementById('pushTime').addEventListener('change', (e) => {
      const records = this.getRecords();
      DailyPush.ensureStructures(records);
      records.pushSettings.time = e.target.value;
      records.pushSettings.lastNotifiedDate = null;
      this.saveRecords(records);
      this.renderPushStatus();
    });

    document.getElementById('pushRequestPerm').addEventListener('click', async () => {
      const result = await DailyPush.requestPermission();
      this.renderPushStatus();
      if (result === 'granted') this.showToast('通知权限已开启');
      else if (result === 'denied') this.showToast('通知被拒绝，请在浏览器设置中允许');
      else this.showToast('当前浏览器不支持通知');
    });

    document.getElementById('pushTestNotify').addEventListener('click', async () => {
      const perm = await DailyPush.requestPermission();
      if (perm !== 'granted') {
        this.showToast('请先开启通知权限');
        return;
      }
      let records = this.getRecords();
      await DailyPush.showNotification(
        '📬 英语打卡提醒（测试）',
        DailyPush.buildNotificationBody(records)
      );
      this.showToast('测试推送已发送');
    });
  },

  renderPushStatus() {
    const el = document.getElementById('pushStatus');
    if (!el) return;
    const records = this.getRecords();
    const settings = records.pushSettings || DailyPush.defaultSettings();
    let status = '';
    if (!('Notification' in window)) {
      status = '⚠️ 当前浏览器不支持通知';
    } else if (Notification.permission === 'granted') {
      status = settings.enabled
        ? `✅ 已开启，每天 ${settings.time} 提醒`
        : '通知权限已开，但每日提醒已关闭';
    } else if (Notification.permission === 'denied') {
      status = '❌ 通知权限被拒绝，请在浏览器设置中开启';
    } else {
      status = '请点击「开启通知权限」';
    }
    el.textContent = status;
  },

  renderDaily() {
    const records = this.getRecords();
    const status = DailyPush.getTodayStatus(records);
    const streak = records.streak || { current: 0, best: 0 };

    const d = new Date();
    const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    document.getElementById('dailyDateLine').textContent =
      `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekNames[d.getDay()]}`;

    document.getElementById('dailyStreak').innerHTML = `
      <div class="streak-card">
        <div class="num">${streak.current}</div>
        <div class="lbl">连续打卡（天）</div>
      </div>
      <div class="streak-card">
        <div class="num">${streak.best}</div>
        <div class="lbl">最长连续（天）</div>
      </div>
      <div class="streak-card">
        <div class="num">${status.doneCount}/${status.total}</div>
        <div class="lbl">今日完成</div>
      </div>
    `;

    const pct = status.total ? Math.round((status.doneCount / status.total) * 100) : 0;
    document.getElementById('dailyProgress').style.width = `${pct}%`;
    document.getElementById('dailyProgressText').textContent =
      status.allDone ? '🎉 今日任务全部完成！' : `已完成 ${status.doneCount} / ${status.total} 项`;

    document.getElementById('dailyTaskList').innerHTML = status.tasks
      .map(
        (task) => `
      <div class="daily-task-item ${task.done ? 'done' : ''}">
        <div class="daily-task-icon">${task.icon}</div>
        <div class="daily-task-body">
          <h4>${task.done ? '✅ ' : ''}${task.title}</h4>
          <p>${task.desc}</p>
          <div class="daily-task-progress">${task.progress} / ${task.target}</div>
        </div>
        ${
          task.done
            ? '<span class="badge" style="position:static;background:var(--success);color:white;padding:4px 10px;border-radius:20px;font-size:0.8rem">已完成</span>'
            : `<button class="btn btn-sm btn-primary btn-go" data-goto-tab="${task.tab}">去完成</button>`
        }
      </div>`
      )
      .join('');

    document.querySelectorAll('[data-goto-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.gotoTab));
    });

    const settings = records.pushSettings || DailyPush.defaultSettings();
    document.getElementById('pushEnabled').checked = !!settings.enabled;
    document.getElementById('pushTime').value = settings.time || '19:00';
    this.renderPushStatus();
    this.updateDailyBadge();
  },

  setupServiceWorkerMessages() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'OPEN_DAILY') this.switchTab('daily');
    });
    if (location.hash === '#daily') this.switchTab('daily');
  },

  /* ---------- 单词打卡 ---------- */
  bindCheckin() {
    document.getElementById('checkinFilterAll').addEventListener('click', () => {
      this.checkinFilter = 'all';
      this.updateFilterButtons();
      this.renderCheckin();
    });
    document.getElementById('checkinFilterUndone').addEventListener('click', () => {
      this.checkinFilter = 'undone';
      this.updateFilterButtons();
      this.renderCheckin();
    });
    document.getElementById('checkinFilterDone').addEventListener('click', () => {
      this.checkinFilter = 'done';
      this.updateFilterButtons();
      this.renderCheckin();
    });
  },

  updateFilterButtons() {
    const map = { all: 'checkinFilterAll', undone: 'checkinFilterUndone', done: 'checkinFilterDone' };
    Object.entries(map).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('active-filter', this.checkinFilter === key);
    });
  },

  renderCheckin() {
    const unit = this.getUnit();
    const records = this.getRecords();
    const grid = document.getElementById('wordGrid');
    let words = unit.words;

    const doneCount = words.filter((w) => {
      const key = this.wordKey(unit.id, w.en);
      return records.words[key]?.checked;
    }).length;

    const pct = words.length ? Math.round((doneCount / words.length) * 100) : 0;
    document.getElementById('checkinProgress').style.width = `${pct}%`;
    document.getElementById('checkinProgressText').textContent = `${doneCount} / ${words.length} 已打卡`;

    if (this.checkinFilter === 'done') {
      words = words.filter((w) => records.words[this.wordKey(unit.id, w.en)]?.checked);
    } else if (this.checkinFilter === 'undone') {
      words = words.filter((w) => !records.words[this.wordKey(unit.id, w.en)]?.checked);
    }

    grid.innerHTML = words
      .map((word) => {
        const key = this.wordKey(unit.id, word.en);
        const rec = records.words[key] || {};
        const done = !!rec.checked;
        const checkedAt = rec.checkedAt
          ? new Date(rec.checkedAt).toLocaleDateString('zh-CN')
          : '';
        const speechRec = records.speechScores?.[key];
        const speechBadge = speechRec
          ? `<span class="speech-score-badge">口语 ${speechRec.bestScore} 分</span>`
          : '';
        return `
          <div class="word-card ${done ? 'done' : ''}" data-en="${word.en}">
            ${done ? `<span class="badge">已打卡</span>` : ''}
            <div class="en">${word.en}</div>
            <div class="phonetic">${word.phonetic || ''}</div>
            <div class="cn">${word.cn}</div>
            ${speechBadge}
            ${done ? `<div class="phonetic">打卡：${checkedAt}</div>` : ''}
            <div class="word-card-actions">
              <button class="btn btn-sm" data-action="speak" data-en="${word.en}">🔊</button>
              <button class="btn btn-sm btn-record" data-action="record" data-en="${word.en}">🎤</button>
              ${
                done
                  ? `<button class="btn btn-sm" data-action="uncheck" data-en="${word.en}">取消</button>`
                  : `<button class="btn btn-sm btn-primary" data-action="check" data-en="${word.en}">学会了</button>`
              }
            </div>
          </div>`;
      })
      .join('');

    grid.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const en = e.currentTarget.dataset.en;
        const word = unit.words.find((w) => w.en === en);
        if (action === 'speak') this.speakWord(word);
        if (action === 'record') this.openSpeechModal({
          type: 'word',
          expected: word.en,
          expectedCn: word.cn,
          saveKey: this.wordKey(unit.id, word.en),
          speakFn: () => this.speakWord(word),
          onDone: () => this.renderCheckin()
        });
        if (action === 'check') this.checkWord(word);
        if (action === 'uncheck') this.uncheckWord(word);
      });
    });
  },

  checkWord(word) {
    const records = this.getRecords();
    const key = this.wordKey(this.currentUnitId, word.en);
    records.words[key] = {
      checked: true,
      checkedAt: new Date().toISOString(),
      unitId: this.currentUnitId
    };
    this.saveRecords(records);
    this.trackDailyActivity('checkin');
    this.showToast(`太棒了！「${word.en}」打卡成功 🎉`);
    this.renderCheckin();
  },

  uncheckWord(word) {
    const records = this.getRecords();
    const key = this.wordKey(this.currentUnitId, word.en);
    delete records.words[key];
    this.saveRecords(records);
    this.renderCheckin();
  },

  /* ---------- 单词默写 ---------- */
  bindDictation() {
    document.getElementById('dictationSubmit').addEventListener('click', () => this.submitDictation());
    document.getElementById('dictationInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitDictation();
    });
    document.getElementById('dictationNext').addEventListener('click', () => this.nextDictation());
    document.getElementById('dictationHint').addEventListener('click', () => this.showDictationHint());
    document.getElementById('dictationSpeak').addEventListener('click', () => {
      const word = this.dictation.queue[this.dictation.index];
      if (word) this.speakWord(word);
    });
    document.getElementById('dictationRestart').addEventListener('click', () => {
      this.resetDictation();
      this.renderDictation();
      this.focusDictationInput();
    });
  },

  resetDictation() {
    const unit = this.getUnit();
    this.dictation = {
      queue: this.shuffle([...unit.words]),
      index: 0,
      correct: 0,
      wrong: 0,
      answered: false
    };
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  renderDictation() {
    if (!this.dictation.queue.length) this.resetDictation();
    const { queue, index, correct, wrong, answered } = this.dictation;
    const word = queue[index];

    document.getElementById('dictationCorrect').textContent = correct;
    document.getElementById('dictationWrong').textContent = wrong;
    document.getElementById('dictationIndex').textContent = index + 1;

    const input = document.getElementById('dictationInput');
    const feedback = document.getElementById('dictationFeedback');
    const nextBtn = document.getElementById('dictationNext');

    if (!word) {
      document.getElementById('dictationCn').textContent = '本单元默写完成！';
      document.getElementById('dictationPhonetic').textContent = `正确 ${correct}，错误 ${wrong}`;
      input.value = '';
      input.disabled = true;
      feedback.textContent = '';
      nextBtn.hidden = true;
      this.saveDictationScore();
      return;
    }

    document.getElementById('dictationCn').textContent = word.cn;
    document.getElementById('dictationPhonetic').textContent = answered ? word.phonetic : '（听发音可辅助记忆）';
    input.value = '';
    input.disabled = answered;
    input.className = 'dictation-input';
    feedback.textContent = '';
    feedback.className = 'dictation-feedback';
    nextBtn.hidden = !answered;
    if (!answered) this.focusDictationInput();
  },

  focusDictationInput() {
    setTimeout(() => {
      const input = document.getElementById('dictationInput');
      if (input && !input.disabled) input.focus();
    }, 100);
  },

  submitDictation() {
    if (this.dictation.answered) return;
    const word = this.dictation.queue[this.dictation.index];
    if (!word) return;

    const input = document.getElementById('dictationInput');
    const answer = input.value.trim().toLowerCase();
    const correct = answer === word.en.toLowerCase();
    const feedback = document.getElementById('dictationFeedback');

    this.dictation.answered = true;
    if (correct) {
      this.dictation.correct++;
      input.classList.add('correct');
      feedback.textContent = '✅ 正确！';
      feedback.className = 'dictation-feedback ok';
      this.speakWord(word);
      this.onWordAnsweredCorrect(word);
    } else {
      this.dictation.wrong++;
      input.classList.add('wrong');
      feedback.textContent = `❌ 正确答案：${word.en}`;
      feedback.className = 'dictation-feedback err';
      this.addToWrongBook(word, answer);
    }

    document.getElementById('dictationPhonetic').textContent = word.phonetic;
    input.disabled = true;
    document.getElementById('dictationNext').hidden = false;
  },

  nextDictation() {
    this.dictation.index++;
    this.dictation.answered = false;
    this.renderDictation();
  },

  showDictationHint() {
    const word = this.dictation.queue[this.dictation.index];
    if (!word || this.dictation.answered) return;
    const input = document.getElementById('dictationInput');
    if (!input.value) input.value = word.en.charAt(0);
    this.showToast(`提示：首字母是 ${word.en.charAt(0).toUpperCase()}`);
  },

  saveDictationScore() {
    const records = this.getRecords();
    const total = this.dictation.correct + this.dictation.wrong;
    if (!total) return;
    records.dictation[this.currentUnitId] = {
      correct: this.dictation.correct,
      wrong: this.dictation.wrong,
      total,
      score: Math.round((this.dictation.correct / total) * 100),
      date: new Date().toISOString()
    };
    this.saveRecords(records);
    this.trackDailyActivity('dictation');
    this.showToast(`默写完成！得分 ${records.dictation[this.currentUnitId].score}%`);
  },

  /* ---------- 错词本 ---------- */
  addToWrongBook(word, wrongAnswer = '', silent = false) {
    const records = this.getRecords();
    if (!records.wrongWords) records.wrongWords = {};
    const key = this.wordKey(this.currentUnitId, word.en);
    const existing = records.wrongWords[key];
    const isNew = !existing;
    records.wrongWords[key] = {
      en: word.en,
      cn: word.cn,
      phonetic: word.phonetic || '',
      audio: word.audio || '',
      unitId: this.currentUnitId,
      wrongCount: (existing?.wrongCount || 0) + 1,
      correctStreak: 0,
      lastWrongAt: new Date().toISOString(),
      lastAnswer: wrongAnswer,
      mastered: false
    };
    this.saveRecords(records);
    this.updateWrongBookBadge();
    if (!silent) {
      this.showToast(isNew ? `「${word.en}」已加入错词本` : `「${word.en}」错误次数 +1`);
    }
  },

  onWordAnsweredCorrect(word) {
    const records = this.getRecords();
    const key = this.wordKey(this.currentUnitId, word.en);
    const entry = records.wrongWords?.[key];
    if (!entry || entry.mastered) return;
    entry.correctStreak = (entry.correctStreak || 0) + 1;
    if (entry.correctStreak >= 2) {
      delete records.wrongWords[key];
      this.saveRecords(records);
      this.updateWrongBookBadge();
      this.showToast(`「${word.en}」已掌握，从错词本移除 🎉`);
      if (this.currentTab === 'wrongbook') this.renderWrongBook();
    } else {
      this.saveRecords(records);
      if (this.currentTab === 'wrongbook') this.renderWrongBook();
    }
  },

  removeFromWrongBook(key) {
    const records = this.getRecords();
    if (records.wrongWords?.[key]) {
      delete records.wrongWords[key];
      this.saveRecords(records);
      this.updateWrongBookBadge();
      this.renderWrongBook();
      this.showToast('已从错词本移除');
    }
  },

  bindWrongBook() {
    document.getElementById('wrongbookFilterAll').addEventListener('click', () => {
      this.wrongbookFilter = 'all';
      document.getElementById('wrongbookFilterAll').classList.add('active-filter');
      document.getElementById('wrongbookFilterUnit').classList.remove('active-filter');
      this.renderWrongBook();
    });
    document.getElementById('wrongbookFilterUnit').addEventListener('click', () => {
      this.wrongbookFilter = 'unit';
      document.getElementById('wrongbookFilterUnit').classList.add('active-filter');
      document.getElementById('wrongbookFilterAll').classList.remove('active-filter');
      this.renderWrongBook();
    });
    document.getElementById('wrongbookStartPractice').addEventListener('click', () => this.startWrongBookPractice());
    document.getElementById('wrongbookClearMastered').addEventListener('click', () => this.clearMasteredWrongWords());
    document.getElementById('wrongbookClearAll').addEventListener('click', () => {
      const count = this.getWrongWordEntries().length;
      if (!count) {
        this.showToast('错词本已经是空的');
        return;
      }
      if (confirm(`确定清空错词本中的 ${count} 个单词吗？`)) {
        const records = this.getRecords();
        records.wrongWords = {};
        this.saveRecords(records);
        this.hideWrongBookPractice();
        this.updateWrongBookBadge();
        this.renderWrongBook();
        this.showToast('错词本已清空');
      }
    });
    document.getElementById('wbSubmit').addEventListener('click', () => this.submitWrongBookPractice());
    document.getElementById('wbInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitWrongBookPractice();
    });
    document.getElementById('wbNext').addEventListener('click', () => this.nextWrongBookPractice());
    document.getElementById('wbHint').addEventListener('click', () => this.showWrongBookHint());
    document.getElementById('wbSpeak').addEventListener('click', () => {
      const item = this.wbPractice.queue[this.wbPractice.index];
      if (item) this.speakWord(item);
    });
    document.getElementById('wbExit').addEventListener('click', () => this.hideWrongBookPractice());
  },

  renderWrongBook() {
    const filterUnit = this.wrongbookFilter === 'unit';
    const entries = this.getWrongWordEntries(filterUnit);
    const allCount = this.getWrongWordEntries().length;
    const unitCount = this.getWrongWordEntries(true).length;

    document.getElementById('wrongbookSummary').innerHTML = `
      <span>待复习：<strong>${allCount}</strong> 个</span>
      <span>当前单元：<strong>${unitCount}</strong> 个</span>
      <span>连续答对 2 次自动移出</span>
    `;

    const list = document.getElementById('wrongbookList');
    if (!entries.length) {
      list.innerHTML = `<div class="wrongbook-empty">🎉 暂无错词，继续保持！</div>`;
      document.getElementById('wrongbookStartPractice').disabled = true;
      return;
    }

    document.getElementById('wrongbookStartPractice').disabled = false;
    const unitMap = Object.fromEntries(PEP_GRADE3_BOOK.units.map((u) => [u.id, u]));

    list.innerHTML = entries
      .sort((a, b) => new Date(b.lastWrongAt) - new Date(a.lastWrongAt))
      .map((w) => {
        const unit = unitMap[w.unitId];
        const unitLabel = unit ? `Unit ${unit.number}` : w.unitId;
        const streak = w.correctStreak || 0;
        return `
        <div class="word-card wrong-word" data-key="${w.key}">
          <div class="en">${w.en}</div>
          <div class="phonetic">${w.phonetic || ''}</div>
          <div class="cn">${w.cn}</div>
          <div class="wrong-count">错误 ${w.wrongCount} 次 · ${unitLabel}</div>
          ${w.lastAnswer ? `<div class="last-answer">上次填写：${w.lastAnswer}</div>` : ''}
          ${streak > 0 ? `<div class="streak-hint">已连续答对 ${streak} 次，再对 ${2 - streak} 次移出</div>` : ''}
          <div class="word-card-actions">
            <button class="btn btn-sm" data-wb-speak="${w.key}">🔊</button>
            <button class="btn btn-sm btn-danger" data-wb-remove="${w.key}">移除</button>
          </div>
        </div>`;
      })
      .join('');

    list.querySelectorAll('[data-wb-speak]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.wbSpeak;
        const w = this.getRecords().wrongWords[key];
        if (w) this.speakWord(w);
      });
    });
    list.querySelectorAll('[data-wb-remove]').forEach((btn) => {
      btn.addEventListener('click', () => this.removeFromWrongBook(btn.dataset.wbRemove));
    });

    this.updateWrongBookBadge();
  },

  clearMasteredWrongWords() {
    const records = this.getRecords();
    let removed = 0;
    Object.entries(records.wrongWords || {}).forEach(([key, w]) => {
      if (w.mastered) {
        delete records.wrongWords[key];
        removed++;
      }
    });
    if (!removed) {
      this.showToast('没有已掌握的错词');
      return;
    }
    this.saveRecords(records);
    this.renderWrongBook();
    this.showToast(`已清除 ${removed} 个已掌握错词`);
  },

  startWrongBookPractice() {
    const filterUnit = this.wrongbookFilter === 'unit';
    const entries = this.getWrongWordEntries(filterUnit);
    if (!entries.length) {
      this.showToast('没有错词需要复习');
      return;
    }
    this.wbPractice = {
      queue: this.shuffle(entries.map((e) => ({ ...e }))),
      index: 0,
      correct: 0,
      wrong: 0,
      answered: false
    };
    document.getElementById('wrongbookPractice').hidden = false;
    document.getElementById('wrongbookList').style.display = 'none';
    document.querySelector('.wrongbook-actions').style.display = 'none';
    this.renderWrongBookPractice();
  },

  hideWrongBookPractice() {
    document.getElementById('wrongbookPractice').hidden = true;
    document.getElementById('wrongbookList').style.display = '';
    document.querySelector('.wrongbook-actions').style.display = '';
    this.wbPractice = { queue: [], index: 0, correct: 0, wrong: 0, answered: false };
  },

  renderWrongBookPractice() {
    const { queue, index, correct, wrong, answered } = this.wbPractice;
    const item = queue[index];

    document.getElementById('wbCorrect').textContent = correct;
    document.getElementById('wbWrong').textContent = wrong;
    document.getElementById('wbIndex').textContent = queue.length ? index + 1 : 0;
    document.getElementById('wbTotal').textContent = queue.length;

    const input = document.getElementById('wbInput');
    const feedback = document.getElementById('wbFeedback');
    const nextBtn = document.getElementById('wbNext');

    if (!item) {
      document.getElementById('wbCn').textContent = '错词复习完成！';
      document.getElementById('wbPhonetic').textContent = `正确 ${correct}，错误 ${wrong}`;
      input.value = '';
      input.disabled = true;
      feedback.textContent = wrong === 0 ? '全部掌握，太棒了！' : '继续加油，错词已更新到错词本';
      feedback.className = 'dictation-feedback ok';
      nextBtn.hidden = true;
      this.renderWrongBook();
      return;
    }

    document.getElementById('wbCn').textContent = item.cn;
    document.getElementById('wbPhonetic').textContent = answered ? item.phonetic : '（听发音可辅助记忆）';
    input.value = '';
    input.disabled = answered;
    input.className = 'dictation-input';
    feedback.textContent = '';
    feedback.className = 'dictation-feedback';
    nextBtn.hidden = !answered;
    if (!answered) setTimeout(() => document.getElementById('wbInput')?.focus(), 100);
  },

  submitWrongBookPractice() {
    if (this.wbPractice.answered) return;
    const item = this.wbPractice.queue[this.wbPractice.index];
    if (!item) return;

    const input = document.getElementById('wbInput');
    const answer = input.value.trim().toLowerCase();
    const correct = answer === item.en.toLowerCase();
    const feedback = document.getElementById('wbFeedback');

    this.wbPractice.answered = true;
    const savedUnit = this.currentUnitId;
    this.currentUnitId = item.unitId;

    if (correct) {
      this.wbPractice.correct++;
      input.classList.add('correct');
      feedback.textContent = '✅ 正确！';
      feedback.className = 'dictation-feedback ok';
      this.speakWord(item);
      this.onWordAnsweredCorrect(item);
      this.trackDailyActivity('wrongbook');
      const stillInBook = this.getRecords().wrongWords?.[item.key];
      if (!stillInBook) {
        this.wbPractice.queue.splice(this.wbPractice.index, 1);
        this.wbPractice.answered = false;
        this.currentUnitId = savedUnit;
        this.renderWrongBookPractice();
        return;
      }
    } else {
      this.wbPractice.wrong++;
      input.classList.add('wrong');
      feedback.textContent = `❌ 正确答案：${item.en}`;
      feedback.className = 'dictation-feedback err';
      this.addToWrongBook(item, answer, true);
    }

    this.currentUnitId = savedUnit;
    document.getElementById('wbPhonetic').textContent = item.phonetic;
    input.disabled = true;
    document.getElementById('wbNext').hidden = false;
  },

  nextWrongBookPractice() {
    this.wbPractice.index++;
    this.wbPractice.answered = false;
    this.renderWrongBookPractice();
  },

  showWrongBookHint() {
    const item = this.wbPractice.queue[this.wbPractice.index];
    if (!item || this.wbPractice.answered) return;
    const input = document.getElementById('wbInput');
    if (!input.value) input.value = item.en.charAt(0);
    this.showToast(`提示：首字母是 ${item.en.charAt(0).toUpperCase()}`);
  },

  /* ---------- 课文跟读 ---------- */
  bindReading() {
    document.getElementById('lessonSelectReading').addEventListener('change', () => {
      this.stopLessonAudio();
      this.renderReading();
    });
    document.getElementById('playLessonAudio').addEventListener('click', () => this.playLessonAudio());
    document.getElementById('stopLessonAudio').addEventListener('click', () => this.stopLessonAudio());
    document.getElementById('markReadingDone').addEventListener('click', () => this.markReadingDone());
  },

  renderReading() {
    const lessonId = document.getElementById('lessonSelectReading').value;
    const lesson = this.getLessonById(lessonId);
    const container = document.getElementById('readingLines');
    const records = this.getRecords();
    if (!lesson) return;

    container.innerHTML = lesson.lines
      .map((line, i) => {
        const scoreKey = `${this.currentUnitId}::${lessonId}::line${i}`;
        const speechRec = records.speechScores?.[scoreKey];
        const scoreHtml = speechRec
          ? `<div class="line-score">最高分 ${speechRec.bestScore} 分 ${SpeechScore.getGrade(speechRec.bestScore).stars}</div>`
          : '';
        return `
        <div class="lesson-line" data-line="${i}">
          <div class="en">${line.en}</div>
          <div class="cn">${line.cn}</div>
          ${scoreHtml}
          <div class="line-actions">
            <button class="btn btn-sm" data-speak-line="${i}">🔊 朗读本句</button>
            <button class="btn btn-sm btn-record" data-record-line="${i}">🎤 跟读打分</button>
          </div>
        </div>`;
      })
      .join('');

    container.querySelectorAll('[data-speak-line]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.speakLine, 10);
        this.highlightReadingLine(idx);
        this.speakText(lesson.lines[idx].en);
      });
    });

    container.querySelectorAll('[data-record-line]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.recordLine, 10);
        const line = lesson.lines[idx];
        const scoreKey = `${this.currentUnitId}::${lessonId}::line${idx}`;
        this.openSpeechModal({
          type: 'sentence',
          expected: line.en,
          expectedCn: line.cn,
          saveKey: scoreKey,
          speakFn: () => this.speakText(line.en),
          onDone: () => this.renderReading()
        });
      });
    });
  },

  highlightReadingLine(index) {
    document.querySelectorAll('#readingLines .lesson-line').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    this.readingLineIndex = index;
  },

  playLessonAudio() {
    const lessonId = document.getElementById('lessonSelectReading').value;
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return;

    this.stopLessonAudio();
    this.ensureSpeechUnlocked();

    // 没有真人音频：逐句同步朗读（iOS 关键）
    if (this.audioAvailable === false) {
      document.getElementById('audioTip').textContent = '正在用浏览器朗读课文…';
      this.speakLessonLines(lesson.lines, 0);
      return;
    }

    const audio = new Audio(lesson.audio);
    this.lessonAudio = audio;

    audio.addEventListener('error', () => {
      document.getElementById('audioTip').textContent = '未找到音频文件，正在用浏览器朗读全文…';
      this.speakText(lesson.lines.map((l) => l.en).join('. '));
    });

    audio.addEventListener('play', () => {
      document.getElementById('audioTip').textContent = `正在播放：${lesson.audio}`;
    });

    let lineIdx = 0;
    const interval = setInterval(() => {
      if (audio.paused || audio.ended) {
        clearInterval(interval);
        return;
      }
      this.highlightReadingLine(lineIdx % lesson.lines.length);
      lineIdx++;
    }, 3000);

    audio.addEventListener('ended', () => clearInterval(interval));
    audio.play().catch(() => {
      document.getElementById('audioTip').textContent = '播放失败，请检查音频文件或使用单句朗读';
      this.speakText(lesson.lines.map((l) => l.en).join('. '));
    });
  },

  stopLessonAudio() {
    if (this.lessonAudio) {
      this.lessonAudio.pause();
      this.lessonAudio = null;
    }
    window.speechSynthesis.cancel();
  },

  markReadingDone() {
    const lessonId = document.getElementById('lessonSelectReading').value;
    const records = this.getRecords();
    const key = `${this.currentUnitId}::${lessonId}`;
    records.reading[key] = {
      done: true,
      date: new Date().toISOString(),
      unitId: this.currentUnitId,
      lessonId
    };
    this.saveRecords(records);
    this.trackDailyActivity('reading');
    document.querySelectorAll('#readingLines .lesson-line').forEach((el) => el.classList.add('done-reading'));
    this.showToast('课文跟读打卡成功！');
  },

  /* ---------- 课文背诵 ---------- */
  bindRecite() {
    document.getElementById('lessonSelectRecite').addEventListener('change', () => this.renderRecite());
    document.getElementById('reciteMode').addEventListener('change', () => this.renderRecite());
    document.getElementById('reciteRevealAll').addEventListener('click', () => this.revealAllRecite(true));
    document.getElementById('reciteHideAll').addEventListener('click', () => this.renderRecite());
    document.getElementById('markReciteDone').addEventListener('click', () => this.markReciteDone());
  },

  maskSentence(text, mode) {
    const words = text.split(/(\s+)/);
    if (mode === 'cn') return '______';
    if (mode === 'blank') {
      return words
        .map((w) => {
          if (/^\s+$/.test(w)) return w;
          return `<span class="blank-word" data-word="${w}">?</span>`;
        })
        .join('');
    }
    // half
    return words
      .map((w, i) => {
        if (/^\s+$/.test(w)) return w;
        if (i % 2 === 0) return `<span class="blank-word" data-word="${w}">?</span>`;
        return w;
      })
      .join('');
  },

  renderRecite() {
    const lessonId = document.getElementById('lessonSelectRecite').value;
    const mode = document.getElementById('reciteMode').value;
    const lesson = this.getLessonById(lessonId);
    const container = document.getElementById('reciteLines');
    const records = this.getRecords();
    if (!lesson) return;

    container.innerHTML = lesson.lines
      .map((line, i) => {
        const masked =
          mode === 'cn'
            ? `<div class="en-masked">______</div>`
            : `<div class="en-masked">${this.maskSentence(line.en, mode)}</div>`;
        const scoreKey = `${this.currentUnitId}::${lessonId}::recite${i}`;
        const speechRec = records.speechScores?.[scoreKey];
        const scoreHtml = speechRec
          ? `<div class="line-score">背诵 ${speechRec.bestScore} 分 ${SpeechScore.getGrade(speechRec.bestScore).stars}</div>`
          : '';
        return `
        <div class="lesson-line recite-line" data-line="${i}">
          ${masked}
          <div class="cn">${line.cn}</div>
          ${scoreHtml}
          <div class="line-actions">
            <button class="btn btn-sm btn-record" data-recite-record="${i}">🎤 背诵打分</button>
          </div>
        </div>`;
      })
      .join('');

    container.querySelectorAll('.blank-word').forEach((el) => {
      el.addEventListener('click', () => {
        el.textContent = el.dataset.word;
        el.classList.add('revealed');
      });
    });

    container.querySelectorAll('[data-recite-record]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.reciteRecord, 10);
        const line = lesson.lines[idx];
        const scoreKey = `${this.currentUnitId}::${lessonId}::recite${idx}`;
        this.openSpeechModal({
          type: 'sentence',
          expected: line.en,
          expectedCn: line.cn,
          saveKey: scoreKey,
          speakFn: () => this.speakText(line.en),
          onDone: () => this.renderRecite()
        });
      });
    });
  },

  revealAllRecite() {
    document.querySelectorAll('#reciteLines .blank-word').forEach((el) => {
      el.textContent = el.dataset.word;
      el.classList.add('revealed');
    });
    document.querySelectorAll('#reciteLines .en-masked').forEach((el) => {
      if (el.textContent === '______') {
        const line = el.closest('.recite-line');
        const idx = parseInt(line.dataset.line, 10);
        const lessonId = document.getElementById('lessonSelectRecite').value;
        const lesson = this.getLessonById(lessonId);
        el.textContent = lesson.lines[idx].en;
        el.classList.add('revealed');
      }
    });
  },

  markReciteDone() {
    const lessonId = document.getElementById('lessonSelectRecite').value;
    const records = this.getRecords();
    const key = `${this.currentUnitId}::${lessonId}`;
    records.recite[key] = {
      done: true,
      date: new Date().toISOString(),
      unitId: this.currentUnitId,
      lessonId
    };
    this.saveRecords(records);
    this.trackDailyActivity('recite');
    this.showToast('课文背诵打卡成功！太厉害了！');
  },

  /* ---------- 学习记录 ---------- */
  bindRecords() {
    document.getElementById('exportRecords').addEventListener('click', () => this.exportRecords());
    document.getElementById('clearRecords').addEventListener('click', () => {
      if (confirm('确定要清空所有学习记录吗？此操作不可恢复。')) {
        localStorage.removeItem(STORAGE_KEY);
        this.showToast('记录已清空');
        this.renderRecords();
        this.renderCheckin();
        this.renderWrongBook();
        this.updateDailyBadge();
      }
    });
  },

  renderRecords() {
    const records = this.getRecords();
    const summary = document.getElementById('recordsSummary');
    const detail = document.getElementById('recordsDetail');

    let totalWords = 0;
    let checkedWords = 0;
    PEP_GRADE3_BOOK.units.forEach((unit) => {
      totalWords += unit.words.length;
      unit.words.forEach((w) => {
        if (records.words[this.wordKey(unit.id, w.en)]?.checked) checkedWords++;
      });
    });

    const readingDone = Object.keys(records.reading).filter((k) => records.reading[k].done).length;
    const reciteDone = Object.keys(records.recite).filter((k) => records.recite[k].done).length;
    const dictationCount = Object.keys(records.dictation).length;
    const wrongCount = this.getWrongWordEntries().length;
    const speechCount = Object.keys(records.speechScores || {}).length;
    const speechPass = Object.values(records.speechScores || {}).filter((s) => s.bestScore >= 75).length;

    summary.innerHTML = `
      <div class="stat-card"><div class="value">${checkedWords}</div><div class="label">单词已打卡</div></div>
      <div class="stat-card"><div class="value">${totalWords}</div><div class="label">单词总数</div></div>
      <div class="stat-card"><div class="value">${wrongCount}</div><div class="label">错词待复习</div></div>
      <div class="stat-card"><div class="value">${speechPass}</div><div class="label">口语达标</div></div>
      <div class="stat-card"><div class="value">${speechCount}</div><div class="label">录音记录</div></div>
      <div class="stat-card"><div class="value">${readingDone}</div><div class="label">跟读完成</div></div>
      <div class="stat-card"><div class="value">${reciteDone}</div><div class="label">背诵完成</div></div>
      <div class="stat-card"><div class="value">${dictationCount}</div><div class="label">默写记录</div></div>
    `;

    detail.innerHTML = PEP_GRADE3_BOOK.units
      .map((unit) => {
        const unitChecked = unit.words.filter(
          (w) => records.words[this.wordKey(unit.id, w.en)]?.checked
        ).length;
        const dict = records.dictation[unit.id];
        const unitReading = unit.lessons.filter((l) =>
          records.reading[`${unit.id}::${l.id}`]?.done
        ).length;
        const unitRecite = unit.lessons.filter((l) =>
          records.recite[`${unit.id}::${l.id}`]?.done
        ).length;

        return `
        <div class="unit-record">
          <h3>Unit ${unit.number} ${unit.titleCn}</h3>
          <div class="record-row"><span>单词打卡</span><span>${unitChecked} / ${unit.words.length}</span></div>
          <div class="record-row"><span>课文跟读</span><span>${unitReading} / ${unit.lessons.length}</span></div>
          <div class="record-row"><span>课文背诵</span><span>${unitRecite} / ${unit.lessons.length}</span></div>
          <div class="record-row"><span>最近默写</span><span>${
            dict ? `${dict.score}%（${dict.correct}/${dict.total}）` : '暂无'
          }</span></div>
        </div>`;
      })
      .join('');

    if (records.updatedAt) {
      detail.innerHTML += `<p class="hint" style="margin-top:12px">最后更新：${new Date(records.updatedAt).toLocaleString('zh-CN')}</p>`;
    }
  },

  exportRecords() {
    const data = JSON.stringify(this.getRecords(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `英语打卡记录_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('记录已导出');
  },

  /* ---------- 录音打分 ---------- */
  bindSpeechModal() {
    document.getElementById('speechModalClose').addEventListener('click', () => this.closeSpeechModal());
    document.getElementById('speechModalBackdrop').addEventListener('click', () => this.closeSpeechModal());
    document.getElementById('speechListenBtn').addEventListener('click', () => {
      this.speechSession?.speakFn?.();
    });
    document.getElementById('speechRecordBtn').addEventListener('click', () => this.toggleSpeechRecording());
    document.getElementById('speechRetryBtn').addEventListener('click', () => this.resetSpeechModalUI());
    document.getElementById('speechReplayBtn').addEventListener('click', () => SpeechScore.playRecording());
    document.getElementById('speechDoneBtn').addEventListener('click', () => this.closeSpeechModal());
    document.querySelectorAll('.manual-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.dataset.rating, 10);
        this.finishSpeechScore(score, '（手动自评）');
      });
    });
  },

  openSpeechModal(session) {
    this.speechSession = session;
    this.speechRecording = false;
    const modal = document.getElementById('speechModal');
    modal.hidden = false;

    document.getElementById('speechModalTitle').textContent =
      session.type === 'word' ? '单词录音打分' : '句子录音打分';
    document.getElementById('speechExpected').textContent = session.expected;
    document.getElementById('speechExpectedCn').textContent = session.expectedCn || '';

    const useAuto = SpeechScore.supportsRecognition();
    const useMic = SpeechScore.supportsRecording();
    let hint = '先听标准发音，再点击录音跟读';
    if (!useAuto && useMic) hint = '将录制你的声音，回放后请手动选择评价';
    if (!useAuto && !useMic) hint = '当前浏览器不支持麦克风，请使用 Chrome / Edge';
    document.getElementById('speechHint').textContent = hint;

    document.getElementById('speechRecordBtn').disabled = !useAuto && !useMic;
    this.resetSpeechModalUI();
  },

  resetSpeechModalUI() {
    SpeechScore.cleanup();
    this.speechRecording = false;
    const btn = document.getElementById('speechRecordBtn');
    btn.textContent = '🎤 开始录音';
    btn.classList.remove('recording');
    document.getElementById('speechStatus').textContent = '';
    document.getElementById('speechResult').hidden = true;
    document.getElementById('speechManual').hidden = true;
    document.getElementById('speechReplayBtn').hidden = true;
    document.getElementById('speechControls')?.classList?.remove('hidden');
  },

  closeSpeechModal() {
    SpeechScore.cleanup();
    this.speechRecording = false;
    document.getElementById('speechModal').hidden = true;
    const cb = this.speechSession?.onDone;
    this.speechSession = null;
    if (cb) cb();
  },

  async toggleSpeechRecording() {
    if (this.speechRecording) {
      await this.stopSpeechRecording();
      return;
    }
    await this.startSpeechRecording();
  },

  async startSpeechRecording() {
    const session = this.speechSession;
    if (!session) return;

    this.resetSpeechModalUI();
    this.speechRecording = true;
    const btn = document.getElementById('speechRecordBtn');
    btn.textContent = '⏹ 停止录音';
    btn.classList.add('recording');
    document.getElementById('speechStatus').textContent = '正在录音，请大声朗读…';

    const useAuto = SpeechScore.supportsRecognition();
    const useMic = SpeechScore.supportsRecording();

    try {
      if (useMic) await SpeechScore.startRecording();
    } catch {
      this.showToast('无法访问麦克风，请检查权限');
      this.resetSpeechModalUI();
      return;
    }

    if (useAuto) {
      this._recognizePromise = SpeechScore.recognizeOnce(
        session.type === 'word' ? 6000 : 12000
      );
    } else {
      this._recognizePromise = Promise.resolve([]);
    }
  },

  async stopSpeechRecording() {
    if (!this.speechRecording) return;
    this.speechRecording = false;
    const btn = document.getElementById('speechRecordBtn');
    btn.textContent = '🎤 开始录音';
    btn.classList.remove('recording');
    document.getElementById('speechStatus').textContent = '正在评分…';

    const session = this.speechSession;
    SpeechScore.stopRecognition();
    let transcripts = [];
    try {
      transcripts = await (this._recognizePromise || Promise.resolve([]));
    } catch {
      transcripts = [];
    }

    if (SpeechScore.supportsRecording()) {
      await SpeechScore.stopRecording();
      document.getElementById('speechReplayBtn').hidden = !SpeechScore.audioUrl;
    }

    const useAuto = SpeechScore.supportsRecognition();
    if (useAuto && transcripts.length) {
      const { score, transcript } = SpeechScore.calcScore(
        session.expected,
        transcripts,
        session.type
      );
      this.finishSpeechScore(score, transcript);
    } else if (useAuto && !transcripts.length) {
      document.getElementById('speechStatus').textContent = '未识别到语音，请重试或手动评价';
      document.getElementById('speechManual').hidden = !SpeechScore.audioUrl;
    } else {
      document.getElementById('speechStatus').textContent = '录音完成，请回放并自评';
      document.getElementById('speechManual').hidden = false;
    }
  },

  finishSpeechScore(score, transcript) {
    const session = this.speechSession;
    if (!session) return;

    const grade = SpeechScore.getGrade(score);
    document.getElementById('speechStatus').textContent = '';
    document.getElementById('speechResult').hidden = false;
    document.getElementById('speechManual').hidden = true;

    const circle = document.getElementById('scoreCircle');
    circle.textContent = score;
    circle.className = `score-circle ${grade.class}`;
    document.getElementById('scoreStars').textContent = grade.stars;
    document.getElementById('scoreLabel').textContent = grade.label;
    document.getElementById('speechTranscript').textContent = transcript
      ? `识别结果：${transcript}`
      : '';

    this.saveSpeechScore(session.saveKey, {
      score,
      transcript,
      type: session.type,
      expected: session.expected
    });

    if (score >= 75 && session.type === 'word') {
      const unit = this.getUnit();
      const word = unit?.words.find((w) => w.en.toLowerCase() === session.expected.toLowerCase());
      if (word) {
        const records = this.getRecords();
        const key = this.wordKey(this.currentUnitId, word.en);
        if (!records.words[key]?.checked) {
          records.words[key] = {
            checked: true,
            checkedAt: new Date().toISOString(),
            unitId: this.currentUnitId,
            viaSpeech: true
          };
          this.saveRecords(records);
          this.trackDailyActivity('checkin');
          this.showToast(`口语 ${score} 分达标，已自动打卡！`);
        }
      }
    } else {
      this.showToast(`得分 ${score} 分，${grade.label}`);
    }
  },

  saveSpeechScore(key, data) {
    const records = this.getRecords();
    if (!records.speechScores) records.speechScores = {};
    const prev = records.speechScores[key];
    records.speechScores[key] = {
      bestScore: Math.max(prev?.bestScore || 0, data.score),
      lastScore: data.score,
      lastTranscript: data.transcript,
      type: data.type,
      expected: data.expected,
      attempts: (prev?.attempts || 0) + 1,
      lastAt: new Date().toISOString()
    };
    this.saveRecords(records);
    this.trackDailyActivity('speech');
  },

  /* ---------- 语音 ---------- */
  speakWord(word) {
    this.playAudioOrSpeak(word.audio, word.en);
  },

  // iOS Safari 需在用户手势内首次触发 TTS 才能解锁后续程序化朗读
  setupSpeechUnlock() {
    const unlock = () => this.ensureSpeechUnlocked();
    document.addEventListener('touchend', unlock, { passive: true });
    document.addEventListener('click', unlock);
    document.addEventListener('pointerdown', unlock);
  },

  ensureSpeechUnlocked() {
    if (this._speechUnlocked || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.resume();
      this._speechUnlocked = true;
    } catch (e) {
      /* 忽略解锁失败 */
    }
  },

  speakText(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      this.showToast('当前浏览器不支持语音朗读');
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      /* ignore */
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.8;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (enVoice) utter.voice = enVoice;
    if (typeof onEnd === 'function') utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
    // iOS 偶发暂停，主动恢复
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      /* ignore */
    }
  },

  // 逐句朗读课文并高亮当前句（首句在用户手势内触发，后续靠 onend 链式播放）
  speakLessonLines(lines, index) {
    if (!lines || index >= lines.length) {
      const tip = document.getElementById('audioTip');
      if (tip) tip.textContent = '朗读完成';
      return;
    }
    this.highlightReadingLine(index);
    this.speakText(lines[index].en, () => {
      this.speakLessonLines(lines, index + 1);
    });
  },

  // 启动时探测是否放置了真人 mp3 音频。未放置则走 TTS，
  // 并让点击时同步朗读（避免 iOS Safari 异步回调内被拦截而无声）。
  probeAudioAvailability() {
    const sample = PEP_GRADE3_BOOK?.units?.[0]?.words?.[0]?.audio;
    if (!sample) {
      this.audioAvailable = false;
      return;
    }
    fetch(sample, { method: 'GET', cache: 'no-store' })
      .then((r) => {
        const type = r.headers.get('content-type') || '';
        // 命中真实音频（存在且不是 404 HTML 页面）才算可用
        this.audioAvailable = r.ok && !type.includes('text/html');
      })
      .catch(() => {
        this.audioAvailable = false;
      });
  },

  playAudioOrSpeak(src, fallbackText) {
    // 先在手势内解锁语音
    this.ensureSpeechUnlocked();

    // 没有真人音频：直接同步朗读（iOS 关键，必须在用户手势内调用）
    if (this.audioAvailable === false) {
      this.speakText(fallbackText);
      return;
    }

    let audio;
    try {
      audio = new Audio(src);
    } catch (e) {
      this.speakText(fallbackText);
      return;
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        this.audioAvailable = false;
        this.speakText(fallbackText);
      });
    } else {
      audio.addEventListener('error', () => {
        this.audioAvailable = false;
        this.speakText(fallbackText);
      });
    }
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  App.init();
  App.updateWrongBookBadge();
  App.updateDailyBadge();
});
