import { Product } from "@/types";
import { formatPrice } from "@/utils/format";
import TransitionLink from "./transition-link";
import { useState } from "react";

export interface ProductItemProps {
  product: Product;
  /**
   * Whether to replace the current page when user clicks on this product item. Default behavior is to push a new page to the history stack.
   * This prop should be used when navigating to a new product detail from a current product detail page (related products, etc.)
   */
  replace?: boolean;
}

export default function ProductItem(props: ProductItemProps) {
  const [selected, setSelected] = useState(false);

  return (
    <TransitionLink
      className="flex flex-col cursor-pointer group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      to={`/product/${props.product.id}`}
      replace={props.replace}
      onClick={() => setSelected(true)}
    >
      {({ isTransitioning }) => (
        <>
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={props.product.image}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
              style={{
                viewTransitionName:
                  isTransitioning && selected // only animate the "clicked" product item in related products list
                    ? `product-image-${props.product.id}`
                    : undefined,
              }}
              alt={props.product.name}
            />
            <div className="absolute top-2 right-2 bg-primary text-white text-2xs px-2 py-1 rounded-full font-medium">
              {props.product.category.name}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs h-9 line-clamp-2 font-medium text-foreground mb-2 leading-tight">
              {props.product.name}
            </div>
            <div className="text-sm font-bold text-primary mb-2">
              {formatPrice(props.product.price)}
            </div>
          </div>
        </>
      )}
    </TransitionLink>
  );
}
