import { z } from "zod";

export const createAttributeSchema = z.object({
  name: z
    .string()
    .min(1, "Nama atribut tidak boleh kosong")
    .max(30, "Nama atribut maksimal 30 karakter"),
  type: z.enum(["size", "color"], {
    errorMap: () => ({ message: "Tipe harus size atau color" }),
  }),
});

export const updateAttributeSchema = createAttributeSchema.extend({
  id: z.string().uuid(),
});

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
