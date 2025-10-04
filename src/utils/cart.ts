import { Product, SelectedOptions } from "types";

export function getDefaultOptions(product: Product): SelectedOptions {
  return {
    size: product.sizes?.[0],
  };
}

export function isIdentical(
  option1: SelectedOptions,
  option2: SelectedOptions
) {
  return option1.size === option2.size;
}

export function clearCartFromStorage() {
  try {
    // Clear cart from localStorage
    localStorage.removeItem('cart');
    localStorage.removeItem('selectedCartItemIds');
    console.log('🛒 Cart cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing cart from localStorage:', error);
  }
}