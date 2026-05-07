const STATE_KEY = 'jobClipper.state.v2';
const LEGACY_JOBS_KEY = 'jobClipper.jobs';
const NOTEBOOKLM_PENDING_KEY = 'jobClipper.notebooklm.pending';
const NOTEBOOKLM_NOTEBOOKS_KEY = 'jobClipper.notebooklm.notebooks';
const NOTEBOOKLM_URL = 'https://notebooklm.google.com/';

const NOISE_PATTERNS = [
  /^(登录|注册|退出|首页|消息|我的|搜索|筛选|排序|收藏|分享|举报|反馈)$/i,
  /微信扫码分享|扫码分享|分享\s*举报|微信.*举报/,
  /^(立即申请|申请职位|投递|立即投递|马上投递|继续沟通|立即沟通|在线沟通|联系招聘者)$/i,
  /^(打开App|下载App|扫码|微信扫一扫|使用App|在App中打开|去App查看)$/i,
  /^(相似职位|推荐职位|热门职位|为你推荐|看过该职位的人|职位竞争力|公司其他职位)/,
  /^(上一页|下一页|查看更多|查看全部|展开全部|收起|刷新|复制链接)$/i,
  /^(广告|推广|置顶|急招|最新)$/i,
  /^(招聘负责人|竞争力分析|查看完整个人竞争力)$/i,
  /^个人综合排名/,
  /^在人中排名第$/,
  /^你在.+位置$/,
  /^(一般|良好|优秀|极好)$/,
  /^一般\s+良好\s+优秀\s+极好$/,
  /^(BOSS\s*)?安全提示$/i,
  /^BOSS直聘严禁/,
  /损害求职者合法权益/,
  /扣押求职者证件|收取求职者财物|向求职者集资|诱导求职者异地入职/,
  /请立即举报/,
  /^(招聘者|HR|人事|刚刚活跃|今日活跃|本周活跃|在线)$/i,
  /(cookie|privacy|terms of use|all rights reserved|copyright)/i,
  /^(©|\(c\)|Copyright)/i
];

const SECTION_STOP_PATTERNS = [
  /^为什么选择/,
  /^为什么加入/,
  /^加入我们/,
  /^你将获得/,
  /^福利待遇/,
  /^职位亮点/,
  /^公司介绍/,
  /^工作地点/,
  /^工作地址/,
  /^招聘流程/,
  /^招聘负责人/,
  /^竞争力分析/,
  /^职位发布者:?/,
  /^拉勾安全提示/,
  /^面试评价/,
  /^推荐公司：?/,
  /^职场百科：?/
];

const els = {
  addBatch: document.querySelector('#addBatch'),
  batches: document.querySelector('#batches'),
  batchCount: document.querySelector('#batchCount'),
  savedCount: document.querySelector('#savedCount'),
  todayCount: document.querySelector('#todayCount'),
  clipCurrent: document.querySelector('#clipCurrent'),
  copyMarkdown: document.querySelector('#copyMarkdown'),
  downloadCsv: document.querySelector('#downloadCsv'),
  mergeDownload: document.querySelector('#mergeDownload'),
  clearBatch: document.querySelector('#clearBatch'),
  listActions: document.querySelector('#listActions'),
  selectAllJobs: document.querySelector('#selectAllJobs'),
  exportNotebookLM: document.querySelector('#exportNotebookLM'),
  notebookMenu: document.querySelector('#notebookMenu'),
  exportNewNotebook: document.querySelector('#exportNewNotebook'),
  exportExistingNotebook: document.querySelector('#exportExistingNotebook'),
  emptyState: document.querySelector('#emptyState'),
  emptyText: document.querySelector('#emptyText'),
  jobs: document.querySelector('#jobs'),
  status: document.querySelector('#status'),
  modalBackdrop: document.querySelector('#modalBackdrop'),
  batchModal: document.querySelector('#batchModal'),
  modalTitle: document.querySelector('#modalTitle'),
  modalMessage: document.querySelector('#modalMessage'),
  modalInput: document.querySelector('#modalInput'),
  modalCancel: document.querySelector('#modalCancel'),
  modalConfirm: document.querySelector('#modalConfirm'),
  notebookPickerBackdrop: document.querySelector('#notebookPickerBackdrop'),
  notebookPickerMessage: document.querySelector('#notebookPickerMessage'),
  notebookPickerList: document.querySelector('#notebookPickerList'),
  notebookPickerCancel: document.querySelector('#notebookPickerCancel')
};

let modalResolve = null;

function chromeCall(apiCall) {
  return new Promise((resolve, reject) => {
    apiCall((result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
      } else {
        resolve(result);
      }
    });
  });
}

function createBatch(name) {
  return {
    id: crypto.randomUUID(),
    name,
    userCreated: true,
    createdAt: new Date().toISOString(),
    jobs: []
  };
}

function defaultState() {
  return {
    activeBatchId: null,
    batches: []
  };
}

function normalizeState(state) {
  if (!state?.batches?.length) return defaultState();
  const batches = state.batches.map((batch, index) => ({
    id: batch.id || crypto.randomUUID(),
    name: batch.name || String(index + 1),
    userCreated: batch.userCreated === true,
    createdAt: batch.createdAt || new Date().toISOString(),
    jobs: Array.isArray(batch.jobs) ? batch.jobs.map(sanitizeJob) : []
  })).filter((batch) => !(batch.name === '1' && !batch.userCreated && !batch.jobs.length && state.batches.length === 1));
  if (!batches.length) return defaultState();
  const activeBatchId = batches.some((batch) => batch.id === state.activeBatchId)
    ? state.activeBatchId
    : batches[0].id;
  return { activeBatchId, batches };
}

