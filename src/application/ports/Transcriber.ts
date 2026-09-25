export abstract class Transcriber {
  abstract transcribe(audioUrl: string): Promise<string>;
}
