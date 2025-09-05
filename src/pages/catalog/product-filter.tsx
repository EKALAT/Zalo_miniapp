import { Select } from "@/components/lazyloaded";
import { SelectSkeleton } from "@/components/skeleton";
import { useAtom, useAtomValue } from "jotai";
import { Suspense } from "react";
import {
  colorsState,
  selectedColorState,
  selectedSizeState,
  sizesState,
} from "@/state";
import { Color } from "types";

export default function ProductFilter() {
  const sizes = useAtomValue(sizesState);
  const [size, setSize] = useAtom(selectedSizeState);
  const colors = useAtomValue(colorsState);
  const [color, setColor] = useAtom(selectedColorState);

  return (
    <div className="flex px-4 py-3 space-x-2 overflow-x-auto">
      {/* Đã xóa bộ lọc kích thước và màu sắc */}
    </div>
  );
}
