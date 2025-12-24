"use client";

export type TabOption = {
  key: string;
  label: string;
};

type TabSwitchProps = {
  value: string;
  onChange: (key: string) => void;
  options: TabOption[];
};

export default function TabSwitch({ value, onChange, options }: TabSwitchProps) {
  return (
    <div className="flex gap-2 p-1 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-lg h-14 relative overflow-hidden shadow-xl">
      {options.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`flex-1 relative z-10 font-heading text-lg uppercase italic transition-all duration-300
              ${isActive ? "text-black" : "text-white/40 hover:text-white"}`}
          >
            {option.label}
          </button>
        );
      })}
      
      {/* Animated Background Selector */}
      <div 
        className="absolute top-1 bottom-1 transition-all duration-300 bg-brand-gold shadow-[0_0_20px_rgba(251,191,36,0.4)]"
        style={{
          width: `calc(${100 / options.length}% - 8px)`,
          left: `calc(${(options.findIndex(o => o.key === value) / options.length) * 100}% + 4px)`,
          clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)",
        }}
      />
    </div>
  );
}