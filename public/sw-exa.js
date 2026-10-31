/* EXA · avisos no celular (Web Push). Não guarda cache e não intercepta nada: só recebe e mostra avisos. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { corpo: e.data ? e.data.text() : '' }; }
  var titulo = d.titulo || 'EXA';
  var opcoes = {
    body: d.corpo || '',
    icon: '/apple-touch-icon.png',
    badge: '/favicon-96x96.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '/' },
  };
  var tarefas = [self.registration.showNotification(titulo, opcoes)];
  if (typeof d.badge === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
    tarefas.push(d.badge > 0 ? self.navigator.setAppBadge(d.badge) : self.navigator.clearAppBadge());
  }
  e.waitUntil(Promise.all(tarefas).catch(function () {}));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  var alvo = new URL(url, self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        return c.focus().then(function (w) { return w && 'navigate' in w ? w.navigate(alvo) : null; });
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(alvo) : null;
  }));
});
