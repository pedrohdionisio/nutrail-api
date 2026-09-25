import OpenAI, { toFile } from 'openai';
import type { Transcriber } from '@/application/ports/Transcriber';
import { Injectable } from '@/kernel/decorators/Injectable';

const MODEL = 'gpt-transcribe';

@Injectable()
export class OpenAITranscriber implements Transcriber {
  constructor(private readonly client: OpenAI) {}

  async transcribe(audioUrl: string): Promise<string> {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`Could not download audio (HTTP ${response.status}).`);
    }

    const file = await toFile(response, 'audio.m4a', { type: 'audio/m4a' });

    const { text } = await this.client.audio.transcriptions.create({
      model: MODEL,
      file,
    });

    return text;
  }
}
