import { Bonus } from "./Bonus";

export interface Buff {
    name: string;
    conditions: Array<string>;
    bonuses: Array<Bonus>;
};