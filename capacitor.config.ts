import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flashwallet.eng',
  appName: 'Flash Wallet', // يمكنك تغيير 'out' لاسم تطبيقك الحقيقي هنا
  webDir: 'out'            // هذا هو التعديل الأهم
};

export default config;