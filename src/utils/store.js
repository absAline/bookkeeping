const STORAGE_KEY = 'bookkeeping_transactions'
const BUDGET_KEY = 'bookkeeping_budget'
const MONTHLY_INCOME_KEY = 'bookkeeping_monthly_income'

export function getTransactions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}
export function saveTransactions(txs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs))
}
export function addTransaction(tx) {
  const txs = getTransactions()
  txs.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...tx })
  saveTransactions(txs); return txs
}
export function updateTransaction(id, updates) {
  const txs = getTransactions().map(t => t.id === id ? { ...t, ...updates } : t)
  saveTransactions(txs); return txs
}
export function deleteTransaction(id) {
  const txs = getTransactions().filter(t => t.id !== id)
  saveTransactions(txs); return txs
}

export function getSummary(month) {
  const txs = getTransactions().filter(t => t.date.startsWith(month))
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { total: txs.length, income, expense, balance: income - expense }
}

export function getCategorySummary(month) {
  const txs = getTransactions().filter(t => t.date.startsWith(month) && t.type === 'expense')
  const map = {}
  txs.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

// ---- Budget ----
export function getBudget() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) }
  catch { return null }
}
export function saveBudget(budget) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget))
}
export function getMonthlyIncome() {
  try { return JSON.parse(localStorage.getItem(MONTHLY_INCOME_KEY)) }
  catch { return null }
}
export function saveMonthlyIncome(income) {
  localStorage.setItem(MONTHLY_INCOME_KEY, JSON.stringify(income))
}

export function getBudgetStatus(month) {
  const budget = getBudget()
  if (!budget) return null
  const txs = getTransactions().filter(t => t.date.startsWith(month) && t.type === 'expense')
  const spent = {}
  txs.forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount })
  const totalSpent = txs.reduce((s, t) => s + t.amount, 0)
  const results = {}
  for (const [cat, limit] of Object.entries(budget)) {
    const s = spent[cat] || 0
    results[cat] = { limit, spent: s, ratio: limit > 0 ? s / limit : 0 }
  }
  return { categories: results, totalSpent, totalBudget: Object.values(budget).reduce((a, b) => a + b, 0) }
}

export function getLastMonth(month) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  d.setMonth(d.getMonth() - 1)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

export function getMonthComparison(month) {
  const cur = getCategorySummary(month)
  const prev = getCategorySummary(getLastMonth(month))
  const prevMap = {}
  prev.forEach(([cat, amt]) => { prevMap[cat] = amt })
  return cur.map(([cat, amt]) => [cat, amt, prevMap[cat] || 0])
}

export function generateAISuggestions(month) {
  const txs = getTransactions().filter(t => t.date.startsWith(month) && t.type === 'expense')
  if (txs.length < 3) return ['添加至少 3 笔支出后自动分析']

  const total = txs.reduce((s, t) => s + t.amount, 0)
  const cats = {}
  txs.forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount })
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  const dailyAvg = total / new Date(month + '-01').getMonth()
  const daysInMonth = new Date(parseInt(month), parseInt(month.split('-')[1]), 0).getDate()
  const avgPerDay = total / daysInMonth

  const suggestions = []

  if (top && top[1] > total * 0.4) {
    suggestions.push(`「${top[0]}」占比 ${(top[1]/total*100).toFixed(0)}% 偏高，建议控制`)
  }

  if (avgPerDay > 200) {
    const target = Math.round(avgPerDay * 0.8 / 10) * 10
    suggestions.push(`日均消费 ¥${avgPerDay.toFixed(0)}，建议设置日预算 ¥${target}`)
  }

  const prevMonth = getLastMonth(month)
  const prevTxs = getTransactions().filter(t => t.date.startsWith(prevMonth) && t.type === 'expense')
  const prevTotal = prevTxs.reduce((s, t) => s + t.amount, 0)
  if (prevTotal > 0) {
    const change = ((total - prevTotal) / prevTotal * 100).toFixed(0)
    if (Math.abs(change) > 10) {
      suggestions.push(`较上月 ${change > 0 ? '↑' : '↓'} ${Math.abs(change)}%${change > 0 ? '，注意控制' : '，继续保持'}`)
    }
  }

  const income = getMonthlyIncome()
  if (income && income > 0) {
    const savings = income - total
    const rate = (savings / income * 100).toFixed(0)
    suggestions.push(`本月储蓄率 ${rate}%${Number(rate) < 20 ? '（建议达到 20% 以上）' : '，不错！'}`)
  }

  const budgetStatus = getBudgetStatus(month)
  if (budgetStatus) {
    const over = Object.entries(budgetStatus.categories).filter(([, v]) => v.ratio > 1)
    if (over.length > 0) {
      suggestions.push(`⚠️ ${over.length} 个分类已超预算：${over.map(([c]) => c).join('、')}`)
    }
  }

  suggestions.push(`本月总支出 ¥${total.toFixed(0)}，继续加油！`)
  return suggestions
}

export const CATEGORIES = {
  income: ['工资', '兼职', '投资收益', '红包', '退款', '其他收入'],
  expense: ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '通讯', '日用', '服饰', '其他支出'],
}

export function guessCategory(note) {
  const keywords = {
    '餐饮': ['饭', '餐', '吃', '外卖', '奶茶', '咖啡', '餐厅', '火锅', '烧烤', '麦当劳', '肯德基', '食堂', '面包', '水果', '零食'],
    '交通': ['地铁', '公交', '打车', '滴滴', '加油', '停车', '高铁', '机票', '出租车', '单车'],
    '购物': ['淘宝', '京东', '拼多多', '买', '衣服', '鞋', '包', '数码', '家居', '超市', '便利店'],
    '娱乐': ['电影', '游戏', 'KTV', '旅游', '门票', '会员', '视频', '音乐', '小说', '健身'],
    '住房': ['房租', '水电', '物业', '暖气', '燃气', '维修'],
    '医疗': ['医院', '药', '看病', '体检', '牙科', '医保'],
    '教育': ['课程', '书', '培训', '考试', '报名', '学习'],
    '通讯': ['话费', '流量', '宽带', '手机'],
    '日用': ['洗面奶', '纸巾', '洗衣液', '洗发水', '牙膏', '垃圾袋'],
    '服饰': ['衣服', '裤子', '鞋', '包', '配饰', '帽子'],
  }
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => note.includes(w))) return cat
  }
  return '其他支出'
}
