import OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { OpenAITranscriber } from '@/infra/ai/OpenAITranscriber';

describe('OpenAITranscriber', () => {
  it('should download the audio and transcribe it', async () => {
    const client = new OpenAI({ apiKey: 'test' });
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('audio-bytes'));
    const create = vi
      .spyOn(client.audio.transcriptions, 'create')
      .mockResolvedValue({ text: 'Comi arroz e frango' } as never);

    const text = await new OpenAITranscriber(client).transcribe(
      'https://files.test/audio.m4a',
    );

    expect(text).toBe('Comi arroz e frango');
    expect(fetch).toHaveBeenCalledWith('https://files.test/audio.m4a');
    const request = create.mock.calls[0]?.[0];
    expect(request?.model).toBe('gpt-transcribe');
    expect(request?.file).toMatchObject({
      name: 'audio.m4a',
      type: 'audio/m4a',
    });
  });

  it('should fail when the audio cannot be downloaded', async () => {
    const client = new OpenAI({ apiKey: 'test' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 403 }),
    );
    const create = vi.spyOn(client.audio.transcriptions, 'create');

    await expect(
      new OpenAITranscriber(client).transcribe('https://files.test/audio.m4a'),
    ).rejects.toThrow('Could not download audio (HTTP 403).');
    expect(create).not.toHaveBeenCalled();
  });
});
