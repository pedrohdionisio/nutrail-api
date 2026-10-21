export abstract class InviteCodes {
  abstract redeem(code: string): Promise<boolean>;
  abstract release(code: string): Promise<void>;
}
