import {Inter} from '@next/font/google';
import clsx from 'clsx';
import {notFound} from 'next/navigation';
import {useLocale} from 'next-intl';
import {getTranslations} from 'next-intl/server';
import {ReactNode} from 'react';
import Navigation from 'components/Navigation';

const inter = Inter({subsets: ['latin']});

type Props = {
  children: ReactNode;
  params: {locale: string};
};

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t('LocaleLayout.title')
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const locale = useLocale();

  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound();
  }

  return (
    <html className="h-full" lang={locale}>
      <body className={clsx(inter.className, 'flex h-full flex-col')}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
