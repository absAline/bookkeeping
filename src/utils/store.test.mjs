import { describe, it, expect, beforeEach } from 'vitest'
import {
  addTransaction, getTransactions, updateTransaction, deleteTransaction,
  getSummary, getCategorySummary, CATEGORIES, guessCategory,
  saveBudget, getBudget, getBudgetStatus, saveMonthlyIncome, getMonthlyIncome,
  getLastMonth, generateAISuggestions
} from './store.js'

beforeEach(() => {
  localStorage.clear()
})

describe('addTransaction', () => {
  it('should add a transaction with id and createdAt', () => {
    addTransaction({ type: 'expense', amount: 35, category: '餐饮', date: '2026-05-10', note: '午餐' })
    const all = getTransactions()
    expect(all).toHaveLength(1)
    expect(all[0].type).toBe('expense')
    expect(all[0].amount).toBe(35)
    expect(all[0].id).toBeDefined()
    expect(all[0].createdAt).toBeDefined()
  })
})

describe('updateTransaction', () => {
  it('should update amount', () => {
    addTransaction({ type: 'expense', amount: 35, category: '餐饮', date: '2026-05-10', note: '午餐' })
    const id = getTransactions()[0].id
    updateTransaction(id, { amount: 40 })
    expect(getTransactions()[0].amount).toBe(40)
  })
})

describe('deleteTransaction', () => {
  it('should remove the transaction', () => {
    addTransaction({ type: 'expense', amount: 35, category: '餐饮', date: '2026-05-10', note: '午餐' })
    const id = getTransactions()[0].id
    deleteTransaction(id)
    expect(getTransactions()).toHaveLength(0)
  })
})

describe('getSummary', () => {
  it('should calculate income, expense, balance', () => {
    addTransaction({ type: 'income', amount: 10000, category: '工资', date: '2026-05-01', note: '' })
    addTransaction({ type: 'expense', amount: 500, category: '餐饮', date: '2026-05-02', note: '' })
    addTransaction({ type: 'expense', amount: 300, category: '交通', date: '2026-05-03', note: '' })
    const s = getSummary('2026-05')
    expect(s.income).toBe(10000)
    expect(s.expense).toBe(800)
    expect(s.balance).toBe(9200)
  })

  it('should return zeros for empty month', () => {
    const s = getSummary('2026-01')
    expect(s.income).toBe(0)
    expect(s.expense).toBe(0)
    expect(s.balance).toBe(0)
  })
})

describe('guessCategory', () => {
  it('should map keywords to categories', () => {
    expect(guessCategory('麦当劳')).toBe('餐饮')
    expect(guessCategory('滴滴打车')).toBe('交通')
    expect(guessCategory('淘宝买衣服')).toBe('购物')
    expect(guessCategory('报培训班')).toBe('教育')
    expect(guessCategory('去电影院')).toBe('娱乐')
    expect(guessCategory('未知内容')).toBe('其他支出')
  })
})

describe('budget', () => {
  it('should save and load budget', () => {
    saveBudget({ 餐饮: 1000, 交通: 500 })
    expect(getBudget()).toEqual({ 餐饮: 1000, 交通: 500 })
  })

  it('should calculate budget status', () => {
    saveBudget({ 餐饮: 1000 })
    addTransaction({ type: 'expense', amount: 300, category: '餐饮', date: '2026-05-01', note: '' })
    const status = getBudgetStatus('2026-05')
    expect(status.categories['餐饮'].spent).toBe(300)
    expect(status.categories['餐饮'].ratio).toBe(0.3)
  })
})

describe('monthly income', () => {
  it('should save and load', () => {
    saveMonthlyIncome(15000)
    expect(getMonthlyIncome()).toBe(15000)
  })
})

describe('getLastMonth', () => {
  it('should wrap year correctly', () => {
    expect(getLastMonth('2026-05')).toBe('2026-04')
    expect(getLastMonth('2026-01')).toBe('2025-12')
  })
})

describe('generateAISuggestions', () => {
  it('should return suggestions when enough data', () => {
    addTransaction({ type: 'income', amount: 10000, category: '工资', date: '2026-05-01', note: '' })
    addTransaction({ type: 'expense', amount: 2000, category: '餐饮', date: '2026-05-02', note: '' })
    addTransaction({ type: 'expense', amount: 1500, category: '购物', date: '2026-05-03', note: '' })
    addTransaction({ type: 'expense', amount: 800, category: '交通', date: '2026-05-04', note: '' })
    saveMonthlyIncome(10000)
    const suggestions = generateAISuggestions('2026-05')
    expect(suggestions.length).toBeGreaterThanOrEqual(2)
  })
})