async function loadState() {
  const data = await chromeCall((done) =>
    chrome.storage.local.get([STATE_KEY, LEGACY_JOBS_KEY], done)
  );

  if (data[STATE_KEY]) {
    const state = normalizeState(data[STATE_KEY]);
    if (JSON.stringify(state) !== JSON.stringify(data[STATE_KEY])) {
      await saveState(state);
    }
    return state;
  }

  const state = defaultState();
  if (Array.isArray(data[LEGACY_JOBS_KEY]) && data[LEGACY_JOBS_KEY].length) {
    const batch = createBatch('Imported jobs');
    batch.jobs = data[LEGACY_JOBS_KEY].map(sanitizeJob);
    state.batches.push(batch);
    state.activeBatchId = batch.id;
    await saveState(state);
  }
  return state;
}

async function saveState(state) {
  await chromeCall((done) => chrome.storage.local.set({ [STATE_KEY]: normalizeState(state) }, done));
}

function activeBatch(state) {
  return state.batches.find((batch) => batch.id === state.activeBatchId) || state.batches[0] || null;
}

function allJobs(state) {
  return state.batches.flatMap((batch) => batch.jobs);
}

function selectedJobs(batch) {
  return batch.jobs.map(sanitizeJob).filter((job) => job.selected === true);
}

async function activeTab() {
  const tabs = await chromeCall((done) =>
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, done)
  );
  const tab = tabs.find((candidate) => /^https?:\/\//.test(candidate.url || ''));
  return tab || tabs[0];
}

async function scrapeCurrentTab() {
  const tab = await activeTab();
  if (!tab?.id) throw new Error('No active tab found.');
  if (!/^https?:\/\//.test(tab.url || '')) {
    throw new Error('This page cannot be imported. Please switch to a job detail page.');
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/extract-rules.js', 'src/content.js']
    });
  } catch (error) {
    throw new Error(`Could not inject the importer script: ${error.message || 'please refresh extension permissions'}`);
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__jobClipperScrapeJob?.()
    });

    if (result?.result) {
      return result.result;
    }
  } catch (_error) {
    // Fall back to the message bridge below for browsers that isolate injected functions differently.
  }

  let response;
  try {
    response = await chromeCall((done) =>
      chrome.tabs.sendMessage(tab.id, { type: 'JOB_CLIPPER_SCRAPE' }, done)
    );
  } catch (error) {
    throw new Error(`The page did not respond: ${error.message || 'please refresh the page and try again'}`);
  }

  if (!response?.ok) {
    throw new Error(response?.error || 'Import failed');
  }

  return response.job;
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${job.url}::${job.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeMarkdown(value) {
  return String(value || '').replace(/\r/g, '').trim();
}

function escapeCleanMarkdown(value) {
  return cleanCapturedText(value).replace(/\r/g, '').trim();
}

function toMarkdown(batch) {
  return batch.jobs.map(jobToSourceMarkdown).join('\n\n---\n\n');
}

function jobsToMarkdown(jobs) {
  return jobs.map(jobToSourceMarkdown).join('\n\n---\n\n');
}

function jobSourceTitle(job) {
  const title = normalize(job.title) || 'Untitled job';
  const company = normalizeCompany(job.company);
  return company ? `${title} - ${company}` : title;
}

function jobToSourceMarkdown(sourceJob) {
  const job = sanitizeJob(sourceJob);
  const info = [
    job.title ? `Job: ${job.title}` : '',
    normalizeCompany(job.company) ? `Company: ${normalizeCompany(job.company)}` : '',
    job.location ? `Location: ${job.location}` : '',
    job.salary ? `Salary: ${job.salary}` : ''
  ].filter(Boolean).join('\n');
  const responsibilities = escapeCleanMarkdown(job.responsibilities || job.rawText || 'No responsibilities found.');
  const requirements = escapeCleanMarkdown(job.requirements || 'No separate requirements found.');

  return `# ${escapeMarkdown(jobSourceTitle(job))}

## Job Info
${info}

## Responsibilities
${responsibilities}

## Requirements
${requirements}`;
}

function jobsToNotebookSources(jobs) {
  return jobs.map((sourceJob) => {
    const job = sanitizeJob(sourceJob);
    return {
      title: jobSourceTitle(job),
      markdown: jobToSourceMarkdown(job)
    };
  });
}

function compactInfo(job) {
  const company = normalizeCompany(job.company);
  return [
    job.title ? `Job: ${job.title}` : '',
    company ? `Company: ${company}` : '',
    job.location ? `Location: ${job.location}` : '',
    job.salary ? `Salary: ${job.salary}` : '',
  ].filter(Boolean).join('\n');
}

function translateInfoLabels(text) {
  return String(text || '')
    .replace(/^岗位[:：]/gm, 'Job: ')
    .replace(/^公司[:：]/gm, 'Company: ')
    .replace(/^地点[:：]/gm, 'Location: ')
    .replace(/^薪资[:：]/gm, 'Salary: ')
    .replace(/^来源站点[:：]/gm, 'Source site: ');
}

function cleanCapturedText(text, maxLength = 12000) {
  const seen = new Set();
  const lines = removeNoiseBlocks(String(text || '')
    .split('\n')
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .flatMap(segmentLine))
    .filter((line) => {
      if (!line) return false;
      if (line.length < 2 || line.length > 520) return false;
      if (NOISE_PATTERNS.some((pattern) => pattern.test(line))) return false;
      if (/^[^\u4e00-\u9fa5a-zA-Z0-9]+$/.test(line)) return false;

      const key = lineKey(line);
      if (!key || seen.has(key)) return false;
      if (hasSimilarSeenLine(seen, key)) return false;
      seen.add(key);
      return true;
    });

  return lines.join('\n').slice(0, maxLength).trim();
}

function removeNoiseBlocks(lines) {
  const result = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1] || '';
    const nextAfter = lines[i + 2] || '';

    if (/^(BOSS\s*)?安全提示$/i.test(line)) {
      break;
    }
    if (/^BOSS直聘严禁/.test(line)) {
      break;
    }
    if (/^(招聘负责人|竞争力分析)$/.test(line)) {
      break;
    }
    if (/^(工作地址|职位发布者:?|拉勾安全提示|面试评价|推荐公司：?|职场百科：?)/.test(line)) {
      break;
    }
    if (/^如遇岗位要求海外工作/.test(line)) {
      break;
    }
    if (/^查看完整个人竞争力$/.test(line)) {
      continue;
    }
    if (/^个人综合排名/.test(line) || /^在人中排名第$/.test(line) || /^你在.+位置$/.test(line)) {
      continue;
    }
    if (/^(一般|良好|优秀|极好)$/.test(line) || /^一般\s+良好\s+优秀\s+极好$/.test(line)) {
      continue;
    }
    if (isRecruiterName(line) && (isRecruiterActive(next) || isRecruiterRole(next) || isRecruiterRole(nextAfter))) {
      continue;
    }
    if (isRecruiterActive(line) && (isRecruiterRole(next) || result.some((item) => isRecruiterName(item)))) {
      if (result.length && isRecruiterName(result[result.length - 1])) result.pop();
      continue;
    }
    if (/^(招聘者|HR|人事)$/i.test(line)) {
      result.splice(Math.max(0, result.length - 2), 2);
      continue;
    }
    result.push(line);
  }
  return result;
}

