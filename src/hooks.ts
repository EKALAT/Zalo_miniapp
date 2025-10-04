import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { MutableRefObject, useLayoutEffect, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UIMatch, useMatches } from "react-router-dom";
import { cartState, cartTotalState, checkoutItemsState, selectedCartItemIdsState } from "@/state";
import { Cart, CartItem, Product, SelectedOptions } from "types";
import { getDefaultOptions, isIdentical } from "@/utils/cart";
import { getConfig } from "@/utils/template";
import { openChat, purchase } from "zmp-sdk";
import { ZaloUserProfile, autoLoginAndUpsert, useAuthStatus, getUserProfile } from "@/services/auth";

export function useRealHeight(
  element: MutableRefObject<HTMLDivElement | null>,
  defaultValue?: number
) {
  const [height, setHeight] = useState(defaultValue ?? 0);
  useLayoutEffect(() => {
    if (element.current && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const [{ contentRect }] = entries;
        setHeight(contentRect.height);
      });
      ro.observe(element.current);
      return () => ro.disconnect();
    }
    return () => { };
  }, [element.current]);

  if (typeof ResizeObserver === "undefined") {
    return -1;
  }
  return height;
}

export function useAddToCart(product: Product, editingCartItemId?: number) {
  const [cart, setCart] = useAtom(cartState);
  const editing = useMemo(
    () => cart.find((item) => item.id === editingCartItemId),
    [cart, editingCartItemId]
  );

  const [options, setOptions] = useState<SelectedOptions>(
    editing ? editing.options : getDefaultOptions(product)
  );

  function handleReplace(quantity: number, cart: Cart, editing: CartItem) {
    if (quantity === 0) {
      // the user wants to remove this item.
      cart.splice(cart.indexOf(editing), 1);
    } else {
      const existed = cart.find(
        (item) =>
          item.id != editingCartItemId &&
          item.product.id === product.id &&
          isIdentical(item.options, options)
      );
      if (existed) {
        // there's another identical item in the cart; let's remove it and update the quantity in the editing item.
        cart.splice(cart.indexOf(existed), 1);
      }
      cart.splice(cart.indexOf(editing), 1, {
        ...editing,
        options,
        quantity: existed
          ? existed.quantity + quantity // updating the quantity of the identical item.
          : quantity,
      });
    }
  }

  function handleAppend(quantity: number, cart: Cart) {
    const existed = cart.find(
      (item) =>
        item.product.id === product.id && isIdentical(item.options, options)
    );
    if (existed) {
      // merging with another identical item in the cart.
      cart.splice(cart.indexOf(existed), 1, {
        ...existed,
        quantity: existed.quantity + quantity,
      });
    } else {
      // this item is new, appending it to the cart.
      cart.push({
        id: cart.length + 1,
        product,
        options,
        quantity,
      });
    }
  }

  const addToCart = (quantity: number) => {
    setCart((cart) => {
      const res = [...cart];
      if (editing) {
        handleReplace(quantity, res, editing);
      } else {
        handleAppend(quantity, res);
      }
      return res;
    });
  };

  return { addToCart, options, setOptions };
}

export function useCustomerSupport() {
  return () =>
    openChat({
      type: "oa",
      id: getConfig((config) => config.template.oaIDtoOpenChat),
    });
}

export function useToBeImplemented() {
  return () =>
    toast("Chức năng dành cho các bên tích hợp phát triển...", {
      icon: "🛠️",
    });
}

export function useCheckout() {
  const { totalAmount } = useAtomValue(cartTotalState);
  const checkoutItems = useAtomValue(checkoutItemsState);
  const setCart = useSetAtom(cartState);
  const setSelectedCartItemIds = useSetAtom(selectedCartItemIdsState);

  return async () => {
    try {
      // For now, just simulate payment success
      await purchase({
        amount: totalAmount,
        desc: "Thanh toán đơn hàng",
        method: "",
      });

      toast.success("Thanh toán thành công. Cảm ơn bạn đã mua hàng!", {
        icon: "🎉",
      });

      // Clear selected items and cart
      setSelectedCartItemIds([]);
      setCart([]);
    } catch (error) {
      toast.error(
        "Thanh toán thất bại. Vui lòng kiểm tra nội dung lỗi bên trong Console."
      );
      console.warn(error);
    }
  };
}

export function useRouteHandle() {
  const matches = useMatches() as UIMatch<
    undefined,
    {
      title?: string | Function;
      logo?: boolean;
      back?: boolean;
      scrollRestoration?: number;
    }
  >[];
  const lastMatch = matches[matches.length - 1];

  return [lastMatch.handle, lastMatch, matches] as const;
}

export function useAuth() {
  const [user, setUser] = useState<ZaloUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedIn = useAuthStatus();

  // Function to refresh user data from database
  const refreshUser = async () => {
    if (!loggedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = localStorage.getItem("zma_user_id");

    console.log("🔄 Refreshing user data...");
    console.log("User ID from localStorage:", userId);
    console.log("Logged in status:", loggedIn);

    if (userId) {
      try {
        console.log("📡 Loading user from database with ID:", userId);
        const profile = await getUserProfile(userId);
        if (profile) {
          console.log("✅ User loaded from database:", profile);
          setUser(profile);
          setLoading(false);
          return;
        } else {
          console.log("⚠️ No profile found in database for ID:", userId);
        }
      } catch (error) {
        console.error('❌ Failed to load user from database:', error);
      }
    } else {
      console.log("⚠️ No user ID found in localStorage");
    }

    // Fallback to autoLoginAndUpsert if no user ID or database load failed
    try {
      console.log("🔄 Falling back to autoLoginAndUpsert");
      const profile = await autoLoginAndUpsert();
      if (profile) {
        console.log("✅ User loaded via autoLoginAndUpsert:", profile);
        setUser(profile);
      } else {
        console.log("❌ No profile returned from autoLoginAndUpsert");
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Failed to load user via autoLoginAndUpsert:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen for custom events to refresh user data
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log("🔄 User update event received, refreshing...");
      refreshUser();
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, [loggedIn]);

  useEffect(() => {
    refreshUser();
  }, [loggedIn]);

  return { user, setUser, refreshUser, loading };
}
