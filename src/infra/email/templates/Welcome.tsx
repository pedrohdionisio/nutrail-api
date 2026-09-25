import { Heading, Text } from 'react-email';
import { EmailLayout } from './components/EmailLayout';

type WelcomeProps = {
  name: string;
};

export default function Welcome({ name }: WelcomeProps) {
  return (
    <EmailLayout preview="Sua conta no Nutrail está pronta">
      <Heading as="h1" className="m-0 text-2xl">
        Bem-vindo ao <span className="text-nutrail-green">Nutrail</span>, {name}
        !
      </Heading>
      <Heading as="h2" className="mt-2 text-base font-normal text-gray-600">
        Sua conta foi criada 🎉
      </Heading>

      <Text className="pt-6 text-base">
        Suas metas diárias de calorias e macros já estão prontas. Agora é só
        registrar as refeições e acompanhar o seu progresso.
      </Text>

      <Text className="pt-4 text-sm text-gray-600">Bons registros!</Text>
    </EmailLayout>
  );
}

Welcome.PreviewProps = {
  name: 'Pedro',
} satisfies WelcomeProps;
