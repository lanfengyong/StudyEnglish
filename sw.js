const CACHE_NAME = 'pep-study-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(data.title || '英语打卡提醒', {
        body: data.body || '今日还有学习任务待完成',
        tag: 'pep-daily-task',
        renotify: true,
        requireInteraction: false
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'OPEN_DAILY' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./index.html#daily');
      }
    })
  );
});
