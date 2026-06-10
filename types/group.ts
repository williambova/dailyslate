import type { User } from "./user";

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: User[];
}
