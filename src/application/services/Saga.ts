type Compensation = () => Promise<void>;

export class Saga {
  private readonly compensations: Compensation[] = [];

  addCompensation(compensation: Compensation): void {
    this.compensations.unshift(compensation);
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await this.compensate();

      throw error;
    }
  }

  private async compensate(): Promise<void> {
    for (const compensation of this.compensations) {
      try {
        await compensation();
      } catch (error) {
        console.error('Saga compensation failed.', error);
      }
    }
  }
}
