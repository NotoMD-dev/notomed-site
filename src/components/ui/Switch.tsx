// src/components/ui/Switch.tsx

import React from "react";

export function Switch({
  checked,
  onChange,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onChange(!checked)
      }
      className={`relative w-14 h-8 rounded-full border cursor-pointer transition-colors duration-200 ease-in-out ${
        checked
          ? "bg-[#2f4c3d] border-[#203528]"
          : "bg-[#e1e6db] border-[#cfd6c6]"
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b9884]`}
      title={title || (checked ? "On" : "Off")}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </div>
  );
}