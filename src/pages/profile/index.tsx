import ProfileActions from "./actions";
import FollowOA from "./follow-oa";

export default function ProfilePage() {
  return (
    <div className="min-h-full bg-section p-4 space-y-2.5">
      <ProfileActions />
      <FollowOA />
    </div>
  );
}
