import { Heading, Section, Text } from 'react-email';
import type { Language } from '@/domain/value-objects/Language';
import { EmailLayout } from './components/EmailLayout';

const COPY: Record<
  Language,
  {
    subject: string;
    preview: string;
    title: string;
    subtitle: string;
    notice: string;
  }
> = {
  'pt-BR': {
    subject: 'Nutrail | Recupere a sua conta 🔑',
    preview: 'Seu código para redefinir a senha',
    title: 'Recupere a sua conta',
    subtitle: 'Redefina a sua senha e volte ao foco 💪',
    notice:
      'Se você não solicitou esta troca, fique tranquilo: sua conta continua segura.',
  },
  'en-US': {
    subject: 'Nutrail | Recover your account 🔑',
    preview: 'Your code to reset your password',
    title: 'Recover your account',
    subtitle: 'Reset your password and get back on track 💪',
    notice:
      'If you did not ask for this change, do not worry: your account is still safe.',
  },
};

type ForgotPasswordProps = {
  code: string;
  language: Language;
};

export function forgotPasswordSubject(language: Language): string {
  return COPY[language].subject;
}

export default function ForgotPassword({
  code,
  language,
}: ForgotPasswordProps) {
  const copy = COPY[language];

  return (
    <EmailLayout language={language} preview={copy.preview}>
      <Heading as="h1" className="m-0 text-2xl">
        {copy.title}
      </Heading>
      <Heading as="h2" className="mt-2 text-base font-normal text-gray-600">
        {copy.subtitle}
      </Heading>

      <Section className="pt-8">
        <span className="inline-block rounded-md bg-gray-100 px-8 py-4 text-3xl font-bold tracking-[16px]">
          {code}
        </span>
      </Section>

      <Text className="pt-8 text-sm text-gray-600">{copy.notice}</Text>
    </EmailLayout>
  );
}

ForgotPassword.PreviewProps = {
  code: '336318',
  language: 'pt-BR',
} satisfies ForgotPasswordProps;
