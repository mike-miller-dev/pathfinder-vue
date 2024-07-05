import { Bonus } from "./Bonus";
import { ConditionalBonus } from "./ConditionalBonus";

export interface CharacterAttack {
    name: string;
    stat: string;
    type: string;
    damageDice: string;
    crit: Number;
    attacks: Number;
    bonuses: Array<Bonus>,
    conditionalBonuses: Array<ConditionalBonus>
};
