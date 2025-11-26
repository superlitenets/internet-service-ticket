import { CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SaveIndicatorProps {
  show: boolean;
  message?: string;
}

export function SaveIndicator({ show, message = "Saved" }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg">
        <CheckCircle2 size={18} className="flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
