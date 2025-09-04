import ProductFilter from "./product-filter";
import HorizontalDivider from "@/components/horizontal-divider";
import ProductGrid from "@/components/product-grid";
import { useAtomValue } from "jotai";
import { productsState } from "@/state";
import { useParams } from "react-router-dom";
import { useMemo } from "react";

export default function ProductListPage() {
  const { id } = useParams();
  const allProducts = useAtomValue(productsState);

  // Lọc sản phẩm theo danh mục được chọn
  const products = useMemo(() => {
    if (!id) return allProducts;
    const categoryId = parseInt(id);
    return allProducts.filter(product => product.categoryId === categoryId);
  }, [allProducts, id]);

  return (
    <>
      <ProductFilter />
      <HorizontalDivider />
      {products.length > 0 ? (
        <ProductGrid products={products} className="pt-4 pb-[13px]" />
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-center text-subtitle">
            Không có sản phẩm nào trong danh mục này
          </div>
        </div>
      )}
    </>
  );
}
