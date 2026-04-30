(() => {
  const PENDING_KEY = 'jobClipper.notebooklm.pending';
  const NOTEBOOKS_KEY = 'jobClipper.notebooklm.notebooks';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function chromeCall(apiCall) {
    return new Promise((resolve, reject) => {
      apiCall((result) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }

  async function loadPending() {
    const data = await chromeCall((done) => chrome.storage.local.get([PENDING_KEY], done));
    const pending = data[PENDING_KEY];
    if (!pending || Date.now() - pending.createdAt > 30 * 60 * 1000) return null;
    return pending;
  }

  async function clearPending() {
    await chromeCall((done) => chrome.storage.local.remove([PENDING_KEY], done));
  }

  function textOf(node) {
    return (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function cleanNotebookTitle(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/^(open|打开)\s+/i, '')
      .trim();
  }

  function notebookUrl(url) {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin !== location.origin) return '';
      if (!/\/notebook\//.test(parsed.pathname)) return '';
      parsed.search = '';
      parsed.hash = '';
      return parsed.href;
    } catch (_error) {
      return '';
    }
  }

  function extractPageValue(key, text) {
    const match = String(text || '').match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
    return match ? match[1] : '';
  }

  async function notebookLmAuthParams() {
    let html = document.documentElement.innerHTML;
    let at = extractPageValue('SNlM0e', html);
    let bl = extractPageValue('cfb2h', html);
    if (at && bl) return { at, bl };

    const response = await fetch('/', { credentials: 'include' });
    html = await response.text();
    at = extractPageValue('SNlM0e', html);
    bl = extractPageValue('cfb2h', html);
    if (!at || !bl) throw new Error('NotebookLM 登录信息未就绪');
    return { at, bl };
  }

  function parseBatchExecuteResponse(text) {
    const lines = String(text || '').split('\n').filter(Boolean);
    const payloadLine = lines.find((line) => line.startsWith('[['));
    if (!payloadLine) return [];
    const chunks = JSON.parse(payloadLine);
    return chunks
      .filter((chunk) => chunk?.[0] === 'wrb.fr')
      .map((chunk) => {
        try {
          return JSON.parse(chunk[2]);
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean);
  }

  function extractNotebookRecords(result) {
    const rawNotebooks = Array.isArray(result?.[0]) ? result[0] : Array.isArray(result) ? result : [];
    return rawNotebooks
      .filter((item) => Array.isArray(item))
      .map((item) => ({
        title: cleanNotebookTitle(item[0]),
        id: typeof item[2] === 'string' ? item[2] : ''
      }))
      .filter((item) =>
        item.title &&
        item.id &&
        item.title.length <= 120 &&
        /^[A-Za-z0-9_-]{8,}$/.test(item.id)
      );
  }

  async function listNotebooksViaRpc() {
    const { at, bl } = await notebookLmAuthParams();
    const rpcId = 'wXbhsf';
    const url = new URL('/_/LabsTailwindUi/data/batchexecute', location.origin);
    url.searchParams.set('rpcids', rpcId);
    url.searchParams.set('source-path', '/');
    url.searchParams.set('bl', bl);
    url.searchParams.set('hl', document.documentElement.lang || 'zh-CN');
    url.searchParams.set('_reqid', String(Math.floor(Math.random() * 900000) + 100000));
    url.searchParams.set('rt', 'c');

    const body = new URLSearchParams();
    body.set('f.req', JSON.stringify([[[rpcId, JSON.stringify([null, 1, null, [2]]), null, 'generic']]]));
    body.set('at', at);

    const response = await fetch(url.toString(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body
    });
    const text = await response.text();
    const records = parseBatchExecuteResponse(text).flatMap((item) => extractNotebookRecords(item));
    const map = new Map();
    records.forEach((record) => {
      if (!record.title || !record.id) return;
      map.set(record.id, {
        title: record.title,
        url: `${location.origin}/notebook/${record.id}`,
        updatedAt: Date.now()
      });
    });
    return Array.from(map.values());
  }

  async function cacheNotebookList() {
    let rpcNotebooks = [];
    try {
      rpcNotebooks = await listNotebooksViaRpc();
    } catch (error) {
      console.info('[JobTracker NotebookLM] RPC list failed, falling back to DOM scan:', error.message);
    }
    if (rpcNotebooks.length) {
      await chromeCall((done) => chrome.storage.local.set({ [NOTEBOOKS_KEY]: rpcNotebooks }, done));
      return rpcNotebooks;
    }

    const links = queryAllDeep('a[href], [href], [data-url], [data-href], [routerlink]')
      .map((node) => ({
        title: cleanNotebookTitle(textOf(node) || node.getAttribute('aria-label') || node.getAttribute('title')),
        url: notebookUrl(
          node.getAttribute('href') ||
          node.getAttribute('data-url') ||
          node.getAttribute('data-href') ||
          node.getAttribute('routerlink')
        )
      }))
      .filter((item) => item.title && item.url && item.title.length <= 120);

    const map = new Map();
    links.forEach((item) => map.set(item.url, { ...item, updatedAt: Date.now() }));
    const notebooks = Array.from(map.values());
    if (!notebooks.length) return [];

    await chromeCall((done) => chrome.storage.local.set({ [NOTEBOOKS_KEY]: notebooks }, done));
    return notebooks;
  }

  function visible(node) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function findClickable(patterns) {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="button"], div[tabindex], span[tabindex]'));
    return nodes.find((node) => visible(node) && patterns.some((pattern) => pattern.test(textOf(node))));
  }

  function findClickableDeep(patterns) {
    const roots = [document, ...Array.from(document.querySelectorAll('*')).map((node) => node.shadowRoot).filter(Boolean)];
    for (const root of roots) {
      const nodes = Array.from(root.querySelectorAll('button, a, [role="button"], div[tabindex], span[tabindex], mat-card, mat-list-item'));
      const match = nodes.find((node) => visible(node) && patterns.some((pattern) => pattern.test(textOf(node))));
      if (match) return match;
    }
    return null;
  }

  function queryAllDeep(selector, scope = document) {
    const descendants = scope.querySelectorAll ? Array.from(scope.querySelectorAll('*')) : [];
    const roots = [scope, ...descendants.map((node) => node.shadowRoot).filter(Boolean)];
    return roots.flatMap((root) => Array.from(root.querySelectorAll(selector)));
  }

  function activeDialog() {
    const dialogs = queryAllDeep('[role="dialog"], .mat-mdc-dialog-container, dialog')
      .filter(visible)
      .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
    return dialogs[0] || document;
  }

  async function waitForClickable(patterns, timeout = 7000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const node = findClickable(patterns);
      if (node) return node;
      await sleep(250);
    }
    return null;
  }

  async function clickByText(patterns, timeout = 3000) {
    const node = await waitForClickable(patterns, timeout);
    if (!node) return false;
    node.click();
    return true;
  }

  async function clickSourceType(patterns, timeout = 7000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const node = findClickableDeep(patterns);
      if (node) {
        node.click();
        return true;
      }
      await sleep(250);
    }
    return false;
  }

  async function ensureAddSourceOpen(updateStatus) {
    if (/add_source=true/.test(location.href)) return true;
    updateStatus('尝试打开添加来源...');
    await clickByText([/^add source$/i, /add source/i, /upload source/i, /添加来源/, /新增来源/], 5000);
    await sleep(900);
    return true;
  }

  function inputText(node, value) {
    node.focus();
    if ('value' in node) {
      node.value = value;
      node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    node.textContent = value;
    node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    return true;
  }

  async function pasteText(node, value) {
    node.focus();

    try {
      await navigator.clipboard.writeText(value);
      const pasted = document.execCommand?.('paste');
      await sleep(250);
      if (pasted && currentText(node).length > 20) return true;
    } catch (_error) {
      // Fall through to direct input.
    }

    inputText(node, value);
    await sleep(250);
    return currentText(node).length > 20;
  }

  function currentText(node) {
    if ('value' in node) return node.value || '';
    return node.innerText || node.textContent || '';
  }

  function editorHint(node) {
    return [
      node.getAttribute('aria-label'),
      node.getAttribute('placeholder'),
      node.getAttribute('data-placeholder'),
      node.closest('[role="dialog"], .mat-mdc-dialog-container, dialog')?.innerText
    ].filter(Boolean).join(' ');
  }

  function fieldHint(node) {
    return [
      node.getAttribute('aria-label'),
      node.getAttribute('placeholder'),
      node.getAttribute('data-placeholder'),
      node.getAttribute('name'),
      node.getAttribute('id'),
      node.labels ? Array.from(node.labels).map(textOf).join(' ') : '',
      node.closest('label, mat-form-field, .mat-mdc-form-field')?.innerText
    ].filter(Boolean).join(' ');
  }

  async function waitForSourceEditor(timeout = 7000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const editors = sourceEditors();
      if (editors[0]) return editors[0];
      await sleep(250);
    }
    return null;
  }

  function sourceEditors() {
    const candidates = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
      .filter(visible)
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return br.width * br.height - ar.width * ar.height;
      });

    const hinted = candidates.filter((node) => {
      const hint = editorHint(node);
      return /paste|copied|text|source|content|粘贴|复制|文本|来源|内容/i.test(hint);
    });

    return hinted.length ? hinted : candidates;
  }

  function fillSourceTitle(title) {
    const cleanTitle = String(title || '岗位资料').trim();
    const selector = 'input:not([type="hidden"]):not([type="file"]), textarea, [contenteditable="true"], [role="textbox"]';
    const collectFields = (scope) => queryAllDeep(selector, scope)
      .filter(visible)
      .filter((node) => {
        const hint = fieldHint(node);
        const isInput = node.tagName === 'INPUT';
        if (/search|搜索|filter|筛选/i.test(hint)) return false;
        if (/title|name|标题|名称/i.test(hint)) return true;
        if (isInput && /source|来源/i.test(hint)) return true;
        return isInput && node.getBoundingClientRect().width >= 120;
      })
      .sort((a, b) => {
        const ah = /title|name|标题|名称|source|来源/i.test(fieldHint(a)) ? 0 : 1;
        const bh = /title|name|标题|名称|source|来源/i.test(fieldHint(b)) ? 0 : 1;
        if (ah !== bh) return ah - bh;
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      });

    const scopedFields = collectFields(activeDialog());
    const fields = scopedFields.length ? scopedFields : collectFields(document);
    const target = fields.find((node) => node.tagName === 'INPUT') || fields[0];
    if (!target) return false;
    return inputText(target, cleanTitle);
  }

  async function tryAddCopiedTextSource(source, updateStatus) {
    await ensureAddSourceOpen(updateStatus);

    updateStatus('尝试选择“复制文字/粘贴文本”来源...');
    const selectedTextSource = await clickSourceType([
      /^copied text$/i,
      /^paste text$/i,
      /paste copied text/i,
      /copied text/i,
      /paste text/i,
      /^复制文字$/,
      /^复制文本$/,
      /^粘贴文本$/,
      /^复制的文本$/,
      /复制.*文字/,
      /复制.*文本/,
      /粘贴.*文本/,
      /text pasted from clipboard/i
    ], 8000);

    if (!selectedTextSource) {
      const hasUpload = findClickableDeep([/^upload files?$/i, /^上传文件$/, /上传.*文件/]);
      updateStatus(hasUpload
        ? '找到了上传文件入口，但没有找到“复制文字/粘贴文本”入口。'
        : '没有找到“复制文字/粘贴文本”来源按钮。');
      return false;
    }

    await sleep(1200);
    updateStatus(`尝试粘贴来源：${source.title}`);
    const titleFilledBeforePaste = fillSourceTitle(source.title || '岗位资料');
    const editor = await waitForSourceEditor();
    if (!editor) {
      updateStatus('没有找到文本来源输入框。请点“复制内容”后手动粘贴。');
      return false;
    }

    const filled = await pasteText(editor, source.markdown);
    if (!filled) {
      updateStatus('已复制内容，但自动粘贴被 NotebookLM 拦截。请在文本框内手动粘贴。');
      return false;
    }

    await sleep(400);
    const titleFilledAfterPaste = fillSourceTitle(source.title || '岗位资料');
    if (!titleFilledBeforePaste && !titleFilledAfterPaste) {
      updateStatus('没有找到可填写来源名称的输入框，已把岗位名和公司名放在正文第一行。');
    }
    await clickByText([/^insert$/i, /^import$/i, /^add source$/i, /^submit$/i, /^done$/i, /^continue$/i, /^添加来源$/, /^导入$/, /^插入$/, /^提交$/, /^完成$/, /^继续$/], 5000);
    updateStatus('已尝试把岗位信息添加为文本来源。');
    return true;
  }

  function pendingSources(pending) {
    if (Array.isArray(pending.sources) && pending.sources.length) return pending.sources;
    return [{ title: pending.title || '岗位资料', markdown: pending.markdown || '' }];
  }

  async function tryAddAllSources(pending, updateStatus) {
    const sources = pendingSources(pending);
    for (let i = 0; i < sources.length; i += 1) {
      updateStatus(`正在添加 ${i + 1}/${sources.length}：${sources[i].title}`);
      const ok = await tryAddCopiedTextSource(sources[i], updateStatus);
      if (!ok) return false;
      await sleep(1200);
    }
    updateStatus(`已尝试添加 ${sources.length} 条岗位来源。`);
    return true;
  }

  async function tryNewNotebook(pending, updateStatus) {
    updateStatus('尝试点击新建 Notebook...');
    await clickByText([/create new notebook/i, /^new notebook$/i, /新建.*notebook/i, /新建笔记本/, /^新建$/], 7000);
    await sleep(2500);
    const ok = await tryAddAllSources(pending, updateStatus);
    if (ok) await clearPending();
  }

  function isNotebookPage() {
    return /notebook|add_source=true/.test(location.href) || Boolean(findClickable([/add source/i, /添加来源/]));
  }

  function normalizedNotebookHref(value) {
    try {
      const url = new URL(value, location.href);
      url.search = '';
      url.hash = '';
      url.pathname = url.pathname.replace(/\/$/, '');
      return url.href;
    } catch (_error) {
      return '';
    }
  }

  function notebookIdFromUrl(value) {
    try {
      const url = new URL(value, location.href);
      return url.pathname.match(/\/notebook\/([^/?#]+)/)?.[1] || '';
    } catch (_error) {
      return '';
    }
  }

  function isTargetNotebookPage(pending) {
    const targetUrl = pending?.targetNotebook?.url;
    if (!targetUrl) return false;
    const currentId = notebookIdFromUrl(location.href);
    const targetId = notebookIdFromUrl(targetUrl);
    if (currentId && targetId) return currentId === targetId;
    const current = normalizedNotebookHref(location.href);
    const target = normalizedNotebookHref(targetUrl);
    return Boolean(current && target && current === target);
  }

  function renderPanel(pending) {
    const updateStatus = (message) => console.info('[JobTracker NotebookLM]', message);

    if (pending.mode === 'new') {
      setTimeout(() => tryNewNotebook(pending, updateStatus), 900);
      return;
    }

    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > 10 * 60 * 1000) {
        clearInterval(timer);
        return;
      }
      if (!isTargetNotebookPage(pending)) return;
      if (!isNotebookPage()) return;
      clearInterval(timer);
      const ok = await tryAddAllSources(pending, updateStatus);
      if (ok) await clearPending();
    }, 1000);
  }

  async function init() {
    cacheNotebookList().catch(() => {});
    setTimeout(() => cacheNotebookList().catch(() => {}), 1800);
    setTimeout(() => cacheNotebookList().catch(() => {}), 4200);
    setTimeout(() => cacheNotebookList().catch(() => {}), 8000);
    const pending = await loadPending();
    if (!pending) return;
    renderPanel(pending);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'JOBTRACKER_CACHE_NOTEBOOKS') return false;
    cacheNotebookList()
      .then((notebooks) => sendResponse({ ok: true, notebooks: notebooks || [] }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
