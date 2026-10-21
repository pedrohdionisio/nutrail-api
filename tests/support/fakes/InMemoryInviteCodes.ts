import type { InviteCodes } from '@/application/ports/InviteCodes';
import type { InMemoryDatabase } from './InMemoryDatabase';

export class InMemoryInviteCodes implements InviteCodes {
  constructor(private readonly db: InMemoryDatabase) {}

  async redeem(code: string): Promise<boolean> {
    const invite = this.db.invites.get(code);

    if (!invite || invite.uses >= invite.maxUses) {
      return false;
    }

    invite.uses += 1;

    return true;
  }

  async release(code: string): Promise<void> {
    const invite = this.db.invites.get(code);

    if (invite && invite.uses > 0) {
      invite.uses -= 1;
    }
  }
}
