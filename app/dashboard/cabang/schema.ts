import { z } from "zod";

export const createConfectionSchema = z.object({
  name: z
    .string()
    .min(3, "Nama konveksi minimal 3 karakter")
    .max(50, "Nama konveksi maksimal 50 karakter"),
  supervisorName: z
    .string()
    .min(2, "Nama penanggung jawab (SPV) minimal 2 karakter"),
});

export const updateConfectionSchema = createConfectionSchema.extend({
  id: z.string().uuid(),
});

export type CreateConfectionInput = z.infer<typeof createConfectionSchema>;
export type UpdateConfectionInput = z.infer<typeof updateConfectionSchema>;
