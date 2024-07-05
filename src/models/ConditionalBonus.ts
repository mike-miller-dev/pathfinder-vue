import { Bonus } from "./Bonus";

export interface ConditionalBonus {
    condition: string;
    bonuses: Array<Bonus>
};
