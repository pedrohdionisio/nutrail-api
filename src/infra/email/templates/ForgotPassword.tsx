import { Heading, Section, Text } from 'react-email';
import { EmailLayout } from './components/EmailLayout';

type ForgotPasswordProps = {
  code: string;
};

export default function ForgotPassword({ code }: ForgotPasswordProps) {
  return (
    <EmailLayout preview="Seu código para redefinir a senha">
      <Heading as="h1" className="m-0 text-2xl">
        Recupere a sua conta
      </Heading>
      <Heading as="h2" className="mt-2 text-base font-normal text-gray-600">
        Redefina a sua senha e volte ao foco 💪
      </Heading>

      <Section className="pt-8">
        <span className="inline-block rounded-md bg-gray-100 px-8 py-4 text-3xl font-bold tracking-[16px]">
          {code}
        </span>
      </Section>

      <Text className="pt-8 text-sm text-gray-600">
        Se você não solicitou esta troca, fique tranquilo: sua conta continua
        segura.
      </Text>
    </EmailLayout>
  );
}

ForgotPassword.PreviewProps = {
  code: '336318',
} satisfies ForgotPasswordProps;
