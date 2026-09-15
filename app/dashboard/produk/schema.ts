import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Nama produk minimal 2 karakter")
    .max(100, "Nama produk maksimal 100 karakter"),
  sizeIds: z.array(z.string().uuid()).min(1, "Pilih minimal 1 ukuran"),
  colorIds: z.array(z.string().uuid()).min(1, "Pilih minimal 1 warna"),
});

export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
