(() => {
  const RULES = window.JobTrackerExtractRules || {};

  function ruleList(path, fallback) {
    const value = path.split('.').reduce((current, key) => current?.[key], RULES);
    return Array.isArray(value) && value.length ? value : fallback;
  }

  const TEXT_SELECTORS = ruleList('selectors.mainText', [
    '[data-testid*="job"]',
    '[class*="job"]',
    '[class*="Job"]',
    '[class*="职位"]',
    '[class*="position"]',
    '[class*="description"]',
    '[class*="Description"]',
    '[class*="detail"]',
    '[class*="Detail"]',
    'article',
    'main'
  ]);

  const TITLE_SELECTORS = ruleList('selectors.title', [
    'h1',
    '[data-testid*="title"]',
    '[class*="job-title"]',
    '[class*="JobTitle"]',
    '[class*="position-title"]',
    '[class*="name"]'
  ]);

  const COMPANY_SELECTORS = ruleList('selectors.company', [
    '[data-testid*="company"]',
    '[class*="company"]',
    '[class*="Company"]',
    '[class*="firm"]',
    '[class*="brand"]',
    '[class*="boss-name"]'
  ]);

  const LOCATION_SELECTORS = ruleList('selectors.location', [
    '[data-testid*="location"]',
    '[class*="location"]',
    '[class*="Location"]',
    '[class*="address"]',
    '[class*="city"]',
    '[class*="workplace"]'
  ]);

  const SALARY_SELECTORS = ruleList('selectors.salary', [
    '[class*="salary"]',
    '[class*="Salary"]',
    '[class*="pay"]',
    '[class*="compensation"]',
    '[class*="wage"]',
    '[class*="薪"]'
  ]);

  const REQUIREMENT_HEADINGS = ruleList('headings.requirements', [
    '任职要求',
    '任職要求',
    '任职资格',
    '任職資格',
    '岗位要求',
    '職位要求',
    '职位要求',
    '能力要求',
    '資格要求',
    '基本要求',
    '必備條件',
    'Requirements',
    'Qualifications',
    'Basic Qualifications',
    'Preferred Qualifications',
    'Minimum Qualifications',
    'Required Qualifications',
    'Desired Qualifications',
    'Required skills',
    'Preferred skills',
    'Must have',
    'What you bring',
    'What we look for',
    "What you'll need",
    'What you’ll need',
    'What you need',
    'Who you are',
    'About you',
    'Skills'
  ]);

  const RESPONSIBILITY_HEADINGS = ruleList('headings.responsibilities', [
    '岗位职责',
    '崗位職責',
    '主要职责',
    '主要職責',
    '工作职责',
    '工作職責',
    '工作内容',
    '工作內容',
    '职位描述',
    '職位描述',
    'Responsibilities',
    'Key Responsibilities',
    'Role Responsibilities',
    'Responsibilities and duties',
    'What you will do',
    "What you'll do",
    'What you’ll do',
    "What you'll be doing",
    'What you’ll be doing',
    'What you do',
    'In this role',
    'Your responsibilities',
    'You will',
    'About the role',
    'The role',
    'About the job',
    'Job description'
  ]);

  const SECTION_HEADINGS = [
    ...RESPONSIBILITY_HEADINGS,
    ...REQUIREMENT_HEADINGS,
    ...ruleList('headings.otherSections', [
      '福利待遇',
      '职位亮点',
      '公司介绍',
      '工作地点',
      '工作地點',
      '招聘流程',
      '招募流程',
      '需要考虑的事项',
      '需要考慮的事項',
      'Benefits',
      'About company',
      'About the company',
      'Location',
      'Recruitment process',
      'Similar jobs',
      'People also viewed',
      'Meet the hiring team',
      'How you match',
      'Applicants',
      'Seniority level',
      'Employment type',
      'Job function',
      'Industries'
    ])
  ];

  const NOISE_PATTERNS = ruleList('noisePatterns', [
    /^(登录|注册|退出|首页|消息|我的|搜索|筛选|排序|收藏|分享|举报|反馈)$/i,
    /^(立即申请|申请职位|投递|立即投递|马上投递|继续沟通|立即沟通|在线沟通|联系招聘者)$/i,
    /^(打开App|下载App|扫码|微信扫一扫|使用App|在App中打开|去App查看)$/i,
    /^(相似职位|推荐职位|热门职位|为你推荐|看过该职位的人|职位竞争力|公司其他职位)/,
    /^(上一页|下一页|查看更多|展开全部|收起|刷新|复制链接)$/i,
    /^(广告|推广|置顶|急招|最新)$/i,
    /^(Easy Apply|Apply|Save|Share|Follow|Message|Report this job)$/i,
    /^(Show more|Show less|See more|See less|View job)$/i,
    /^(Similar jobs|People also viewed|Meet the hiring team|About the company)$/i,
    /^(Seniority level|Employment type|Job function|Industries)$/i,
    /^(No longer accepting applications|Promoted|Actively recruiting)$/i,
    /^See who .+ has hired/i,
    /^Be among the first/i,
    /^Posted .+ ago/i,
    /^\d+\s+applicants?$/i,
    /^\d+.*followers$/i,
    /(cookie|privacy|terms of use|all rights reserved|copyright)/i,
    /^(©|\(c\)|Copyright)/i
  ]);

  const TAIL_SECTION_PATTERNS = [
    /^(BOSS\s*)?安全提示$/i,
    /^BOSS直聘严禁/,
    /^(招聘负责人|竞争力分析)$/,
    /^(工作地址|职位发布者:?|拉勾安全提示|面试评价|推荐公司：?|职场百科：?)/,
    /^(Similar jobs|People also viewed|Meet the hiring team|About the company)$/i,
    /^如遇岗位要求海外工作/
  ];

  const SALARY_PATTERNS = ruleList('salaryPatterns', [
    /(?:¥|￥)?\s?\d+(?:\.\d+)?\s?[kK万千]\s?[-~至]\s?(?:¥|￥)?\s?\d+(?:\.\d+)?\s?[kK万千](?:\s?[·xX*]\s?\d+薪)?/,
    /\$?\d{2,3}(?:,\d{3})?\s?[-~]\s?\$?\d{2,3}(?:,\d{3})?\s?(?:\/year|per year|annually|a year)?/i,
    /\d+(?:\.\d+)?\s?[-~]\s?\d+(?:\.\d+)?\s?(?:万\/年|万|k|K)/
  ]);

  const JOB_SIGNALS = ruleList('jobSignals', [
    '岗位',
    '职位',
    '职责',
    '要求',
    '经验',
    '薪资',
    'Responsibilities',
    'About the job',
    'About the role',
    'Requirements',
    'Qualifications',
    'Basic Qualifications',
    'Preferred Qualifications',
    'Experience',
    'Salary'
  ]);

  function textOf(element) {
    if (!element) return '';
    return normalize(element.innerText || element.textContent || '');
  }

  function normalize(value) {
    return String(value)
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isLinkedIn() {
    return /(^|\.)linkedin\.com$/i.test(window.location.hostname);
  }

  function cleanCapturedText(text, maxLength = 12000) {
    const seen = new Set();
    const lines = removeNoiseBlocks(String(text || '')
      .split('\n')
      .map((line) => normalize(line))
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

    return normalize(lines.join('\n')).slice(0, maxLength);
  }

  function removeNoiseBlocks(lines) {
    const result = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const next = lines[i + 1] || '';
      const nextAfter = lines[i + 2] || '';

      if (TAIL_SECTION_PATTERNS.some((pattern) => pattern.test(line))) {
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
    return normalize(line)
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

  function firstText(selectors, minLength = 2) {
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const match = nodes
        .map(textOf)
        .find((text) => text.length >= minLength && text.length <= 180);
      if (match) return match;
    }
    return '';
  }

  function firstCleanText(selectors, isValid, minLength = 2) {
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const match = nodes
        .map(textOf)
        .find((text) => text.length >= minLength && text.length <= 180 && isValid(text));
      if (match) return match;
    }
    return '';
  }

  function companyFromLinks() {
    const linkedInCompany = companyFromLinkedInInfo();
    if (linkedInCompany) return linkedInCompany;

    const lagouCompany = companyFromLagouInfo();
    if (lagouCompany) return lagouCompany;

    const liepinCompany = companyFromLiepinInfo();
    if (liepinCompany) return liepinCompany;

    const basicInfoCompany = companyFromBasicInfo();
    if (basicInfoCompany) return basicInfoCompany;

    const selectors = ['a[href*="/gongsi/"]', 'a[href*="/company/"]', 'a[href*="/ecompany/"]'];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        const candidates = textOf(node)
          .split('\n')
          .map((line) => normalize(line))
          .filter(Boolean);
        const match = candidates.find(isValidCompanyText);
        if (match) return match;
      }
    }

    return '';
  }

  function companyFromLinkedInInfo() {
    if (!isLinkedIn()) return '';

    const selectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.topcard__org-name-link',
      'a[href*="/company/"]'
    ];

    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .map(textOf)
        .flatMap((value) => value.split('\n'))
        .map((line) => normalizeLinkedInCompanyText(line))
        .filter(isValidLinkedInCompanyText);
      if (candidates[0]) return candidates[0];
    }

    const sources = [
      document.querySelector('meta[property="og:title"]')?.content || '',
      document.querySelector('meta[name="description"]')?.content || '',
      document.title
    ];
    const patterns = [
      /\bat\s+(.+?)\s*\|\s*LinkedIn/i,
      /^(.+?)\s+is hiring/i,
      /[-–]\s*([^|]+?)\s*\|\s*LinkedIn/i
    ];

    for (const source of sources) {
      const text = normalize(source);
      for (const pattern of patterns) {
        const company = normalizeLinkedInCompanyText(text.match(pattern)?.[1] || '');
        if (isValidLinkedInCompanyText(company)) return company;
      }
    }

    return '';
  }

  function companyFromLagouInfo() {
    if (!/(^|\.)lagou\.com$/i.test(window.location.hostname)) return '';

    const fromPageData = companyFromLagouPageData();
    if (fromPageData) return fromPageData;

    const fromSideCard = companyFromLagouSideCard();
    if (fromSideCard) return fromSideCard;

    const fromTitle = companyFromLagouTitle();
    if (fromTitle) return fromTitle;

    const fromBodyText = companyFromLagouBodyText();
    if (fromBodyText) return fromBodyText;

    const selectors = [
      '[class*="company"] a',
      '[class*="company"] [class*="name"]',
      '[class*="company-info"]',
      '[class*="job-company"]',
      '[class*="com-name"]',
      'a[href*="/gongsi/"]'
    ];

    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .filter((node) => !isInsideLagouNoiseModule(node))
        .filter((node) => node.getBoundingClientRect().top < 1400)
        .map(textOf)
        .flatMap((value) => value.split('\n'))
        .map((line) => normalizeCompanyText(line))
        .filter(isValidCompanyText);
      const match = candidates.find(looksLikeCompanyName) || candidates[0];
      if (match) return match;
    }

    const cards = Array.from(document.querySelectorAll('section, aside, div, article'))
      .map((node) => ({ node, text: textOf(node) }))
      .filter((item) => item.node.getBoundingClientRect().top < 1800)
      .filter((item) => !isInsideLagouNoiseModule(item.node))
      .filter((item) =>
        /公司介绍|公司信息|公司主页|公司官网/.test(item.text) ||
        (/融资|人数|主页|官网|区块链|C轮|A轮|B轮/.test(item.text) && item.text.length < 800)
      )
      .sort((a, b) => a.text.length - b.text.length);

    for (const { text } of cards) {
      const lines = text
        .split('\n')
        .map((line) => normalizeCompanyText(line))
        .filter(isValidCompanyText);
      const match = lines.find(looksLikeCompanyName) || lines[0];
      if (match) return match;
    }

    return '';
  }

  function companyFromLagouPageData() {
    const scripts = Array.from(document.scripts)
      .map((script) => script.textContent || '')
      .filter((text) => /company(?:Short)?Name|companyFullName|companyName/.test(text));

    const patterns = [
      /"companyShortName"\s*:\s*"([^"]{2,80})"/,
      /"companyName"\s*:\s*"([^"]{2,80})"/,
      /"companyFullName"\s*:\s*"([^"]{2,80})"/,
      /companyShortName\s*[:=]\s*['"]([^'"]{2,80})['"]/,
      /companyName\s*[:=]\s*['"]([^'"]{2,80})['"]/,
      /companyFullName\s*[:=]\s*['"]([^'"]{2,80})['"]/
    ];

    for (const script of scripts) {
      for (const pattern of patterns) {
        const company = normalizeCompanyText(decodeHtmlEntities(script.match(pattern)?.[1] || ''));
        if (isValidLagouCompanyAlias(company) || (isValidCompanyText(company) && looksLikeCompanyName(company))) {
          return company;
        }
      }
    }

    return '';
  }

  function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  function companyFromLagouBodyText() {
    const text = normalize(document.body.innerText || '');
    const beforeNoise = text.split(/推荐公司|职场百科|面试评价|相似职位|热门职位/)[0] || text;
    return companyFromCompactText(beforeNoise) || companyFromLagouVisibleText();
  }

  function companyFromLagouSideCard() {
    const cards = Array.from(document.querySelectorAll('aside, section, div'))
      .map((node) => ({ node, rect: node.getBoundingClientRect(), text: textOf(node) }))
      .filter((item) => item.rect.top < 1200 && item.rect.left > window.innerWidth * 0.45)
      .filter((item) => !isInsideLagouNoiseModule(item.node))
      .filter((item) => /区块链|融资|C轮|A轮|B轮|15-50人|50-150人|150-500人|公司主页|官网|https?:\/\//.test(item.text))
      .sort((a, b) => a.text.length - b.text.length);

    for (const { text } of cards) {
      const lines = text
        .split('\n')
        .map((line) => normalizeCompanyText(line))
        .filter(Boolean);
      const prefix = lines.slice(0, firstLagouCompanyMetaIndex(lines));
      const company =
        companyFromCompactText(prefix.join('\n')) ||
        prefix.find(isValidLagouCompanyAlias);
      if (company) return normalizeCompanyText(company);
    }

    return '';
  }

  function firstLagouCompanyMetaIndex(lines) {
    const index = lines.findIndex((line) =>
      /^(区块链|金融|电商|电子商务|企业服务|人工智能|计算机软件|移动互联网|数据服务)$/.test(line) ||
      /^(未融资|不需要融资|天使轮|A轮|B轮|C轮|D轮及以上|已上市)$/.test(line) ||
      /^\d+(-\d+)?人$/.test(line) ||
      /^https?:\/\//i.test(line)
    );
    return index >= 0 ? index : Math.min(lines.length, 4);
  }

  function companyFromCompactText(text) {
    const original = normalize(text);
    const boundaryPatterns = [
      /(?:^|[\s\n|｜·,，;；])([\u4e00-\u9fa5A-Za-z0-9·&.-]{2,24}[（(][\u4e00-\u9fa5A-Za-z0-9·&.-]{1,16}[）)]\s*[\u4e00-\u9fa5A-Za-z0-9·&.-]{2,30}(?:有限责任公司|股份有限公司|有限公\s*司|有限公司|集团|公司))/,
      /(?:^|[\s\n|｜·,，;；])([\u4e00-\u9fa5A-Za-z0-9（）()·&.-]{2,40}?(?:有限责任公司|股份有限公司|有限公\s*司|有限公司|集团|公司))/
    ];

    for (const pattern of boundaryPatterns) {
      const company = normalizeCompanyText(original.match(pattern)?.[1] || '');
      if (company && isValidCompanyText(company) && looksLikeCompanyName(company)) return company;
    }

    const compact = normalize(text).replace(/\s+/g, '');
    const patterns = [
      /([\u4e00-\u9fa5A-Za-z0-9·&.-]{2,24}[（(][\u4e00-\u9fa5A-Za-z0-9·&.-]{1,16}[）)][\u4e00-\u9fa5A-Za-z0-9·&.-]{2,30}(?:有限责任公司|股份有限公司|有限公司|集团|公司))/,
      /([\u4e00-\u9fa5A-Za-z0-9·&.-]{2,24}[（(][\u4e00-\u9fa5A-Za-z0-9·&.-]{1,16}[）)]信息技术有限公\s*司)/,
      /([\u4e00-\u9fa5A-Za-z0-9（）()·&.-]{2,40}?(?:有限责任公司|股份有限公司|有限公司|集团|公司))/,
      /([\u4e00-\u9fa5A-Za-z0-9（）()·&.-]{2,40}?信息技术有限公\s*司)/
    ];

    for (const pattern of patterns) {
      const company = normalizeCompanyText(compact.match(pattern)?.[1] || '');
      if (company && isValidCompanyText(company) && looksLikeCompanyName(company)) return company;
    }

    return '';
  }

  function companyFromLagouVisibleText() {
    const nodes = Array.from(document.querySelectorAll('body *'))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < 1400 && !isInsideLagouNoiseModule(node);
      })
      .map(textOf)
      .filter((text) => /有限公\s*司|有限公司|有限责任公司|股份有限公司/.test(text))
      .sort((a, b) => a.length - b.length);

    for (const text of nodes) {
      const company = companyFromCompactText(text);
      if (company) return company;
    }

    return '';
  }

  function isInsideLagouNoiseModule(node) {
    let current = node;
    for (let depth = 0; current && depth < 6; depth += 1) {
      const text = textOf(current);
      if (
        text.length < 3000 &&
        /推荐公司|职场百科|面试评价|相似职位|热门职位|猜你喜欢|看过该职位的人/.test(text)
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function companyFromLagouTitle() {
    const sources = [
      document.querySelector('meta[property="og:title"]')?.content || '',
      document.querySelector('meta[name="description"]')?.content || '',
      document.title
    ];

    const companySuffix = '公司|集团|科技|技术|信息|网络|软件|智能|咨询|电子|有限|股份|银行|证券|基金|保险|中心|研究院|事务所|工作室|厂|院';
    const patterns = [
      new RegExp(`[-_｜|]\\s*([^\\n\\-_｜|]{2,60}(?:${companySuffix}))\\s*招聘`),
      new RegExp(`([^\\n，。；;|｜\\-_]{2,60}(?:${companySuffix}))\\s*(?:招聘|正在招聘|直招)`)
    ];

    for (const source of sources) {
      const text = normalize(source);
      for (const pattern of patterns) {
        const match = text.match(pattern);
        const company = normalizeCompanyText(match?.[1] || '');
        if (company && isValidCompanyText(company) && looksLikeCompanyName(company)) {
          return company;
        }
      }
    }

    return '';
  }

  function companyFromLiepinInfo() {
    if (!/(^|\.)liepin\.com$/i.test(window.location.hostname)) return '';

    const linkSelectors = [
      'a[href*="/company/"]',
      'a[href*="/ecompany/"]',
      'a[href*="/job/c"]',
      '[class*="company"] a',
      '[class*="comp"] a'
    ];
    for (const selector of linkSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .map(textOf)
        .flatMap((value) => value.split('\n'))
        .map((line) => normalizeCompanyText(line))
        .filter(isValidCompanyText);
      const match = candidates.find(looksLikeCompanyName) || candidates[0];
      if (match) return match;
    }

    const cards = Array.from(document.querySelectorAll('section, aside, div, article'))
      .map((node) => ({ node, text: textOf(node) }))
      .filter((item) => /公司信息|公司介绍|企业信息/.test(item.text))
      .sort((a, b) => a.text.length - b.text.length);

    for (const { text } of cards) {
      const lines = text
        .split('\n')
        .map((line) => normalizeCompanyText(line))
        .filter(Boolean);
      const headingIndex = lines.findIndex((line) => /公司信息|公司介绍|企业信息/.test(line));
      const nearby = lines
        .slice(Math.max(0, headingIndex), headingIndex >= 0 ? headingIndex + 12 : 12)
        .find(isValidCompanyText);
      if (nearby) return nearby;
    }

    return '';
  }

  function companyFromBasicInfo() {
    const cards = Array.from(document.querySelectorAll('section, aside, div, article'))
      .map((node) => ({
        node,
        text: textOf(node)
      }))
      .filter((item) =>
        item.text.includes('公司基本信息') ||
        (item.text.includes('公司简介') && item.text.includes('查看全部'))
      )
      .sort((a, b) => a.text.length - b.text.length);

    for (const { node, text } of cards) {
      const linkMatch = Array.from(node.querySelectorAll('a[href*="/gongsi/"], a[href*="/company/"]'))
        .map(textOf)
        .flatMap((value) => value.split('\n'))
        .map((line) => normalize(line))
        .find(isValidCompanyText);
      if (linkMatch) return linkMatch;

      const lines = text.split('\n').map((line) => normalize(line)).filter(Boolean);
      for (let i = 0; i < lines.length; i += 1) {
        if (/公司基本信息|公司简介/.test(lines[i])) {
          const nearby = lines.slice(Math.max(0, i - 3), i + 8).find(isValidCompanyText);
          if (nearby) return nearby;
        }
      }
    }

    return '';
  }

  function collectMainText() {
    const linkedInText = mainTextFromLinkedIn();
    if (linkedInText) return linkedInText;

    const candidates = Array.from(document.querySelectorAll(TEXT_SELECTORS.join(',')))
      .map((node) => ({
        node,
        text: textOf(node)
      }))
      .filter((item) => item.text.length > 180)
      .sort((a, b) => b.text.length - a.text.length);

    const best = candidates.find((item) => containsJobSignal(item.text)) || candidates[0];
    return best ? best.text : normalize(document.body.innerText || '');
  }

  function mainTextFromLinkedIn() {
    if (!isLinkedIn()) return '';

    const selectors = [
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.jobs-description-content__text',
      '.jobs-description',
      '.show-more-less-html__markup',
      '#job-details',
      '[class*="jobs-description"]'
    ];
    const candidates = Array.from(document.querySelectorAll(selectors.join(',')))
      .map((node) => textFromLinkedInDescription(node))
      .filter((text) => text.length > 80)
      .sort((a, b) => b.length - a.length);

    return candidates[0] || '';
  }

  function textFromLinkedInDescription(node) {
    const lines = [];
    collectLinkedInDescriptionLines(node, lines);

    const structured = normalize(lines.join('\n'));
    if (structured.length > 80) return structured;

    return textOf(node);
  }

  function collectLinkedInDescriptionLines(node, lines) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalize(node.textContent || '');
      if (text) pushLinkedInLine(lines, text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'button') return;

    if (tag === 'li') {
      const itemText = textOf(node).replace(/^\s*[•●▪◦*+-]\s+/, '');
      if (itemText) pushLinkedInLine(lines, `• ${itemText}`);
      return;
    }

    if (/^(h1|h2|h3|h4|h5|h6|p|div|section|article|br)$/.test(tag)) {
      const beforeLength = lines.length;
      Array.from(node.childNodes).forEach((child) => collectLinkedInDescriptionLines(child, lines));
      if (tag === 'br' || (lines.length > beforeLength && lines[lines.length - 1] !== '')) {
        lines.push('');
      }
      return;
    }

    Array.from(node.childNodes).forEach((child) => collectLinkedInDescriptionLines(child, lines));
  }

  function pushLinkedInLine(lines, text) {
    const value = normalize(text);
    if (!value) return;
    if (lines[lines.length - 1] === value) return;
    lines.push(value);
  }

  async function expandLinkedInDescription() {
    if (!isLinkedIn()) return false;

    let expanded = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const button = findLinkedInMoreButton();
      if (!button) break;

      button.click();
      expanded = true;
      await wait(400);
    }

    return expanded;
  }

  function findLinkedInMoreButton() {
    const roots = linkedInDescriptionRoots();

    const selectors = [
      '.jobs-description__footer-button',
      '.show-more-less-html__button--more',
      'button[aria-expanded="false"]',
      'button[aria-label*="more" i]',
      'button[aria-label*="see more" i]',
      'button'
    ];

    for (const root of roots) {
      const buttons = Array.from(root.querySelectorAll(selectors.join(',')));
      const match = buttons.find(isLinkedInMoreButton);
      if (match) return match;
    }

    return null;
  }

  function linkedInDescriptionRoots() {
    const explicitRoots = [
      document.querySelector('.jobs-description'),
      document.querySelector('.jobs-description__content'),
      document.querySelector('#job-details')?.closest('section'),
      document.querySelector('[class*="jobs-description"]')
    ].filter(Boolean);

    if (explicitRoots.length) return uniqueElements(explicitRoots);

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      .filter((node) => /^About the job$/i.test(normalize(node.innerText || node.textContent || '')));
    return uniqueElements(headings.map((heading) => closestDescriptionContainer(heading)).filter(Boolean));
  }

  function closestDescriptionContainer(node) {
    let current = node;
    for (let depth = 0; current && depth < 8; depth += 1) {
      const text = textOf(current);
      if (text.includes('About the job') && text.length > 120) return current;
      current = current.parentElement;
    }
    return null;
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements));
  }

  function isLinkedInMoreButton(button) {
    if (!button || !isVisible(button)) return false;

    const label = normalize([
      button.innerText || '',
      button.textContent || '',
      button.getAttribute('aria-label') || ''
    ].join(' '));
    if (!label) return false;
    if (/show less|see less|收起/i.test(label)) return false;
    if (/for business|business|premium|similar jobs|people also viewed|all jobs|更多职位|相似职位/i.test(label)) return false;

    const isExpanded = button.getAttribute('aria-expanded');
    return isExpanded === 'false' || /\b(show more|see more|more)\b|展开|更多/i.test(label);
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function containsJobSignal(text) {
    return JOB_SIGNALS.some((signal) => text.includes(signal));
  }

  function findSalary(text) {
    const explicit = firstText(SALARY_SELECTORS);
    if (explicit) return explicit;

    for (const pattern of SALARY_PATTERNS) {
      const match = text.match(pattern);
      if (match) return normalize(match[0]);
    }
    return '';
  }

  function locationFromPage(fullText) {
    const linkedInLocation = locationFromLinkedIn();
    if (linkedInLocation) return linkedInLocation;

    if (/liepin\.com$/i.test(window.location.hostname) || /(^|\.)liepin\.com$/i.test(window.location.hostname)) {
      const liepinLocation = locationFromLiepin(fullText);
      if (liepinLocation) return liepinLocation;
    }

    const explicitLocation = firstCleanText(LOCATION_SELECTORS, isValidLocationText);
    return explicitLocation ? normalizeLocation(explicitLocation) : '';
  }

  function locationFromLinkedIn() {
    if (!isLinkedIn()) return '';

    const selectors = [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__primary-description',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet'
    ];

    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .map(textOf)
        .flatMap((value) => value.split(/[\n·•|｜]/))
        .map((line) => normalizeLocation(line))
        .filter(isValidLocationText);
      if (candidates[0]) return candidates[0];
    }

    const metaText = [
      document.querySelector('meta[property="og:description"]')?.content || '',
      document.querySelector('meta[name="description"]')?.content || '',
      document.title
    ].join('\n');

    return locationFromText(metaText);
  }

  function locationFromLiepin(fullText) {
    const selectors = [
      '[class*="job-properties"] span',
      '[class*="job-properties"]',
      '[class*="job-title"] span',
      '[class*="job-info"] span',
      '[class*="job-label"] span',
      '[class*="basic"] span'
    ];
    const fromDom = firstCleanText(selectors, isValidLocationText);
    if (fromDom) return normalizeLocation(fromDom);

    const metaText = [
      document.querySelector('meta[name="description"]')?.content || '',
      document.querySelector('meta[property="og:description"]')?.content || '',
      document.title,
      fullText
    ].join('\n');

    return locationFromText(metaText);
  }

  function locationFromText(text) {
    const tokens = normalize(text)
      .split(/[\n|｜·,，;；]/)
      .map((item) => normalizeLocation(item))
      .filter(Boolean);
    return tokens.find(isValidLocationText) || '';
  }

  function normalizeLocation(text) {
    const value = normalize(text)
      .replace(/^(工作地点|地点|城市|工作城市|办公地点|所在城市)\s*[:：]\s*/i, '')
      .replace(/^(location)\s*[:：]\s*/i, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([,，|｜·])\s*/g, '$1')
      .trim();
    const cityMatch = value.match(/北京|上海|广州|深圳|杭州|成都|南京|苏州|武汉|西安|长沙|重庆|天津|宁波|无锡|佛山|东莞|郑州|合肥|厦门|青岛|济南|福州|珠海|大连|沈阳|昆明|南昌|南宁|贵阳|太原|石家庄|哈尔滨|长春|海口|兰州|呼和浩特|乌鲁木齐|全国/);
    return cityMatch ? cityMatch[0] : value.replace(/[，|｜·]/g, ', ');
  }

  function isValidLocationText(text) {
    const value = normalizeLocation(text);
    if (!value || value.length > 80) return false;
    if (/职位|岗位|招聘|薪|经验|学历|本科|硕士|博士|统招|全职|兼职|公司|猎聘|首页|登录|注册/.test(value)) {
      return false;
    }
    if (/applicants?|followers?|connections?|hired|promoted|posted|apply|save|share|full-?time|part-?time|seniority|employment type|job function|industries/i.test(value)) {
      return false;
    }
    if (/^(北京|上海|广州|深圳|杭州|成都|南京|苏州|武汉|西安|长沙|重庆|天津|宁波|无锡|佛山|东莞|郑州|合肥|厦门|青岛|济南|福州|珠海|大连|沈阳|昆明|南昌|南宁|贵阳|太原|石家庄|哈尔滨|长春|海口|兰州|呼和浩特|乌鲁木齐|全国)$/.test(value)) {
      return true;
    }
    return /[a-z]/i.test(value) && (
      /\b(Remote|Hybrid|On-site|United States|USA|Canada|Singapore|London|New York|San Francisco|California|United Kingdom|India|Germany|Australia)\b/i.test(value) ||
      /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z]{2}\b/.test(value) ||
      /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z][a-z]+/.test(value)
    );
  }

  function extractSection(text, headings, stopHeadings = []) {
    const lines = cleanCapturedText(text, 9000).split('\n').map((line) => line.trim()).filter(Boolean);
    const sectionType = headings === RESPONSIBILITY_HEADINGS ? 'responsibilities' : headings === REQUIREMENT_HEADINGS ? 'requirements' : '';
    const start = findSectionStart(lines, headings, sectionType);

    if (start === -1) return '';

    const result = [];
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i];
      if (i > start && isHeading(line, stopHeadings)) {
        break;
      }
      if (i > start && looksLikeNewSection(line) && result.length > 1) {
        break;
      }
      result.push(line);
      if (result.join('\n').length > 1800) break;
    }

    const stripped = stripLeadingHeading(normalize(result.join('\n')), headings);
    return formatSectionItems(stripped, sectionType);
  }

  function findSectionStart(lines, headings, sectionType = '') {
    const strongStart = lines.findIndex((line) => matchesStrongSectionHeading(line, sectionType));
    if (strongStart >= 0) return strongStart;

    const preferredHeadings = headings.filter((heading) => !isBroadDescriptionHeading(heading));
    const preferredStart = findHeadingIndex(lines, preferredHeadings);
    if (preferredStart >= 0) return preferredStart;

    return isLinkedIn() ? -1 : findHeadingIndex(lines, headings);
  }

  function findHeadingIndex(lines, headings) {
    return lines.findIndex((line) =>
      headings.some((heading) => headingMatchesLine(line, heading))
    );
  }

  function headingMatchesLine(line, heading) {
    if (!isLikelySectionHeadingLine(line)) return false;

    const value = normalizeHeading(line);
    const target = normalizeHeading(heading);
    if (!value || !target) return false;
    if (isBroadDescriptionHeading(heading)) return false;
    if (value === target || value.startsWith(`${target}:`) || value.startsWith(`${target}：`)) return true;
    if (target.length >= 8 && value.includes(target)) return true;
    return false;
  }

  function normalizeHeading(text) {
    return normalize(text)
      .replace(/[：:]\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function isBroadDescriptionHeading(heading) {
    return /^(about the job|about the role|the role|job description|职位描述|職位描述|职位信息)$/i.test(normalizeHeading(heading));
  }

  function matchesStrongSectionHeading(line, sectionType) {
    const value = normalize(line).replace(/[：:]\s*$/, '').trim();
    if (!isLikelySectionHeadingLine(value)) return false;

    if (sectionType === 'responsibilities') {
      return /职责|職責|工作内容|工作內容|责任|責任|responsibilit|duties|what\s+you(?:'|’)?ll\s+(?:do|be\s+doing)|what\s+you\s+(?:will\s+do|do)|in\s+this\s+role|your\s+role|you\s+will/i.test(value) &&
        !/requirements?|qualifications?|任职|任職|资格|資格|要求|skills?/i.test(value);
    }

    if (sectionType === 'requirements') {
      return /任职|任職|资格|資格|要求|條件|条件|基本要求|必備|必备|requirements?|qualifications?|skills?|must\s+have|what\s+you\s+bring|what\s+we\s+look\s+for|what\s+you(?:'|’)?ll\s+need|what\s+you\s+need|who\s+you\s+are|you\s+have|preferred|minimum|required/i.test(value);
    }

    return false;
  }

  function isLikelySectionHeadingLine(line) {
    const value = normalize(line);
    if (!value || value.length > 80) return false;
    if (hasListMarker(value)) return false;
    if (/[,，;；]/.test(value) && value.length > 28) return false;
    if (/[。.!?？]$/.test(value) && value.length > 24) return false;
    return true;
  }

  function hasListMarker(line) {
    return /^\s*(?:[•●▪◦*+-]|\d+[.)、]|[a-z][.)])\s+/i.test(line);
  }

  function formatSectionItems(text, sectionType) {
    if (!text || !isLinkedIn() || !/^(responsibilities|requirements)$/.test(sectionType)) {
      return text;
    }

    const lines = text.split('\n').map((line) => normalize(line)).filter(Boolean);
    const formatted = lines.map((line) => {
      if (hasListMarker(line)) return line.replace(/^\s*(?:[•●▪◦*+-]|\d+[.)、]|[a-z][.)])\s+/i, '• ');
      if (isNestedSectionHeading(line, sectionType)) return line;
      return `• ${line}`;
    });

    return normalize(formatted.join('\n'));
  }

  function isNestedSectionHeading(line, sectionType) {
    if (!isLikelySectionHeadingLine(line)) return false;
    if (sectionType === 'requirements') {
      return matchesStrongSectionHeading(line, 'requirements');
    }
    return matchesStrongSectionHeading(line, 'responsibilities');
  }

  function stripLeadingHeading(text, headings) {
    const lines = text.split('\n');
    while (
      lines.length &&
      headings.some((heading) => headingMatchesLine(lines[0], heading) || normalizeHeading(lines[0]) === normalizeHeading(heading))
    ) {
      lines.shift();
    }
    return normalize(lines.join('\n'));
  }

  function isHeading(line, headings) {
    if (line.length > 42) return false;
    return headings.some((heading) => headingMatchesLine(line, heading));
  }

  function looksLikeNewSection(line) {
    if (line.length > 36) return false;
    return /^(福利|亮点|地点|薪资|公司|关于|流程|联系方式|About|Benefits|Location|Compensation|Company|Apply|申请|Similar jobs|People also viewed|Meet the hiring team|How you match|Applicants|Seniority level|Employment type|Job function|Industries)/i.test(line);
  }

  function titleFromPage() {
    const linkedInTitle = titleFromLinkedIn();
    if (linkedInTitle) return linkedInTitle;

    const h1 = firstText(TITLE_SELECTORS);
    if (h1) return h1;

    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    if (ogTitle) return normalize(ogTitle.split('|')[0].split('-')[0]);

    return normalize(document.title.split('|')[0].split('-')[0]);
  }

  function titleFromLinkedIn() {
    if (!isLinkedIn()) return '';

    const selectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.top-card-layout__title',
      'h1'
    ];
    const fromDom = firstText(selectors);
    if (fromDom) return fromDom;

    const sources = [
      document.querySelector('meta[property="og:title"]')?.content || '',
      document.title
    ];
    for (const source of sources) {
      const text = normalize(source).replace(/\s*\|\s*LinkedIn.*$/i, '');
      const title = normalize(text.split(/\s+at\s+/i)[0].split(/\s[-–]\s/)[0]);
      if (title && title.length <= 120) return title;
    }

    return '';
  }

  function companyFromPageTitle() {
    const sources = [
      document.title,
      document.querySelector('meta[property="og:title"]')?.content || '',
      document.querySelector('meta[name="description"]')?.content || ''
    ];

    for (const source of sources) {
      const text = normalize(source);
      const bossMatch = text.match(/_([^_\-｜|]+?)招聘(?:[-_｜|]|$)/);
      if (bossMatch?.[1]) return normalize(bossMatch[1]);

      const genericMatch = text.match(/([^\s_｜|\-]{2,30})招聘(?:[-_｜|]|$)/);
      const genericCompany = normalizeCompanyText(genericMatch?.[1] || '');
      if (genericCompany && !genericCompany.includes('职位') && looksLikeCompanyName(genericCompany)) {
        return genericCompany;
      }
    }

    return '';
  }

  function normalizeCompanyText(text) {
    return normalize(text)
      .replace(/^(公司名称|公司名|企业名称|公司)\s*[:：]\s*/i, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function normalizeLinkedInCompanyText(text) {
    return normalize(text)
      .replace(/^(company|公司)\s*[:：]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function looksLikeCompanyName(text) {
    return /(公司|集团|科技|技术|信息|网络|软件|智能|咨询|电子|有限|股份|银行|证券|基金|保险|中心|研究院|事务所|工作室|厂|院)$/.test(normalizeCompanyText(text));
  }

  function isValidLagouCompanyAlias(text) {
    const value = normalizeCompanyText(text);
    if (!isValidCompanyText(value)) return false;
    if (value.length < 2 || value.length > 24) return false;
    if (/招聘|职位|岗位|经理|总监|工程师|运营|产品|销售|客服|实习|专员|顾问|设计/.test(value)) {
      return false;
    }
    return /[\u4e00-\u9fa5]/.test(value);
  }

  function isValidCompanyText(text) {
    const value = normalizeCompanyText(text);
    if (!value) return false;
    if (/^(公司|查看全部|全部|更多|公司主页|进入公司主页|公司简介|公司信息|公司介绍|企业信息|职位描述|岗位职责|任职要求)$/.test(value)) {
      return false;
    }
    if (/^\d+(-\d+)?人$/.test(value)) return false;
    if (/^(不需要融资|未融资|已上市|天使轮|A轮|B轮|C轮|D轮及以上)$/.test(value)) return false;
    if (/^https?:\/\//i.test(value)) return false;
    if (/^(区块链|金融|电商|电子商务|企业服务|人工智能|计算机软件|移动互联网|数据服务)$/.test(value)) return false;
    if (value.includes('\n')) return false;
    if (value.length > 50) return false;
    if (/公司简介|公司基本信息|公司信息|公司介绍|岗位职责|任职要求|职位描述|BOSS|安全提示|招聘者|刚刚活跃|竞争力分析/.test(value)) {
      return false;
    }
    if (/查看全部|在招职位|热招职位|相似职位|推荐职位|互联网|电子商务|企业服务|人工智能|计算机软件|融资|上市|民营|外企|国企/.test(value)) {
      return false;
    }
    return /[\u4e00-\u9fa5A-Za-z0-9]/.test(value);
  }

  function isValidLinkedInCompanyText(text) {
    const value = normalizeLinkedInCompanyText(text);
    if (!value || value.length < 2 || value.length > 80) return false;
    if (/^(LinkedIn|Jobs|Company|Apply|Save|Share|Follow|Message|Show more|Show less|Easy Apply|Report this job|Similar jobs|People also viewed|Meet the hiring team)$/i.test(value)) {
      return false;
    }
    if (/followers?|connections?|applicants?|hired|promoted|posted|full-?time|part-?time|seniority|employment type|job function|industries/i.test(value)) {
      return false;
    }
    if (/^https?:\/\//i.test(value) || value.includes('\n')) return false;
    return /[\u4e00-\u9fa5A-Za-z0-9]/.test(value);
  }

  function pageLanguage() {
    const htmlLang = document.documentElement.lang || '';
    if (htmlLang) return htmlLang;
    return /[\u4e00-\u9fff]/.test(document.body.innerText || '') ? 'zh' : 'en';
  }

  function buildJobInfo({ title, company, jobLocation, salary, sourceSite }) {
    return [
      title ? `Job: ${title}` : '',
      company ? `Company: ${company}` : '',
      jobLocation ? `Location: ${jobLocation}` : '',
      salary ? `Salary: ${salary}` : '',
      sourceSite ? `Source site: ${sourceSite}` : ''
    ].filter(Boolean).join('\n');
  }

  async function scrapeJob() {
    await expandLinkedInDescription();

    const fullText = cleanCapturedText(collectMainText());
    const title = titleFromPage();
    const company =
      companyFromLinks() ||
      companyFromPageTitle() ||
      firstCleanText(COMPANY_SELECTORS, isValidCompanyText);
    const jobLocation = locationFromPage(fullText);
    const salary = findSalary(fullText);
    const responsibilities = extractSection(fullText, RESPONSIBILITY_HEADINGS, REQUIREMENT_HEADINGS);
    const requirements = extractSection(
      fullText,
      REQUIREMENT_HEADINGS,
      SECTION_HEADINGS.filter((heading) => !REQUIREMENT_HEADINGS.includes(heading))
    );
    const sourceSite = window.location.hostname;

    return {
      id: crypto.randomUUID(),
      title,
      company,
      location: jobLocation,
      salary,
      url: window.location.href,
      sourceSite,
      language: pageLanguage(),
      capturedAt: new Date().toISOString(),
      jobInfo: buildJobInfo({ title, company, jobLocation, salary, sourceSite }),
      responsibilities,
      requirements,
      rawText: fullText.slice(0, 12000)
    };
  }

  window.__jobClipperScrapeJob = scrapeJob;

  if (!window.__jobClipperMessageListenerAdded) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== 'JOB_CLIPPER_SCRAPE') return false;

      Promise.resolve(window.__jobClipperScrapeJob())
        .then((job) => sendResponse({ ok: true, job }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || 'Scrape failed' }));
      return true;
    });
    window.__jobClipperMessageListenerAdded = true;
  }
})();
