import {useRouter} from 'next/navigation';
import {useTransition} from 'react';

export function useChangeLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(locale: string) {
    startTransition(() => {
      // Sauvegarder la langue dans les cookies
      document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 an
      
      // Recharger la page complètement pour appliquer la nouvelle langue
      window.location.reload();
    });
  }

  return {changeLocale, isPending};
}

export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'fr';
  
  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find(c => c.trim().startsWith('locale='));
  
  if (localeCookie) {
    return localeCookie.split('=')[1];
  }
  
  return 'fr'; // langue par défaut
}