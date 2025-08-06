import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
 
export default getRequestConfig(async () => {
  // Récupérer la langue depuis les cookies ou utiliser français par défaut
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'fr';
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});