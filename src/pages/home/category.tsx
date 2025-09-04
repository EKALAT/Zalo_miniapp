import Section from "@/components/section";
import TransitionLink from "@/components/transition-link";
import { useAtomValue } from "jotai";
import { Link, useNavigate } from "react-router-dom";
import { categoriesState } from "@/state";

export default function Category() {
  const categories = useAtomValue(categoriesState);

  return (
    <Section title="Danh mục sản phẩm" viewMoreTo="/categories">
      <div className="pt-2.5 pb-4 flex space-x-4 overflow-x-auto px-4">
        {categories.map((category) => (
          <TransitionLink
            key={category.id}
            className="flex flex-col items-center space-y-2 flex-none basis-[80px] overflow-hidden cursor-pointer group"
            to={`/category/${category.id}`}
          >
            <div className="relative">
              <img
                src={category.image}
                className="w-[80px] h-[80px] object-cover rounded-full border-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-200 shadow-sm"
                alt={category.name}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
            <div className="text-center text-xs w-full line-clamp-2 text-subtitle group-hover:text-primary transition-colors duration-200 font-medium">
              {category.name}
            </div>
          </TransitionLink>
        ))}
      </div>
    </Section>
  );
}
