import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
 
export default function middleware(request: NextRequest) {
  // Créer le middleware next-intl
  const handleI18nRouting = createMiddleware({
    locales: ['fr', 'en', 'es', 'de'],
    defaultLocale: 'fr',
    localePrefix: 'never' // Ne pas ajouter de préfixe aux URLs
  });
 
  const response = handleI18nRouting(request);
  
  return response;
}
 
export const config = {
  // Matcher pour exclure les fichiers qui ne doivent pas être traités
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};