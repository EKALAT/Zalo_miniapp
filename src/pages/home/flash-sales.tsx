import ProductGrid from "@/components/product-grid";
import Section from "@/components/section";
import { useAtomValue } from "jotai";
import { flashSaleProductsState } from "@/state";

export default function FlashSales() {
  const products = useAtomValue(flashSaleProductsState);

  return (
    <Section title="Sản phẩm nổi bật" viewMoreTo="/flash-sales">
      <ProductGrid products={products} />
    </Section>
  );
}
