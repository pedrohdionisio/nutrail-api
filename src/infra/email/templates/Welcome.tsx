import { Heading, Text } from 'react-email';
import type { Language } from '@/domain/value-objects/Language';
import { EmailLayout } from './components/EmailLayout';

const COPY: Record<
  Language,
  {
    subject: string;
    preview: string;
    greeting: string;
    subtitle: string;
    body: string;
    signOff: string;
  }
> = {
  'pt-BR': {
    subject: 'Bem-vindo ao Nutrail! 🥗',
    preview: 'Sua conta no Nutrail está pronta',
    greeting: 'Bem-vindo ao',
    subtitle: 'Sua conta foi criada 🎉',
    body: 'Suas metas diárias de calorias e macros já estão prontas. Agora é só registrar as refeições e acompanhar o seu progresso.',
    signOff: 'Bons registros!',
  },
  'en-US': {
    subject: 'Welcome to Nutrail! 🥗',
    preview: 'Your Nutrail account is ready',
    greeting: 'Welcome to',
    subtitle: 'Your account was created 🎉',
    body: 'Your daily calorie and macro goals are ready. Now just log your meals and follow your progress.',
    signOff: 'Happy logging!',
  },
};

type WelcomeProps = {
  name: string;
  language: Language;
};

export function welcomeSubject(language: Language): string {
  return COPY[language].subject;
}

export default function Welcome({ name, language }: WelcomeProps) {
  const copy = COPY[language];

  return (
    <EmailLayout language={language} preview={copy.preview}>
      <Heading as="h1" className="m-0 text-2xl">
        {copy.greeting} <span className="text-nutrail-green">Nutrail</span>,{' '}
        {name}!
      </Heading>
      <Heading as="h2" className="mt-2 text-base font-normal text-gray-600">
        {copy.subtitle}
      </Heading>

      <Text className="pt-6 text-base">{copy.body}</Text>

      <Text className="pt-4 text-sm text-gray-600">{copy.signOff}</Text>
    </EmailLayout>
  );
}

Welcome.PreviewProps = {
  name: 'Pedro',
  language: 'pt-BR',
} satisfies WelcomeProps;
