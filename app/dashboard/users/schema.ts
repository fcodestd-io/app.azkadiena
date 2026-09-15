import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "spv_warehouse"], {
    errorMap: () => ({ message: "Role hanya boleh Admin atau SPV Warehouse" }),
  }),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().optional().or(z.literal("")),
  role: z.enum(["owner", "admin", "spv_warehouse"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
