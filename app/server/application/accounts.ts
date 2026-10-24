import type { Actor } from "../domain/model.js";
export interface AccountInput {
  email: string;
  password: string;
  name: string;
}
export interface AccountProvisioner {
  provisionAccount(input: AccountInput): Promise<{ user: Actor }>;
  recoverBootstrapAccount(input: AccountInput): Promise<{ user: Actor }>;
}
