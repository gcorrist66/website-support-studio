(function () {
  var allowedEvents = {
    page_view: true,
    outbound_click: true,
    phone_click: true,
    form_submit: true,
    portal_preview_click: true
  };
  var portalUrl = 'https://websitesupportstudio.com/templates/sample/back-office';

  function prospectSlug() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'previews' && parts[1]) return parts[1];
    return parts[0] || 'index';
  }

  function cleanTarget(value) {
    if (!value) return '';
    return String(value).slice(0, 300);
  }

  function track(eventName, detail) {
    if (!allowedEvents[eventName]) return;
    var payload = {
      event: eventName,
      prospectSlug: prospectSlug(),
      path: window.location.pathname,
      hostname: window.location.hostname,
      target: cleanTarget(detail && detail.target),
      label: cleanTarget(detail && detail.label),
      ts: new Date().toISOString()
    };
    var body = JSON.stringify(payload);
    fetch('/api/preview-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body,
      keepalive: true
    }).catch(function () {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/preview-event', blob);
      }
    });
  }

  function closestAnchor(node) {
    while (node && node !== document) {
      if (node.tagName && node.tagName.toLowerCase() === 'a') return node;
      node = node.parentNode;
    }
    return null;
  }

  document.addEventListener('click', function (event) {
    var anchor = closestAnchor(event.target);
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    if (!href) return;
    var label = (anchor.textContent || '').replace(/\s+/g, ' ').trim();

    if (href.indexOf('tel:') === 0) {
      track('phone_click', { target: href, label: label });
      return;
    }

    var absoluteUrl;
    try {
      absoluteUrl = new URL(href, window.location.href);
    } catch (error) {
      return;
    }

    if (absoluteUrl.href.indexOf(portalUrl) === 0) {
      track('portal_preview_click', { target: absoluteUrl.href, label: label });
    }

    if (absoluteUrl.hostname && absoluteUrl.hostname !== window.location.hostname && absoluteUrl.protocol.indexOf('http') === 0) {
      track('outbound_click', { target: absoluteUrl.href, label: label });
    }
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.tagName.toLowerCase() !== 'form') return;
    track('form_submit', {
      target: form.getAttribute('action') || window.location.pathname,
      label: form.getAttribute('id') || form.getAttribute('name') || ''
    });
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      track('page_view');
    }, { once: true });
  } else {
    track('page_view');
  }
})();
