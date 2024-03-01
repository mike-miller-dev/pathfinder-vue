import type { Buff } from "./Buff";
import type { CharacterAttack } from "./CharacterAttack";
export interface Character {
    name: string;
    baseAttack: Number;
    attacks: Array<CharacterAttack>;
    partyBuffs: Array<Buff>;
    selfBuffs: Array<Buff>;
    conditionals: Array<Buff>;
};
