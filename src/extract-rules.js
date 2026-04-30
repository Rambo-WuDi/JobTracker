// Edit this file when a site needs better scraping or classification.
// The extension loads this file before content.js on every scrape.
window.JobTrackerExtractRules = {
  selectors: {
    mainText: [
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
    ],
    title: [
      'h1',
      '[data-testid*="title"]',
      '[class*="job-title"]',
      '[class*="JobTitle"]',
      '[class*="position-title"]',
      '[class*="name"]'
    ],
    company: [
      '.job-detail-company .name',
      '.job-detail-company a[href*="/gongsi/"]',
      '.company-info .name',
      '.company-name',
      '.sider-company .name'
    ],
    location: [
      '[data-testid*="location"]',
      '[class*="location"]',
      '[class*="Location"]',
      '[class*="address"]',
      '[class*="city"]',
      '[class*="workplace"]'
    ],
    salary: [
      '[class*="salary"]',
      '[class*="Salary"]',
      '[class*="pay"]',
      '[class*="compensation"]',
      '[class*="wage"]',
      '[class*="薪"]'
    ]
  },
  headings: {
    responsibilities: [
      '岗位职责',
      '工作职责',
      '工作内容',
      '职位描述',
      '职位信息',
      'Responsibilities',
      'What you will do',
      'About the role',
      'Job description'
    ],
    requirements: [
      '任职要求',
      '任职资格',
      '岗位要求',
      '职位要求',
      '能力要求',
      '资格要求',
      'Requirements',
      'Qualifications',
      'What you bring',
      'Skills'
    ],
    otherSections: [
      '福利待遇',
      '职位亮点',
      '公司介绍',
      '工作地点',
      '工作地址',
      '招聘流程',
      '招聘负责人',
      '竞争力分析',
      '职位发布者',
      '拉勾安全提示',
      '面试评价',
      '推荐公司',
      '职场百科',
      '为什么选择',
      '为什么加入',
      '加入我们',
      '你将获得',
      'Benefits',
      'About company',
      'Location',
      'Recruitment process'
    ]
  },
  noisePatterns: [
    /^(登录|注册|退出|首页|消息|我的|搜索|筛选|排序|收藏|分享|举报|反馈)$/i,
    /^(立即申请|申请职位|投递|立即投递|马上投递|继续沟通|立即沟通|在线沟通|联系招聘者)$/i,
    /^(打开App|下载App|扫码|微信扫一扫|使用App|在App中打开|去App查看)$/i,
    /^(相似职位|推荐职位|热门职位|为你推荐|看过该职位的人|职位竞争力|公司其他职位)/,
    /^(上一页|下一页|查看更多|查看全部|展开全部|收起|刷新|复制链接)$/i,
    /^(广告|推广|置顶|急招|最新)$/i,
    /^(招聘负责人|竞争力分析|查看完整个人竞争力)$/i,
    /^(工作地址|职位发布者:?|拉勾安全提示|面试评价|推荐公司：?|职场百科：?)/,
    /^如遇岗位要求海外工作/,
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
    /^[\u4e00-\u9fa5]{2,4}\s*(刚刚|今日|本周)?活跃\s*(招聘者|HR|人事)?$/i,
    /(cookie|privacy|terms of use|all rights reserved|copyright)/i,
    /^(©|\(c\)|Copyright)/i
  ],
  salaryPatterns: [
    /(?:¥|￥)?\s?\d+(?:\.\d+)?\s?[kK万千]\s?[-~至]\s?(?:¥|￥)?\s?\d+(?:\.\d+)?\s?[kK万千](?:\s?[·xX*]\s?\d+薪)?/,
    /\$?\d{2,3}(?:,\d{3})?\s?[-~]\s?\$?\d{2,3}(?:,\d{3})?\s?(?:\/year|per year|annually|a year)?/i,
    /\d+(?:\.\d+)?\s?[-~]\s?\d+(?:\.\d+)?\s?(?:万\/年|万|k|K)/
  ],
  jobSignals: [
    '岗位',
    '职位',
    '职责',
    '要求',
    '经验',
    '薪资',
    'Responsibilities',
    'Requirements',
    'Qualifications',
    'Experience',
    'Salary'
  ],
  outputFields: {
    title: '岗位名称，卡片第一行和 Markdown 小标题',
    company: '公司名，卡片第二行优先展示',
    location: '地点',
    salary: '薪资',
    url: '来源页面链接',
    sourceSite: '来源域名',
    jobInfo: '岗位信息汇总',
    responsibilities: '岗位职责',
    requirements: '任职要求',
    rawText: '清洗后的主文本兜底'
  }
};