function isRecruiterName(line) {
  return /^[\u4e00-\u9fa5]{2,4}$/.test(line.trim());
}

function isRecruiterActive(line) {
  return /^(刚刚活跃|今日活跃|本周活跃|在线)$/.test(line.trim());
}

function isRecruiterRole(line) {
  return /^(招聘者|HR|人事)$/.test(line.trim());
}

function truncateAtStopHeading(text) {
  const result = [];
  for (const line of String(text || '').split('\n')) {
    const normalizedLine = line.trim();
    if (result.length && SECTION_STOP_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
      break;
    }
    result.push(line);
  }
  return result.join('\n');
}

function stripLeadingSectionHeading(text, headings) {
  const lines = String(text || '').split('\n');
  while (
    lines.length &&
    headings.some((heading) => lines[0].trim().toLowerCase() === heading.toLowerCase())
  ) {
    lines.shift();
  }
  return lines.join('\n');
}

function segmentLine(line) {
  if (line.length <= 520) return [line];
  const sentenceLines = line
    .replace(/([。；;.!?])\s*/g, '$1\n')
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean);

  return sentenceLines.flatMap((part) => {
    if (part.length <= 520) return [part];
    const chunks = [];
    for (let i = 0; i < part.length; i += 420) {
      chunks.push(part.slice(i, i + 420));
    }
    return chunks;
  });
}

function lineKey(line) {
  return String(line || '')
    .trim()
    .toLowerCase()
    .replace(/^[\d一二三四五六七八九十]+[、.．)]\s*/, '')
    .replace(/^(岗位|职位|公司|地点|薪资|职责|要求|经验|学历|title|company|location|salary)\s*[:：]\s*/i, '')
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/gi, '');
}

function hasSimilarSeenLine(seen, key) {
  if (key.length < 18) return false;
  for (const existing of seen) {
    if (existing.length < 18) continue;
    if (existing.includes(key) || key.includes(existing)) return true;
  }
  return false;
}

function removeOverlappingLines(text, textToRemove) {
  const blocked = new Set(
    String(textToRemove || '')
      .split('\n')
      .map(lineKey)
      .filter((key) => key.length >= 8)
  );

  if (!blocked.size) return text;

  return String(text || '')
    .split('\n')
    .filter((line) => {
      const key = lineKey(line);
      if (!key) return false;
      for (const blockedKey of blocked) {
        if (key === blockedKey) return false;
        if (key.length >= 18 && blockedKey.length >= 18 && (key.includes(blockedKey) || blockedKey.includes(key))) {
          return false;
        }
      }
      return true;
    })
    .join('\n')
    .trim();
}

function sanitizeJob(job) {
  const company = normalizeCompany(job.company);
  const jobInfo = cleanCapturedText(translateInfoLabels(job.jobInfo || compactInfo(job)), 1200);
  const requirements = cleanCapturedText(
    stripLeadingSectionHeading(truncateAtStopHeading(job.requirements || ''), ['任职要求', '任职资格', '岗位要求', '职位要求', '能力要求', 'Requirements', 'Qualifications']),
    2400
  );
  const responsibilities = removeOverlappingLines(
    cleanCapturedText(stripLeadingSectionHeading(job.responsibilities || '', ['岗位职责', '工作职责', '职位描述', 'Responsibilities', 'Job description']), 3000),
    requirements
  );

  return {
    ...job,
    company,
    selected: job.selected === true,
    jobInfo,
    responsibilities,
    requirements,
    rawText: removeOverlappingLines(cleanCapturedText(job.rawText || '', 6000), `${jobInfo}\n${responsibilities}\n${requirements}`)
  };
}

