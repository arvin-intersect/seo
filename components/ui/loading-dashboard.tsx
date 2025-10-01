import { cn } from "@/utils/cn";

export default function LoadingDashboard({
  flameClassName,
}: {
  flameClassName: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full">
      <div
        className={cn(
          "w-16 h-16 border-4 rounded-full animate-spin border-black-alpha-20 border-t-primary-100",
          flameClassName
        )}
      />
      <p className="text-body-medium text-black-alpha-20 mt-24">Loading...</p>
    </div>
  );
}