import { CheckCircle2 } from "lucide-react";

interface NotificationBannerProps {
  message: string;
  variant?: "success" | "error" | "info";
}

export function NotificationBanner({ message, variant = "success" }: NotificationBannerProps) {
  const bgColor = variant === "success" ? "bg-white" : variant === "error" ? "bg-red-50" : "bg-blue-50";
  const iconColor = variant === "success" ? "text-green-600" : variant === "error" ? "text-red-600" : "text-blue-600";
  
  return (
    <div className={`${bgColor} rounded-lg px-4 py-3 mx-4 my-2 border border-gray-200 shadow-sm`}>
      <div className="flex items-center gap-3">
        {variant === "success" && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">{message}</span>
      </div>
    </div>
  );
}
