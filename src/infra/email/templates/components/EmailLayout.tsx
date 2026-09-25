import type { ReactNode } from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from 'react-email';

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                nutrail: { green: '#BEF264' },
                gray: { 600: '#71717A' },
              },
            },
          },
        }}
      >
        <Head />
        <Body className="bg-white font-sans">
          <Preview>{preview}</Preview>
          <Container className="mx-auto max-w-[576px] px-5 py-10 text-center">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
