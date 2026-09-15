import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. ENUMS
// ==========================================

export const roleEnum = pgEnum("role", ["owner", "admin", "spv_warehouse"]);

export const targetStatusEnum = pgEnum("target_status", [
  "started",
  "finished",
  "canceled",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "in",
  "out",
  "adjustment",
  "return",
]);

// ==========================================
// 2. USERS
// ==========================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 3. MASTER DATA & RELATIONS
// ==========================================

export const marketplaces = pgTable("marketplaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketplacesRelations = relations(marketplaces, ({ many }) => ({
  goodsOutOrders: many(goodsOut),
  returns: many(returns),
}));

export const sizes = pgTable("sizes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
});

export const sizesRelations = relations(sizes, ({ many }) => ({
  variants: many(productVariants),
}));

export const colors = pgTable("colors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
});

export const colorsRelations = relations(colors, ({ many }) => ({
  variants: many(productVariants),
}));

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

export const confections = pgTable("confections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  supervisorName: text("supervisor_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const confectionsRelations = relations(confections, ({ many }) => ({
  goodsInReceipts: many(goodsIn),
}));

// ==========================================
// 4. PRODUCT VARIANTS & RELATIONS
// ==========================================

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sizeId: uuid("size_id")
    .notNull()
    .references(() => sizes.id),
  colorId: uuid("color_id")
    .notNull()
    .references(() => colors.id),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode").notNull().unique(),
  stock: integer("stock").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    size: one(sizes, {
      fields: [productVariants.sizeId],
      references: [sizes.id],
    }),
    color: one(colors, {
      fields: [productVariants.colorId],
      references: [colors.id],
    }),
    movements: many(stockMovements),
    cuttingTargetItems: many(cuttingTargetItems),
    goodsInItems: many(goodsInItems),
    goodsOutItems: many(goodsOutItems),
    returnItems: many(returnItems),
    adjustmentItems: many(stockAdjustmentItems),
  }),
);

// ==========================================
// 5. CUTTING TARGETS (Header & Item)
// ==========================================

