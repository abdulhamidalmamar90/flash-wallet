
'use server';

import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc } from 'firebase/firestore';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function submitTicketAndSendEmail(input: {
  userId: string;
  username: string;
  email: string;
  subject: string;
  message: string;
  imageUrl: string | null;
  language: 'ar' | 'en';
}) {
  const { firestore } = initializeFirebase();

  try {
    // 1. Save Ticket to Firestore
    const ticketRef = await addDoc(collection(firestore, 'support_tickets'), {
      userId: input.userId,
      username: input.username,
      email: input.email,
      subject: input.subject,
      message: input.message,
      imageUrl: input.imageUrl,
      status: 'open',
      date: new Date().toISOString(),
    });

    const ticketId = ticketRef.id.slice(0, 8).toUpperCase();

    // 2. Prepare Email Content
    const isAr = input.language === 'ar';
    const emailSubject = isAr 
      ? `تم فتح تذكرة دعم جديدة: ${input.subject}` 
      : `New Support Ticket Opened: ${input.subject}`;
    
    const emailBody = isAr ? `
      <div dir="rtl" style="font-family: sans-serif; color: #1a1a1a;">
        <h2 style="color: #D4AE35;">مرحباً @${input.username}،</h2>
        <p>لقد تم استلام طلب الدعم الخاص بك بنجاح.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>رقم التذكرة:</strong> #${ticketId}</p>
          <p><strong>الموضوع:</strong> ${input.subject}</p>
          <p><strong>الحالة:</strong> قيد المراجعة</p>
        </div>
        <p>سيقوم فريقنا بمراجعة استفسارك والرد عليك في أقرب وقت ممكن عبر لوحة التحكم.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">هذه رسالة تلقائية من نظام FLASH، يرجى عدم الرد عليها.</p>
      </div>
    ` : `
      <div style="font-family: sans-serif; color: #1a1a1a;">
        <h2 style="color: #D4AE35;">Hello @${input.username},</h2>
        <p>Your support request has been received successfully.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Ticket ID:</strong> #${ticketId}</p>
          <p><strong>Subject:</strong> ${input.subject}</p>
          <p><strong>Status:</strong> Under Review</p>
        </div>
        <p>Our team will review your inquiry and get back to you as soon as possible via the dashboard.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">This is an automated message from the FLASH system, please do not reply.</p>
      </div>
    `;

    // 3. Send Email via Resend
    // In production, you must use a verified domain.
    await resend.emails.send({
      from: 'FLASH Support <support@resend.dev>', // Replace with your verified domain
      to: [input.email],
      subject: emailSubject,
      html: emailBody,
    });

    return { success: true, ticketId: ticketRef.id };
  } catch (error: any) {
    console.error('Failed to process ticket:', error);
    return { success: false, error: error.message };
  }
}
