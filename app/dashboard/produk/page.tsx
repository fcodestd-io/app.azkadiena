import { getProducts, getAttributesForProduct } from "./action";
import { ProductPageClient } from "./page-client";

export default async function ProductsPage() {
  const [{ products, hasMore }, attributes] = await Promise.all([
    getProducts(1, 10),
    getAttributesForProduct(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ProductPageClient
        initialProducts={products}
        hasMoreInitial={hasMore}
        availableSizes={attributes.sizes}
        availableColors={attributes.colors}
      />
    </main>
  );
}
