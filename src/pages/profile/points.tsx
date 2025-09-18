import pointsCover from "@/static/points-cover.png";
import Barcode from "./barcode";

export default function Points() {
  return (
    <div
      className="rounded-lg bg-primary text-white p-6 bg-cover"
      style={{ backgroundImage: `url(${pointsCover})` }}
    >
      <div className="text-xl font-medium opacity-95">Thành viên</div>

      <div className="bg-white rounded-lg mt-3 py-2.5 space-y-2.5 flex flex-col items-center text-center">
        <div className="text-2xs text-subtitle">Quét mã để tích điểm</div>
        <Barcode />
      </div>
    </div>
  );
}
