
"use client"

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'withdraw' | 'purchase';
  amount: number;
  recipient?: string;
  service?: string;
  status: 'completed' | 'pending' | 'rejected';
  date: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  type: 'bank' | 'crypto';
  amount: number;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export type Language = 'en' | 'ar';

export const useStore = () => {
  // Mocking the behavior for the prototype
  if (typeof window === 'undefined') return {} as any;

  const getBalance = () => Number(localStorage.getItem('flash_balance') || '1000');
  const getTransactions = () => JSON.parse(localStorage.getItem('flash_transactions') || '[]');
  const getWithdrawals = () => JSON.parse(localStorage.getItem('flash_withdrawals') || '[]');
  const getUsername = () => localStorage.getItem('flash_username') || 'AlexFlash';
  const getLanguage = () => (localStorage.getItem('flash_lang') as Language) || 'en';

  const saveBalance = (val: number) => localStorage.setItem('flash_balance', val.toString());
  const saveTransactions = (val: any[]) => localStorage.setItem('flash_transactions', JSON.stringify(val));
  const saveWithdrawals = (val: any[]) => localStorage.setItem('flash_withdrawals', JSON.stringify(val));
  const saveLanguage = (val: Language) => localStorage.setItem('flash_lang', val);

  return {
    balance: getBalance(),
    username: getUsername(),
    language: getLanguage(),
    transactions: getTransactions() as Transaction[],
    withdrawals: getWithdrawals() as WithdrawalRequest[],
    
    toggleLanguage: () => {
      const current = getLanguage();
      const next = current === 'en' ? 'ar' : 'en';
      saveLanguage(next);
      // Trigger a re-render by refreshing or using a more robust state management if this was production
      window.location.reload();
    },

    sendMoney: (to: string, amount: number) => {
      const current = getBalance();
      if (current < amount) return false;
      
      const newBalance = current - amount;
      saveBalance(newBalance);
      
      const txs = getTransactions();
      txs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        type: 'send',
        amount,
        recipient: to,
        status: 'completed',
        date: new Date().toISOString()
      });
      saveTransactions(txs);
      return true;
    },

    purchaseService: (service: string, amount: number) => {
      const current = getBalance();
      if (current < amount) return false;
      
      const newBalance = current - amount;
      saveBalance(newBalance);
      
      const txs = getTransactions();
      txs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        type: 'purchase',
        amount,
        service,
        status: 'completed',
        date: new Date().toISOString()
      });
      saveTransactions(txs);
      return true;
    },

    requestWithdrawal: (type: 'bank' | 'crypto', amount: number, details: any) => {
      const current = getBalance();
      if (current < amount) return false;
      
      // Deduct immediately for pending request
      const newBalance = current - amount;
      saveBalance(newBalance);
      
      const withdrawals = getWithdrawals();
      const newReq: WithdrawalRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'user_1',
        username: getUsername(),
        type,
        amount,
        details,
        status: 'pending',
        date: new Date().toISOString()
      };
      withdrawals.unshift(newReq);
      saveWithdrawals(withdrawals);

      const txs = getTransactions();
      txs.unshift({
        id: newReq.id,
        type: 'withdraw',
        amount,
        status: 'pending',
        date: new Date().toISOString()
      });
      saveTransactions(txs);
      
      return true;
    },

    adminApprove: (id: string) => {
      const ws = getWithdrawals();
      const txs = getTransactions();
      
      const index = ws.findIndex((w: any) => w.id === id);
      if (index !== -1) {
        ws[index].status = 'approved';
        saveWithdrawals(ws);
        
        const txIndex = txs.findIndex((t: any) => t.id === id);
        if (txIndex !== -1) {
          txs[txIndex].status = 'completed';
          saveTransactions(txs);
        }
      }
    },

    adminReject: (id: string) => {
      const ws = getWithdrawals();
      const txs = getTransactions();
      
      const index = ws.findIndex((w: any) => w.id === id);
      if (index !== -1) {
        const amount = ws[index].amount;
        ws[index].status = 'rejected';
        saveWithdrawals(ws);
        
        // Refund
        const current = getBalance();
        saveBalance(current + amount);

        const txIndex = txs.findIndex((t: any) => t.id === id);
        if (txIndex !== -1) {
          txs[txIndex].status = 'rejected';
          saveTransactions(txs);
        }
      }
    }
  };
};
