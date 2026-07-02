/**
 * 每日任务与本地推送提醒
 * 纯本地实现，无需服务器
 */
const DailyPush = {
  _reminderTimer: null,

  getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  defaultSettings() {
    return {
      enabled: true,
      time: '19:00',
      lastNotifiedDate: null
    };
  },

  ensureStructures(records) {
    if (!records.dailyLog) records.dailyLog = {};
    if (!records.pushSettings) records.pushSettings = this.defaultSettings();
    if (!records.streak) records.streak = { current: 0, best: 0, lastDoneDate: null };

    const key = this.getTodayKey();
    if (!records.dailyLog[key]) {
      records.dailyLog[key] = {
        checkins: 0,
        dictation: false,
        wrongbook: 0,
        reading: false,
        recite: false,
        speech: 0
      };
    }
    return records;
  },

  getTaskDefinitions(records) {
    const wrongCount = Object.values(records.wrongWords || {}).filter((w) => !w.mastered).length;
    const tasks = [
      {
        id: 'checkin',
        type: 'checkin',
        title: '单词打卡 5 个',
        desc: '学习新单词，点击「学会了」打卡',
        target: 5,
        tab: 'checkin',
        icon: '📋'
      },
      {
        id: 'dictation',
        type: 'dictation',
        title: '完成单词默写',
        desc: '在默写模块完成一次本单元练习',
        target: 1,
        tab: 'dictation',
        icon: '✏️'
      },
      {
        id: 'speech',
        type: 'speech',
        title: '录音打分 3 次',
        desc: '跟读单词或课文，练习口语',
        target: 3,
        tab: 'checkin',
        icon: '🎤'
      },
      {
        id: 'reading',
        type: 'reading',
        title: '课文跟读打卡',
        desc: '完成一篇课文跟读打卡',
        target: 1,
        tab: 'reading',
        icon: '🔊'
      }
    ];

    if (wrongCount > 0) {
      tasks.splice(2, 0, {
        id: 'wrongbook',
        type: 'wrongbook',
        title: '复习错词 3 个',
        desc: `错词本中有 ${wrongCount} 个词待复习`,
        target: 3,
        tab: 'wrongbook',
        icon: '📕'
      });
    }

    return tasks;
  },

  getLogValue(log, type) {
    if (type === 'dictation' || type === 'reading' || type === 'recite') {
      return log[type] ? 1 : 0;
    }
    return log[type] || 0;
  },

  getTaskProgress(task, log) {
    const current = this.getLogValue(log, task.type);
    return Math.min(current, task.target);
  },

  isTaskDone(task, log) {
    return this.getLogValue(log, task.type) >= task.target;
  },

  getTodayStatus(records) {
    records = this.ensureStructures({ ...records });
    const key = this.getTodayKey();
    const log = records.dailyLog[key];
    const tasks = this.getTaskDefinitions(records);
    const items = tasks.map((task) => ({
      ...task,
      current: this.getLogValue(log, task.type),
      progress: this.getTaskProgress(task, log),
      done: this.isTaskDone(task, log)
    }));
    const doneCount = items.filter((t) => t.done).length;
    const total = items.length;
    const allDone = doneCount === total;
    return { key, log, tasks: items, doneCount, total, allDone };
  },

  updateStreak(records) {
    records = this.ensureStructures(records);
    const status = this.getTodayStatus(records);
    const today = this.getTodayKey();
    const streak = records.streak;

    if (status.allDone && streak.lastDoneDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (streak.lastDoneDate === yKey) {
        streak.current += 1;
      } else {
        streak.current = 1;
      }
      streak.best = Math.max(streak.best, streak.current);
      streak.lastDoneDate = today;
    }
    return records;
  },

  buildNotificationBody(records) {
    const status = this.getTodayStatus(records);
    if (status.allDone) {
      return `今日 ${status.total} 项任务已全部完成，连续打卡 ${records.streak?.current || 0} 天！`;
    }
    const pending = status.tasks.filter((t) => !t.done).slice(0, 3);
    const list = pending.map((t) => t.title).join('、');
    return `还有 ${status.total - status.doneCount} 项未完成：${list}`;
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      return reg;
    } catch {
      return null;
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  },

  async showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body
      });
      return true;
    }

    try {
      const reg = await this.registerServiceWorker();
      if (reg?.active) {
        reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
        return true;
      }
    } catch {}

    new Notification(title, { body, tag: 'pep-daily-task' });
    return true;
  },

  shouldNotifyNow(settings) {
    if (!settings.enabled) return false;
    const today = this.getTodayKey();
    if (settings.lastNotifiedDate === today) return false;

    const [hh, mm] = (settings.time || '19:00').split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    return now >= target;
  },

  async checkAndNotify(records, force = false) {
    records = this.ensureStructures(records);
    const settings = records.pushSettings;

    if (!force && !this.shouldNotifyNow(settings)) return records;

    if (Notification.permission !== 'granted') return records;

    const status = this.getTodayStatus(records);
    if (status.allDone && !force) {
      settings.lastNotifiedDate = this.getTodayKey();
      return records;
    }

    const title = status.allDone ? '🎉 今日任务已完成' : '📬 英语打卡提醒';
    const body = this.buildNotificationBody(records);
    await this.showNotification(title, body);
    settings.lastNotifiedDate = this.getTodayKey();
    return records;
  },

  startReminderLoop(getRecords, saveRecords) {
    if (this._reminderTimer) clearInterval(this._reminderTimer);
    this._reminderTimer = setInterval(async () => {
      let records = getRecords();
      records = this.ensureStructures(records);
      const before = records.pushSettings.lastNotifiedDate;
      records = await this.checkAndNotify(records);
      if (records.pushSettings.lastNotifiedDate !== before) {
        saveRecords(records);
      }
    }, 60000);
  },

  async init(getRecords, saveRecords) {
    await this.registerServiceWorker();
    let records = getRecords();
    records = this.ensureStructures(records);
    records = this.updateStreak(records);
    saveRecords(records);

    this.startReminderLoop(getRecords, saveRecords);

    if (Notification.permission === 'granted' && records.pushSettings.enabled) {
      const status = this.getTodayStatus(records);
      const today = this.getTodayKey();
      if (!status.allDone && records.pushSettings.lastOpenNotifyDate !== today) {
        await this.showNotification(
          '📬 今日学习任务',
          this.buildNotificationBody(records)
        );
        records.pushSettings.lastOpenNotifyDate = today;
        saveRecords(records);
      }
    }
  }
};
