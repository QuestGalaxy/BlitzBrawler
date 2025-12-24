import publicCharacters from "@/data/public-characters.json";
import { Character, CharacterSource, Trait, UpgradeState } from "./types";
import { computeStats, deriveVisuals } from "./traits";
import { resolveImageUri } from "./web3";

export type RawMetadata = {
  name?: string;
  image?: string;
  image_url?: string;
  media_url?: string;
  attributes?: Trait[];
  traits?: Trait[];
  description?: string;
};

function normalizeAttributes(data: RawMetadata): Trait[] {
  const raw = Array.isArray(data.attributes)
    ? data.attributes
    : Array.isArray(data.traits)
      ? data.traits
      : [];
  return raw.map((trait) => ({
    trait_type: String(trait.trait_type ?? "Trait"),
    value: String(trait.value ?? "Unknown"),
  }));
}

export function mapMetadataToCharacter(
  id: string,
  data: RawMetadata,
  source: CharacterSource,
  tokenId?: string,
  upgrades?: UpgradeState
): Character {
  const attributes = normalizeAttributes(data);
  const { stats, rarity } = computeStats(attributes, source, upgrades);
  const visuals = deriveVisuals(attributes, source, rarity, upgrades);
  const resolvedImage = resolveImageUri(data.image || data.image_url || data.media_url || "");
  const image = resolvedImage || "/characters/placeholder.svg";
  return {
    id,
    name: data.name || `Token #${tokenId ?? id}`,
    image,
    attributes,
    source,
    tokenId,
    rarity,
    stats,
    visuals,
  };
}

export function getPublicCharacters(upgrades?: UpgradeState): Character[] {
  return (publicCharacters as RawMetadata[]).map((item) => {
    const raw = item as RawMetadata & { id?: string };
    const id = raw.id || raw.name || "public";
    return mapMetadataToCharacter(id, raw, "public", undefined, upgrades);
  });
}
