import type { Transcriber } from '@/application/ports/Transcriber';

export class FakeTranscriber implements Transcriber {
  text = 'Comi 120 g de arroz e 150 g de frango grelhado';
  error: Error | null = null;
  readonly calls: string[] = [];

  async transcribe(audioUrl: string): Promise<string> {
    this.calls.push(audioUrl);

    if (this.error) throw this.error;

    return this.text;
  }
}
