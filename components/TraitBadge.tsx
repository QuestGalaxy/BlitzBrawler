import { Trait } from "@/lib/types";

export default function TraitBadge({ trait }: { trait: Trait }) {
  return (
    <span className="badge">
      {trait.trait_type}: {String(trait.value)}
    </span>
  );
}
