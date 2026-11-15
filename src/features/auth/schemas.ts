import { z } from "zod";
import { ROLES } from "@/shared/lib/permissions";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(ROLES),
});
export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;
