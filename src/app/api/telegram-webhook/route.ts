import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, runTransaction, increment, collection, setDoc, updateDoc } from 'firebase/firestore';

const TELEGRAM_CHAT_ID = '7306867055';
const TELEGRAM_TOKEN = '8236708164:AAHi0AYmvf3_IJEpYAgug-GYdf4O9AkvZY4';

export async function POST(request: Request) {
  const body = await request.json();
  const { firestore } = initializeFirebase();

  // Check if it's a callback query (button press)
  if (body.callback_query) {
    const { id: callbackQueryId, data, from } = body.callback_query;

    // Security check: Only Authorized Admin
    if (from.id.toString() !== TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    const [action, type, docId] = data.split('_');

    try {
      if (type === 'dep') {
        const depositRef = doc(firestore, 'deposits', docId);
        const depSnap = await getDoc(depositRef);
        if (!depSnap.exists()) throw new Error("Deposit ID not found");
        const depData = depSnap.data();

        if (action === 'app' && depData.status === 'pending') {
          await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', depData.userId);
            const txRef = doc(collection(firestore, 'users', depData.userId, 'transactions'));
            const notifRef = doc(collection(firestore, 'users', depData.userId, 'notifications'));

            transaction.update(depositRef, { status: 'approved' });
            transaction.update(userRef, { balance: increment(depData.amount) });
            transaction.set(txRef, {
              type: 'deposit',
              amount: depData.amount,
              status: 'completed',
              date: new Date().toISOString()
            });
            transaction.set(notifRef, {
              title: "Deposit Approved",
              message: `Success! $${depData.amount} has been credited to your vault.`,
              type: 'transaction',
              read: false,
              date: new Date().toISOString()
            });
          });
          await answerTelegram(callbackQueryId, `✅ Approved for @${depData.username}`);
        } else if (action === 'rej') {
          await updateDoc(depositRef, { status: 'rejected' });
          await answerTelegram(callbackQueryId, `❌ Rejected for @${depData.username}`);
        }
      } 
      else if (type === 'wit') {
        const withdrawalRef = doc(firestore, 'withdrawals', docId);
        const witSnap = await getDoc(withdrawalRef);
        if (!witSnap.exists()) throw new Error("Withdrawal ID not found");
        const witData = witSnap.data();

        if (action === 'app' && witData.status === 'pending') {
          await updateDoc(withdrawalRef, { status: 'approved' });
          const notifRef = doc(collection(firestore, 'users', witData.userId, 'notifications'));
          await setDoc(notifRef, {
            title: "Withdrawal Confirmed",
            message: `Your request for $${witData.amount} has been processed.`,
            type: 'transaction',
            read: false,
            date: new Date().toISOString()
          });
          await answerTelegram(callbackQueryId, `✅ Withdrawal Approved: @${witData.username}`);
        } else if (action === 'rej') {
          // Refund logic
          await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', witData.userId);
            const txRef = doc(collection(firestore, 'users', witData.userId, 'transactions'));
            transaction.update(withdrawalRef, { status: 'rejected' });
            transaction.update(userRef, { balance: increment(witData.amount) });
            transaction.set(txRef, {
              type: 'receive',
              amount: witData.amount,
              status: 'completed',
              sender: 'SYSTEM REFUND',
              date: new Date().toISOString()
            });
          });
          await answerTelegram(callbackQueryId, `❌ Rejected & Refunded: @${witData.username}`);
        }
      }
      else if (type === 'ver') {
        const verifRef = doc(firestore, 'verifications', docId);
        const verSnap = await getDoc(verifRef);
        if (!verSnap.exists()) throw new Error("KYC ID not found");
        const verData = verSnap.data();

        if (action === 'app') {
          await updateDoc(verifRef, { status: 'approved' });
          await updateDoc(doc(firestore, 'users', verData.userId), { verified: true });
          await answerTelegram(callbackQueryId, `🛡️ KYC Approved: @${verData.username}`);
        } else if (action === 'rej') {
          await updateDoc(verifRef, { status: 'rejected' });
          await answerTelegram(callbackQueryId, `❌ KYC Rejected: @${verData.username}`);
        }
      }

    } catch (e: any) {
      await answerTelegram(callbackQueryId, `⚠️ Error: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true });
}

async function answerTelegram(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text, show_alert: true }),
  });
}
