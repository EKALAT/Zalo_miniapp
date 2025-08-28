import Carousel from "@/components/carousel";
import banner1 from "@/static/Mybanner/Banner-theCi-1.jpg";
import banner2 from "@/static/Mybanner/Banner-theCi-2.jpg";
import banner3 from "@/static/Mybanner/Banner-theCi-3.jpg";

export default function Banners() {
  const banners = [banner1, banner2, banner3];

  return (
    <Carousel
      slides={banners.map((banner, index) => (
        <img
          key={index}
          className="w-full rounded"
          src={banner}
          alt={`Banner ${index + 1}`}
        />
      ))}
    />
  );
}
