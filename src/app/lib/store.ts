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

interface UserState {
  isLoggedIn: boolean;
  username: string;
  balance: number;
  transactions: Transaction[];
  login: (username: string) => void;
  logout: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  updateBalance: (amount: number) => void;
}

interface AdminState {
  pendingWithdrawals: WithdrawalRequest[];
  approveWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string) => void;
  addWithdrawalRequest: (req: Omit<WithdrawalRequest, 'id' | 'date' | 'status'>) => void;
}

// Simple simulation of a global store using a pattern similar to Zustand
// Since we don't have Zustand installed, we'll use a custom observer pattern or React Context.
// Actually, let's just use local storage for the demo persistence.

export const useStore = () => {
  // Mocking the behavior for the prototype
  if (typeof window === 'undefined') return {} as any;

  const getBalance = () => Number(localStorage.getItem('flash_balance') || '1000');
  const getTransactions = () => JSON.parse(localStorage.getItem('flash_transactions') || '[]');
  const getWithdrawals = () => JSON.parse(localStorage.getItem('flash_withdrawals') || '[]');
  const getUsername = () => localStorage.getItem('flash_username') || 'AlexFlash';

  const saveBalance = (val: number) => localStorage.setItem('flash_balance', val.toString());
  const saveTransactions = (val: any[]) => localStorage.setItem('flash_transactions', JSON.stringify(val));
  const saveWithdrawals = (val: any[]) => localStorage.setItem('flash_withdrawals', JSON.stringify(val));

  return {
    balance: getBalance(),
    username: getUsername(),
    transactions: getTransactions() as Transaction[],
    withdrawals: getWithdrawals() as WithdrawalRequest[],
    
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