export const cuttingTargets = pgTable("cutting_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetCode: text("target_code").notNull().unique(),
  operatorName: text("operator_name").notNull(),
  status: targetStatusEnum("status").default("started").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cuttingTargetsRelations = relations(
  cuttingTargets,
  ({ many }) => ({
    items: many(cuttingTargetItems),
    goodsInReceipts: many(goodsIn),
  }),
);

export const cuttingTargetItems = pgTable("cutting_target_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cuttingTargetId: uuid("cutting_target_id")
    .notNull()
    .references(() => cuttingTargets.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  qtyTarget: integer("qty_target").notNull(),
  qtySelesai: integer("qty_selesai").default(0).notNull(),
});

export const cuttingTargetItemsRelations = relations(
  cuttingTargetItems,
  ({ one }) => ({
    cuttingTarget: one(cuttingTargets, {
      fields: [cuttingTargetItems.cuttingTargetId],
      references: [cuttingTargets.id],
    }),
    variant: one(productVariants, {
      fields: [cuttingTargetItems.productVariantId],
      references: [productVariants.id],
    }),
  }),
);

// ==========================================
// 6. BARANG MASUK / GOODS IN (Header & Item)
// ==========================================

export const goodsIn = pgTable("goods_in", {
  id: uuid("id").defaultRandom().primaryKey(),
  receiptCode: text("receipt_code").notNull().unique(),
  confectionId: uuid("confection_id")
    .notNull()
    .references(() => confections.id),
  cuttingTargetId: uuid("cutting_target_id").references(
    () => cuttingTargets.id,
    { onDelete: "set null" },
  ),
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goodsInRelations = relations(goodsIn, ({ one, many }) => ({
  confection: one(confections, {
    fields: [goodsIn.confectionId],
    references: [confections.id],
  }),
  cuttingTarget: one(cuttingTargets, {
    fields: [goodsIn.cuttingTargetId],
    references: [cuttingTargets.id],
  }),
  items: many(goodsInItems),
}));

export const goodsInItems = pgTable("goods_in_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  goodsInId: uuid("goods_in_id")
    .notNull()
    .references(() => goodsIn.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  qty: integer("qty").notNull(),
});

export const goodsInItemsRelations = relations(goodsInItems, ({ one }) => ({
  goodsIn: one(goodsIn, {
    fields: [goodsInItems.goodsInId],
    references: [goodsIn.id],
  }),
  variant: one(productVariants, {
    fields: [goodsInItems.productVariantId],
    references: [productVariants.id],
  }),
}));

// ==========================================
// 7. BARANG KELUAR / GOODS OUT (Header & Item)
// ==========================================

export const goodsOut = pgTable("goods_out", {
  id: uuid("id").defaultRandom().primaryKey(),
  outCode: text("out_code").notNull().unique(),
  marketplaceId: uuid("marketplace_id")
    .notNull()
    .references(() => marketplaces.id),
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goodsOutRelations = relations(goodsOut, ({ one, many }) => ({
  marketplace: one(marketplaces, {
    fields: [goodsOut.marketplaceId],
    references: [marketplaces.id],
  }),
  items: many(goodsOutItems),
}));

export const goodsOutItems = pgTable("goods_out_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  goodsOutId: uuid("goods_out_id")
    .notNull()
    .references(() => goodsOut.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  qty: integer("qty").notNull(),
});

export const goodsOutItemsRelations = relations(goodsOutItems, ({ one }) => ({
  goodsOut: one(goodsOut, {
    fields: [goodsOutItems.goodsOutId],
    references: [goodsOut.id],
  }),
  variant: one(productVariants, {
    fields: [goodsOutItems.productVariantId],
    references: [productVariants.id],
  }),
}));

// ==========================================
// 8. RETUR / RETURNS (Header & Item)
// ==========================================

export const returns = pgTable("returns", {
  id: uuid("id").defaultRandom().primaryKey(),
  returnCode: text("return_code").notNull().unique(),
  marketplaceId: uuid("marketplace_id")
    .notNull()
    .references(() => marketplaces.id),
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const returnsRelations = relations(returns, ({ one, many }) => ({
  marketplace: one(marketplaces, {
    fields: [returns.marketplaceId],
    references: [marketplaces.id],
  }),
  items: many(returnItems),
}));

export const returnItems = pgTable("return_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  returnId: uuid("return_id")
    .notNull()
    .references(() => returns.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  qtyBagus: integer("qty_bagus").default(0).notNull(),
  qtyCacat: integer("qty_cacat").default(0).notNull(),
});

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  returnHeader: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
  variant: one(productVariants, {
    fields: [returnItems.productVariantId],
    references: [productVariants.id],
  }),
}));

// ==========================================
// 9. ADJUSTMENT STOK / OPNAME (Header & Item)
// ==========================================

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  adjustmentCode: text("adjustment_code").notNull().unique(),
  title: text("title").notNull(),
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ many }) => ({
    items: many(stockAdjustmentItems),
  }),
);

export const stockAdjustmentItems = pgTable("stock_adjustment_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  stockAdjustmentId: uuid("stock_adjustment_id")
    .notNull()
    .references(() => stockAdjustments.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  qtySebelum: integer("qty_sebelum").notNull(),
  qtySesudah: integer("qty_sesudah").notNull(),
  selisih: integer("selisih").notNull(),
});

export const stockAdjustmentItemsRelations = relations(
  stockAdjustmentItems,
  ({ one }) => ({
    adjustmentHeader: one(stockAdjustments, {
      fields: [stockAdjustmentItems.stockAdjustmentId],
      references: [stockAdjustments.id],
    }),
    variant: one(productVariants, {
      fields: [stockAdjustmentItems.productVariantId],
      references: [productVariants.id],
    }),
  }),
);

// ==========================================
// 10. STOCK MOVEMENTS (Kartu Stok Audit Detail Item)
// ==========================================

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  type: movementTypeEnum("type").notNull(),
  qty: integer("qty").notNull(),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  referenceId: uuid("reference_id"), // Menunjuk ke ID Header (GoodsIn, GoodsOut, Return, atau Adjustment)
  referenceItemId: uuid("reference_item_id"), // Menunjuk ke ID Item spesifik
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  variant: one(productVariants, {
    fields: [stockMovements.productVariantId],
    references: [productVariants.id],
  }),
}));

export type Role = (typeof roleEnum.enumValues)[number];
export type TargetStatus = (typeof targetStatusEnum.enumValues)[number];
export type MovementType = (typeof movementTypeEnum.enumValues)[number];