function csvCell(value) {
  return `"${String(value || '').replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
}

function csvHeaders() {
  return [
    'batch',
    'title',
    'company',
    'location',
    'salary',
    'url',
    'sourceSite',
    'capturedAt',
    'jobInfo',
    'responsibilities',
    'requirements'
  ];
}

function jobToCsv(sourceJob, batchName) {
  const headers = csvHeaders();
  const job = sanitizeJob(sourceJob);
  const row = headers.map((header) => csvCell(header === 'batch' ? batchName : job[header])).join(',');
  return [headers.join(','), row].join('\n');
}

function toCsv(batch) {
  return jobsToCsv(batch.jobs, batch.name);
}

function jobsToCsv(jobs, batchName) {
  const headers = csvHeaders();
  const rows = jobs.map((sourceJob) => {
    const job = sanitizeJob(sourceJob);
    return (
    headers.map((header) => csvCell(header === 'batch' ? batchName : job[header])).join(',')
    );
  });
  return [headers.join(','), ...rows].join('\n');
}

function downloadText(filename, text, mimeType, saveAs = true) {
  const blob = new Blob([text], { type: mimeType });
  return downloadBlob(filename, blob, saveAs);
}

function downloadBlob(filename, blob, saveAs = true) {
  const namedBlob = saveAs ? new File([blob], filename, { type: blob.type || 'application/octet-stream' }) : blob;
  const url = URL.createObjectURL(namedBlob);

  if (saveAs) {
    return new Promise((resolve) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(filename);
      }, 1000);
    });
  }

  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename,
        saveAs,
        conflictAction: 'uniquify'
      },
      (downloadId) => {
        URL.revokeObjectURL(url);
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(downloadId);
      }
    );
  });
}

const zipTextEncoder = new TextEncoder();
let crcTable = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[i] = value >>> 0;
  }
  return crcTable;
}

function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimestamp(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function concatBytes(chunks, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function createZip(entries) {
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;
  const { dosTime, dosDate } = dosTimestamp();

  for (const entry of entries) {
    const nameBytes = zipTextEncoder.encode(entry.path);
    const contentBytes = zipTextEncoder.encode(entry.content);
    const crc = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    chunks.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  chunks.push(...centralDirectory);

  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  chunks.push(endHeader);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  return new Blob([concatBytes(chunks, totalLength)], { type: 'application/zip' });
}

function setStatus(message) {
  els.status.textContent = message;
}

function openModal({
  title,
  message = '',
  placeholder = '',
  value = '',
  confirmText = 'OK',
  showInput = true,
  danger = false
}) {
  els.modalTitle.textContent = title;
  els.modalMessage.textContent = message;
  els.modalMessage.hidden = !message;
  els.modalInput.hidden = !showInput;
  els.modalInput.required = showInput;
  els.modalInput.placeholder = placeholder;
  els.modalInput.value = value;
  els.modalConfirm.textContent = confirmText;
  els.modalConfirm.classList.toggle('danger-confirm', danger);
  els.modalBackdrop.hidden = false;

  if (showInput) {
    window.setTimeout(() => {
      els.modalInput.focus();
      els.modalInput.select();
    }, 0);
  } else {
    window.setTimeout(() => els.modalConfirm.focus(), 0);
  }

  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

function closeModal(result = null) {
  els.modalBackdrop.hidden = true;
  els.modalConfirm.classList.remove('danger-confirm');
  const resolve = modalResolve;
  modalResolve = null;
  if (resolve) resolve(result);
}

function closeNotebookPicker() {
  els.notebookPickerBackdrop.hidden = true;
  els.notebookPickerList.innerHTML = '';
}

function setBusy(isBusy) {
  [
    els.addBatch,
    els.clipCurrent,
    els.copyMarkdown,
    els.downloadCsv,
    els.clearBatch,
    els.exportNotebookLM,
    els.exportNewNotebook,
    els.exportExistingNotebook
  ].filter(Boolean).forEach((button) => {
    button.disabled = isBusy;
  });
}

function setNotebookMenuOpen(isOpen) {
  els.notebookMenu.hidden = !isOpen;
  els.exportNotebookLM.setAttribute('aria-expanded', String(isOpen));
}

function isToday(isoDate) {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function metaLine(job) {
  const title = normalize(job.title);
  const company = normalizeCompany(job.company);
  const companyLabel = company && company !== title ? company : 'Company unknown';
  const parts = [companyLabel, job.location, job.salary]
    .map((part) => normalize(part))
    .filter((part) => part && part !== title);
  return parts.join(' · ') || job.sourceSite || 'Unknown source';
}

function metaParts(job) {
  return metaLine(job)
    .split(' · ')
    .map((part) => normalize(part))
    .filter(Boolean);
}

function normalizeCompany(value) {
  const text = normalize(value);
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return '';
  if (/^(区块链|金融|电商|电子商务|企业服务|人工智能|计算机软件|移动互联网|数据服务)$/.test(text)) {
    return '';
  }
  if (/^(公司|查看全部|全部|更多|公司主页|进入公司主页|公司简介|职位描述|岗位职责|任职要求)$/.test(text)) {
    return '';
  }
  if (/查看全部|在招职位|热招职位|相似职位|推荐职位|BOSS|安全提示|招聘者|刚刚活跃|竞争力分析/.test(text)) {
    return '';
  }
  return text;
}

function normalize(value) {
  return String(value || '').trim();
}

function preview(value) {
  const text = normalize(value);
  if (!text) return 'No content found.';
  return text.length > 1400 ? `${text.slice(0, 1400)}...` : text;
}

function animateJobRemoval(items) {
  const elements = Array.from(items || []).filter(Boolean);
  if (!elements.length) return Promise.resolve();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }

  const waits = elements.map((item, index) => {
    item.style.setProperty('--exit-index', String(Math.min(index, 8)));
    item.style.setProperty('--exit-height', `${item.scrollHeight}px`);
    item.querySelector('.job-shatter')?.remove();
    const shatter = document.createElement('div');
    shatter.className = 'job-shatter';
    const shards = [
      [50, 48, -126, -58, -70, 0.84, 13, '#d97706'],
      [50, 48, -96, -94, 36, 0.7, 9, '#f59e0b'],
      [50, 48, -48, -112, -52, 0.78, 11, '#fbbf24'],
      [50, 48, 8, -118, 44, 0.66, 8, '#d97706'],
      [50, 48, 58, -104, 72, 0.78, 10, '#f59e0b'],
      [50, 48, 118, -68, -38, 0.62, 9, '#92400e'],
      [50, 48, -138, -14, 48, 0.7, 8, '#fbbf24'],
      [50, 48, -108, 22, -76, 0.86, 12, '#d97706'],
      [50, 48, -62, 48, 82, 0.72, 9, '#f59e0b'],
      [50, 48, -18, 68, -88, 0.8, 11, '#fbbf24'],
      [50, 48, 34, 64, 72, 0.68, 8, '#d97706'],
      [50, 48, 86, 42, -56, 0.82, 10, '#f59e0b'],
      [50, 48, 132, 12, 60, 0.66, 8, '#92400e'],
      [50, 48, -116, 76, -52, 0.64, 7, '#d97706'],
      [50, 48, -68, 104, 46, 0.78, 10, '#f59e0b'],
      [50, 48, -8, 116, -84, 0.7, 8, '#fbbf24'],
      [50, 48, 48, 104, 78, 0.72, 9, '#d97706'],
      [50, 48, 106, 74, -48, 0.62, 7, '#f59e0b'],
      [50, 48, -34, -36, 120, 1.15, 16, '#fbbf24'],
      [50, 48, 32, 30, -130, 1.05, 15, '#d97706'],
      [50, 48, 4, -48, 96, 0.92, 12, '#f59e0b'],
      [50, 48, -12, 46, -104, 0.96, 12, '#92400e']
    ];
    shards.forEach(([left, top, x, y, rotate, scale, size, color], shardIndex) => {
      const shard = document.createElement('span');
      shard.style.setProperty('--shard-left', `${left}%`);
      shard.style.setProperty('--shard-top', `${top}%`);
      shard.style.setProperty('--shard-x', `${x}px`);
      shard.style.setProperty('--shard-y', `${y}px`);
      shard.style.setProperty('--shard-rotate', `${rotate}deg`);
      shard.style.setProperty('--shard-scale', String(scale));
      shard.style.setProperty('--shard-size', `${size}px`);
      shard.style.setProperty('--shard-color', color);
      shard.style.setProperty('--shard-delay', `${shardIndex * 5}ms`);
      shatter.appendChild(shard);
    });
    item.appendChild(shatter);
    item.classList.add('removing');
    return new Promise((resolve) => {
      let finished = false;
      const done = (event) => {
        if (event && (event.target !== item || event.animationName !== 'jobExit')) return;
        if (finished) return;
        finished = true;
        item.removeEventListener('animationend', done);
        resolve();
      };
      item.addEventListener('animationend', done);
      setTimeout(done, 980 + index * 42);
    });
  });

  return Promise.all(waits);
}

function render(state, options = {}) {
  const batch = activeBatch(state);
  const jobs = batch ? batch.jobs.map(sanitizeJob) : [];
  const totalJobs = allJobs(state);

  els.savedCount.textContent = String(totalJobs.length);
  els.batchCount.textContent = String(state.batches.length);
  els.todayCount.textContent = String(totalJobs.filter((job) => isToday(job.capturedAt)).length);
  els.emptyState.style.display = jobs.length ? 'none' : 'flex';
  els.emptyText.textContent = batch ? 'No jobs in this batch' : 'Create a batch first';
  els.listActions.hidden = !jobs.length;
  const selectedCount = jobs.filter((job) => job.selected === true).length;
  els.selectAllJobs.checked = Boolean(jobs.length && selectedCount === jobs.length);
  els.selectAllJobs.indeterminate = Boolean(selectedCount > 0 && selectedCount < jobs.length);
  els.jobs.innerHTML = '';
  els.batches.innerHTML = '';

  state.batches.forEach((item) => {
    const chip = document.createElement('div');
    chip.className = `batch-chip${item.id === state.activeBatchId ? ' active' : ''}`;

    const button = document.createElement('button');
    button.className = 'batch-pill';
    button.type = 'button';
    const name = document.createElement('span');
    name.className = 'batch-name';
    name.textContent = item.name;
    const count = document.createElement('span');
    count.className = 'batch-job-count';
    count.textContent = String(item.jobs.length);
    button.append(name, count);
    button.addEventListener('click', async () => {
      const current = await loadState();
      current.activeBatchId = item.id;
      await saveState(current);
      render(current);
      setStatus(`Switched to batch ${item.name}.`);
    });

    const close = document.createElement('button');
    close.className = 'batch-close';
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', `Delete batch ${item.name}`);
    close.addEventListener('click', async (event) => {
      event.stopPropagation();
      const confirmed = await openModal({
        title: 'Delete batch',
        message: `Delete "${item.name}"? Jobs saved in this batch will also be deleted.`,
        confirmText: 'Delete',
        showInput: false,
        danger: true
      });
      if (!confirmed) return;
      await deleteBatchById(item.id);
    });

    const edit = document.createElement('button');
    edit.className = 'batch-edit';
    edit.type = 'button';
    edit.textContent = '✎';
    edit.setAttribute('aria-label', `Edit batch ${item.name}`);
    edit.addEventListener('click', async (event) => {
      event.stopPropagation();
      await renameBatchById(item.id);
    });

    chip.append(button, edit, close);
    els.batches.appendChild(chip);
  });

  for (const job of jobs) {
    const item = document.createElement('article');
    item.className = 'job';
    item.dataset.jobId = job.id || '';
    item.innerHTML = `
      <div class="job-top">
        <input class="job-select" type="checkbox" aria-label="Select this job for export">
        <button class="job-summary" type="button" aria-expanded="false">
          <div>
            <h2 class="job-title"></h2>
            <p class="job-meta"></p>
          </div>
          <span class="chevron" aria-hidden="true">⌄</span>
        </button>
        <button class="remove" type="button" aria-label="Delete job" title="Delete job">×</button>
      </div>
      <div class="job-details">
        <section class="detail-block">
          <h3>Job Info</h3>
          <div class="job-info-lines">
            <div class="job-info-line">
              <span class="job-info-label">Job:</span>
              <span class="editable-detail job-info-value" data-field="title" contenteditable="true" spellcheck="false"></span>
            </div>
            <div class="job-info-line">
              <span class="job-info-label">Company:</span>
              <span class="editable-detail job-info-value" data-field="company" contenteditable="true" spellcheck="false"></span>
            </div>
            <div class="job-info-line">
              <span class="job-info-label">Location:</span>
              <span class="editable-detail job-info-value" data-field="location" contenteditable="true" spellcheck="false"></span>
            </div>
            <div class="job-info-line">
              <span class="job-info-label">Salary:</span>
              <span class="editable-detail job-info-value" data-field="salary" contenteditable="true" spellcheck="false"></span>
            </div>
          </div>
        </section>
        <section class="detail-block">
          <h3>Responsibilities</h3>
          <p class="editable-detail job-responsibilities" data-field="responsibilities" contenteditable="true" spellcheck="false"></p>
        </section>
        <section class="detail-block">
          <h3>Requirements</h3>
          <p class="editable-detail job-requirements" data-field="requirements" contenteditable="true" spellcheck="false"></p>
        </section>
      </div>
    `;

    item.querySelector('.job-title').textContent = job.title || 'Untitled job';
    const meta = item.querySelector('.job-meta');
    metaParts(job).forEach((part) => {
      const chip = document.createElement('span');
      chip.textContent = part;
      meta.appendChild(chip);
    });
    fillJobInfoValues(item, job);
    item.querySelector('.job-responsibilities').textContent = preview(job.responsibilities || job.rawText);
    item.querySelector('.job-requirements').textContent = preview(job.requirements);
    item.querySelectorAll('.editable-detail').forEach((control) => {
      control.addEventListener('blur', async () => {
        await saveInlineJobField(job.id, control.dataset.field, control.innerText, item);
      });
    });
    const checkbox = item.querySelector('.job-select');
    checkbox.checked = job.selected !== false;
    checkbox.addEventListener('change', async () => {
      const current = await loadState();
      const currentBatch = activeBatch(current);
      if (!currentBatch) return;
      const target = currentBatch.jobs.find((candidate) => candidate.id === job.id);
      if (!target) return;
      target.selected = checkbox.checked;
      await saveState(current);
      render(await loadState());
      setStatus(checkbox.checked ? 'Job selected.' : 'Job unselected.');
    });
    const summary = item.querySelector('.job-summary');
    summary.addEventListener('click', () => {
      const expanded = item.classList.toggle('expanded');
      summary.setAttribute('aria-expanded', String(expanded));
    });

    item.querySelector('.remove').addEventListener('click', async () => {
      const current = await loadState();
      const currentBatch = activeBatch(current);
      if (!currentBatch) return;
      await animateJobRemoval([item]);
      currentBatch.jobs = currentBatch.jobs.filter((candidate) => candidate.id !== job.id);
      await saveState(current);
      render(current);
      setStatus('Deleted 1 job.');
    });

    els.jobs.appendChild(item);
    if (options.expandedJobId && job.id === options.expandedJobId) {
      item.classList.add('expanded');
      summary.setAttribute('aria-expanded', 'true');
    }
  }
}

async function refresh() {
  render(await loadState());
}

async function batchWithJobs() {
  const state = await loadState();
  const batch = activeBatch(state);
  if (!batch) {
    setStatus('Create a batch first.');
    return null;
  }
  if (!batch.jobs.length) {
    setStatus('No jobs in this batch.');
    return null;
  }
  return batch;
}

function safeFilename(value) {
  const filename = String(value || 'batch')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return filename || 'batch';
}

function batchDownloadFolder(batch) {
  return safeFilename(batch.name || 'batch');
}

function jobDownloadBaseName(job, index, batchName) {
  const prefix = safeFilename(batchName || 'batch');
  const title = safeFilename(job.title || `job-${index + 1}`);
  const company = safeFilename(normalizeCompany(job.company) || 'company-unknown');
  return `${prefix}-${String(index + 1).padStart(2, '0')}-${title}-${company}`;
}

async function downloadBatchJobZip(batch, format) {
  const folder = batchDownloadFolder(batch);
  const jobs = selectedJobs(batch);
  if (!jobs.length) {
    setStatus('Select jobs to download first.');
    return false;
  }
  const extension = format === 'csv' ? 'csv' : 'md';
  const entries = jobs.map((job, index) => {
    const baseName = jobDownloadBaseName(job, index, batch.name);
    const content = format === 'csv'
      ? jobToCsv(job, batch.name)
      : jobToSourceMarkdown(job);
    return {
      path: `${folder}/${baseName}.${extension}`,
      content
    };
  });
  const zipBlob = createZip(entries);
  await downloadBlob(`${folder}.zip`, zipBlob, true);
  return jobs.length;
}

async function downloadSelectedJobs(batch, format) {
  const jobs = selectedJobs(batch);
  if (!jobs.length) {
    setStatus('Select jobs to download first.');
    return false;
  }

  const extension = format === 'csv' ? 'csv' : 'md';
  if (!els.mergeDownload.checked) {
    return downloadBatchJobZip(batch, format);
  }

  const mimeType = format === 'csv'
    ? 'text/csv;charset=utf-8'
    : 'text/markdown;charset=utf-8';
  const content = format === 'csv'
    ? jobsToCsv(jobs, batch.name)
    : jobsToMarkdown(jobs);
  await downloadText(`${safeFilename(batch.name)}.${extension}`, content, mimeType);
  return jobs.length;
}

async function deleteBatchById(batchId) {
  const state = await loadState();
  const index = state.batches.findIndex((batch) => batch.id === batchId);
  if (index < 0) {
    setStatus('Batch not found.');
    return;
  }

  const [removed] = state.batches.splice(index, 1);
  if (!state.batches.length) {
    state.activeBatchId = null;
  } else if (removed.id === state.activeBatchId) {
    const nextIndex = Math.min(index, state.batches.length - 1);
    state.activeBatchId = state.batches[nextIndex].id;
  }

  await saveState(state);
  render(await loadState());
  setStatus(`Deleted batch ${removed.name}.`);
}

async function renameBatchById(batchId) {
  const state = await loadState();
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) {
    setStatus('Create a batch first.');
    return;
  }

  const name = normalize(await openModal({
    title: 'Rename batch',
    placeholder: 'Enter a new batch name',
    value: batch.name,
    confirmText: 'Save'
  }));
  if (!name) {
    setStatus('Rename cancelled.');
    return;
  }

  batch.name = name;
  batch.userCreated = true;
  await saveState(state);
  render(await loadState());
  setStatus(`Renamed to ${name}.`);
}

async function saveInlineJobField(jobId, field, value, item) {
  const state = await loadState();
  const batch = activeBatch(state);
  if (!batch) return;

  const job = batch.jobs.find((candidate) => candidate.id === jobId);
  if (!job) {
    setStatus('Job not found.');
    return;
  }

  const normalizedValue = normalize(value);
  if (normalize(job[field]) === normalizedValue) return;

  job[field] = normalizedValue;
  if (isJobInfoField(field)) {
    job.jobInfo = compactInfo(job);
  }
  await saveState(state);

  const updated = sanitizeJob(job);
  if (isJobInfoField(field)) {
    item.querySelector('.job-title').textContent = updated.title || 'Untitled job';
    renderMetaParts(item.querySelector('.job-meta'), updated);
    fillJobInfoValues(item, updated);
  }
  setStatus('Job updated.');
}

function isJobInfoField(field) {
  return ['title', 'company', 'location', 'salary'].includes(field);
}

function fillJobInfoValues(item, job) {
  const values = {
    title: job.title || '',
    company: normalizeCompany(job.company),
    location: job.location || '',
    salary: job.salary || ''
  };

  item.querySelectorAll('.job-info-value').forEach((control) => {
    const field = control.dataset.field;
    control.textContent = values[field] || '';
  });
}

function renderMetaParts(container, job) {
  container.innerHTML = '';
  metaParts(job).forEach((part) => {
    const chip = document.createElement('span');
    chip.textContent = part;
    container.appendChild(chip);
  });
}

async function selectedJobsForExport(batch) {
  const jobs = selectedJobs(batch);
  if (jobs.length) return jobs;

  setStatus('Select at least one job before exporting.');
  await openModal({
    title: 'No jobs selected',
    message: 'Select at least one job before exporting to NotebookLM.',
    confirmText: 'OK',
    showInput: false
  });
  return null;
}

async function exportNotebookLM(mode, pendingNotebook = null) {
  const batch = await batchWithJobs();
  if (!batch) return;

  const jobs = await selectedJobsForExport(batch);
  if (!jobs) return;

  const sources = jobsToNotebookSources(jobs);
  setStatus(`Preparing ${sources.length} selected job source(s) for NotebookLM...`);

  await chromeCall((done) =>
    chrome.storage.local.set({
      [NOTEBOOKLM_PENDING_KEY]: {
        mode,
        title: batch.name,
        sources,
        sourceType: 'text',
        targetNotebook: pendingNotebook,
        createdAt: Date.now()
      }
    }, done)
  );

  chrome.tabs.create({ url: mode === 'existing' && pendingNotebook?.url ? pendingNotebook.url : NOTEBOOKLM_URL });
  setStatus(mode === 'new'
    ? `Creating a new NotebookLM notebook and pasting ${sources.length} selected job source(s).`
    : `Opening ${pendingNotebook?.title || 'the target Notebook'} and pasting ${sources.length} selected job source(s).`);
}

async function loadCachedNotebooks() {
  const data = await chromeCall((done) => chrome.storage.local.get([NOTEBOOKLM_NOTEBOOKS_KEY], done));
  const notebooks = Array.isArray(data[NOTEBOOKLM_NOTEBOOKS_KEY]) ? data[NOTEBOOKLM_NOTEBOOKS_KEY] : [];
  return notebooks
    .filter((item) => item?.title && item?.url)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function extractPageValue(key, text) {
  const match = String(text || '').match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
  return match ? match[1] : '';
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

function cleanNotebookTitle(value) {
  return String(value || '').replace(/^thought\n/, '').replace(/\s+/g, ' ').trim();
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

async function fetchNotebookLmAuthParams() {
  const response = await fetch(NOTEBOOKLM_URL, { credentials: 'include' });
  const html = await response.text();
  const at = extractPageValue('SNlM0e', html);
  const bl = extractPageValue('cfb2h', html);
  if (!at || !bl) throw new Error('Could not read NotebookLM login info.');
  return { at, bl };
}

async function listNotebooksViaRpc() {
  const { at, bl } = await fetchNotebookLmAuthParams();
  const rpcId = 'wXbhsf';
  const url = new URL('/_/LabsTailwindUi/data/batchexecute', NOTEBOOKLM_URL);
  url.searchParams.set('rpcids', rpcId);
  url.searchParams.set('source-path', '/');
  url.searchParams.set('bl', bl);
  url.searchParams.set('hl', 'en');
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
      url: `${NOTEBOOKLM_URL}notebook/${record.id}`,
      updatedAt: Date.now()
    });
  });
  const notebooks = Array.from(map.values());
  if (notebooks.length) {
    await chromeCall((done) => chrome.storage.local.set({ [NOTEBOOKLM_NOTEBOOKS_KEY]: notebooks }, done));
  }
  return notebooks;
}

function renderNotebookPicker(notebooks, message) {
  els.notebookPickerList.innerHTML = '';
  els.notebookPickerMessage.textContent = message;
  els.notebookPickerMessage.hidden = !message;

  notebooks.forEach((notebook) => {
    const button = document.createElement('button');
    button.className = 'notebook-picker-item';
    button.type = 'button';
    const icon = document.createElement('span');
    icon.className = 'notebook-menu-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `
      <svg viewBox="0 0 16 16" focusable="false">
        <path d="M4 2.5h8a1 1 0 0 1 1 1v10l-5-2.6-5 2.6v-10a1 1 0 0 1 1-1Z"></path>
      </svg>
    `;
    const text = document.createElement('span');
    const title = document.createElement('span');
    title.textContent = notebook.title;
    text.appendChild(title);
    button.append(icon, text);
    button.addEventListener('click', async () => {
      closeNotebookPicker();
      await exportNotebookLM('existing', notebook);
    });
    els.notebookPickerList.appendChild(button);
  });
}

async function chooseNotebookForExport() {
  const batch = await batchWithJobs();
  if (!batch) return;
  const jobs = await selectedJobsForExport(batch);
  if (!jobs) return;

  setNotebookMenuOpen(false);
  els.notebookPickerBackdrop.hidden = false;
  renderNotebookPicker([], 'Loading Notebook list...');

  let notebooks = [];
  try {
    notebooks = await listNotebooksViaRpc();
  } catch (error) {
    setStatus(error.message || 'Failed to load Notebook list.');
  }

  if (!notebooks.length) {
    notebooks = await loadCachedNotebooks();
  }

  if (notebooks.length) {
    renderNotebookPicker(notebooks, '');
    return;
  }

  renderNotebookPicker([], 'No Notebook list found. Make sure you are signed in to NotebookLM.');
}

async function promptCreateBatch(state, message = '') {
  const name = normalize(await openModal({
    title: 'New batch',
    message,
    placeholder: 'Batch name, e.g. AI Product Manager',
    confirmText: 'Create'
  }));
  if (!name) {
    return null;
  }

  const batch = createBatch(name);
  state.batches.push(batch);
  state.activeBatchId = batch.id;
  await saveState(state);
  render(state);
  setStatus(`Created batch ${batch.name}.`);
  return batch;
}

els.addBatch.addEventListener('click', async () => {
  const state = await loadState();
  const batch = await promptCreateBatch(state);
  if (!batch) {
    setStatus('New batch cancelled.');
  }
});

els.clipCurrent.addEventListener('click', async () => {
  try {
    const state = await loadState();
    let batch = activeBatch(state);
    if (!batch) {
      batch = await promptCreateBatch(state, 'Create a batch before importing.');
      if (!batch) {
        setStatus('New batch cancelled.');
        return;
      }
    }

    setBusy(true);
    setStatus('Reading current page...');
    const job = await scrapeCurrentTab();
    const capturedJob = sanitizeJob(job);
    batch.jobs = dedupeJobs([capturedJob, ...batch.jobs]);
    await saveState(state);
    render(state, { expandedJobId: capturedJob.id });
    setStatus(`Imported: ${job.title || 'current job'}`);
  } catch (error) {
    setStatus(error.message || 'Import failed. Make sure the current page is a job detail page.');
  } finally {
    setBusy(false);
  }
});

els.copyMarkdown.addEventListener('click', async () => {
  const batch = await batchWithJobs();
  if (!batch) return;
  try {
    const count = await downloadSelectedJobs(batch, 'md');
    if (count) setStatus(els.mergeDownload.checked ? `Downloaded ${count} selected job(s) as one MD file.` : `Downloaded ${count} selected job(s) as an MD zip.`);
  } catch (error) {
    setStatus(error.message || 'Failed to generate MD file.');
  }
});

els.downloadCsv.addEventListener('click', async () => {
  const batch = await batchWithJobs();
  if (!batch) return;
  try {
    const count = await downloadSelectedJobs(batch, 'csv');
    if (count) setStatus(els.mergeDownload.checked ? `Downloaded ${count} selected job(s) as one CSV file.` : `Downloaded ${count} selected job(s) as a CSV zip.`);
  } catch (error) {
    setStatus(error.message || 'Failed to generate CSV file.');
  }
});

els.selectAllJobs.addEventListener('change', async () => {
  const state = await loadState();
  const batch = activeBatch(state);
  if (!batch) return;
  batch.jobs = batch.jobs.map((job) => ({
    ...job,
    selected: els.selectAllJobs.checked
  }));
  await saveState(state);
  render(await loadState());
  setStatus(els.selectAllJobs.checked ? 'Selected all jobs in this batch.' : 'Selection cleared.');
});

els.clearBatch.addEventListener('click', async () => {
  const state = await loadState();
  const batch = activeBatch(state);
  if (!batch) {
    setStatus('Create a batch first.');
    return;
  }
  if (!batch.jobs.length) {
    setStatus('No JD in this batch.');
    return;
  }
  const confirmed = await openModal({
    title: 'Delete jobs',
    message: `Delete ${batch.jobs.length} job(s) from "${batch.name}"? This cannot be undone.`,
    confirmText: 'Delete',
    showInput: false,
    danger: true
  });
  if (!confirmed) return;
  await animateJobRemoval(els.jobs.querySelectorAll('.job'));
  batch.userCreated = true;
  batch.jobs = [];
  await saveState(state);
  render(state);
  setStatus(`Deleted jobs from batch ${batch.name}.`);
});

els.exportNotebookLM.addEventListener('click', () => {
  setNotebookMenuOpen(els.notebookMenu.hidden);
});

els.exportNewNotebook.addEventListener('click', async () => {
  setNotebookMenuOpen(false);
  try {
    await exportNotebookLM('new');
  } catch (error) {
    setStatus(error.message || 'Failed to start NotebookLM export.');
  }
});

els.exportExistingNotebook.addEventListener('click', async () => {
  try {
    await chooseNotebookForExport();
  } catch (error) {
    setStatus(error.message || 'Failed to load Notebook list.');
  }
});

els.batchModal.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!modalResolve) return;

  if (!els.modalInput.hidden) {
    const value = normalize(els.modalInput.value);
    if (!value) {
      els.modalInput.focus();
      return;
    }
    closeModal(value);
    return;
  }

  closeModal(true);
});

els.modalCancel.addEventListener('click', () => closeModal(null));

els.modalBackdrop.addEventListener('click', (event) => {
  if (event.target === els.modalBackdrop) closeModal(null);
});

els.notebookPickerCancel.addEventListener('click', closeNotebookPicker);

els.notebookPickerBackdrop.addEventListener('click', (event) => {
  if (event.target === els.notebookPickerBackdrop) closeNotebookPicker();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.modalBackdrop.hidden) closeModal(null);
  if (event.key === 'Escape' && !els.notebookPickerBackdrop.hidden) closeNotebookPicker();
});

document.addEventListener('click', (event) => {
  if (els.notebookMenu.hidden) return;
  if (event.target === els.exportNotebookLM || els.exportNotebookLM.contains(event.target)) return;
  if (els.notebookMenu.contains(event.target)) return;
  setNotebookMenuOpen(false);
});

refresh().catch((error) => setStatus(error.message));
