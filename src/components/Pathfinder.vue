<template>
  <div>

    <select v-model="selectedCharacter" @change="selectFirstAttack">
      <option v-for="character in characters" :value="character">
        {{ character.name }}
      </option>
    </select>

    <div v-if="selectedCharacter">
      <CombinedBuffs :character="selectedCharacter" :selected-attack="selectedAttack" @changed="combinedBuffs = $event" @conditions-changed="conditions = $event"/>

      <div>
        <select v-model="selectedAttack">
          <option v-for="attack in selectedCharacter.attacks" :value="attack">
            {{ attack.name }}
          </option>
        </select>
        <br />
        <br />

        <Slider v-if="fullAttacks.length > 1" :value="isFullAttack" @changed="isFullAttack = $event" />
        <br />

        <div>
          <input type="checkbox" id="crit-confirmation" :value="isCritConfirmationChecked" v-model="isCritConfirmationChecked" :disabled="isFullAttack">
          <label for="crit-confirmation" :class="isFullAttack ? 'disabled': ''">crit confirmation</label>
        </div>

        -------------------

        <div v-for="(iterative, i) in fullAttacks">
          <div v-if="isFullAttack">
            {{ simpleAttack(iterative) }}
          </div>
          <div v-else>
            <input type="radio" :id="'iterative' + i" :name="'iterative' + i" :value="i" v-model="selectedIterativeIndex" />
            <label :for="'iterative' + i">{{ simpleAttack(iterative) }}</label>
          </div>
        </div>
        <br />

        <div class="macro" v-if="fullAttackMacro" @click="copyToClipboard">
          {{fullAttackMacro}}
        </div>
        
      </div>
    </div>
    
  </div>

</template>

<script lang="ts">
import { useToast } from "vue-toastification";
import { defineComponent } from 'vue'
import CombinedBuffs from './CombinedBuffs.vue';
import Slider from './Slider.vue';
import type { Buff } from "@/models/Buff";
import type { CombinedBuff } from "@/models/CombinedBuff";
import type { Character } from "@/models/Character";
import type { CharacterAttack } from "@/models/CharacterAttack";
import type { IterativeAttack } from "@/models/IterativeAttack";
export default defineComponent({
  name: 'Pathfinder',
  components: {
    CombinedBuffs,
    Slider
},
  data() {
    const characters = [
        {
          name: 'Deebo',
          baseAttack: 13,
          str: 27,
          attacks:  [
            { name: 'Furious Adamantine Chainsaw +2', stat: 'str', type: 'melee2h', damageDice: '3d6', crit: 15,
              bonuses: [
                { attackMod: 2, damageMod: 2, type: 'enh' },
                { attackMod: 3, damageMod: 3, type: 'training' },
                { attackMod: -1, type: 'buckler' }
              ],
              conditionalBonuses: [
                { condition: 'raging', bonuses: [ { attackMod: 2, damageMod: 2, type: 'enh', stacks: true }] },
                { condition: 'isCritConfirm', bonuses: [ { attackMod: 4 }] }
              ]
            },
            { name: 'Dwarven Thrower', stat: 'str', type: 'melee2h', damageDice: 'd10',
              bonuses: [
                { attackMod: 2, damageMod: 2, type: 'enh' },
                { attackMod: -1, type: 'buckler' }
              ]
            },
            { name: 'Bardiche', stat: 'str', type: 'melee2h', damageDice: 'd10', crit: 19,
              bonuses: [
                { attackMod: -1, type: 'buckler' }
              ]
            },
            { name: 'Kukri', stat: 'str', type: 'melee1h', damageDice: '1d4', crit: 18,
              bonuses: [
                { attackMod: -1, type: 'buckler' }
              ]
             },
            { name: 'Claws', stat: 'str', type: 'melee1h', damageDice: '1d6', attacks: 2,
              bonuses: [
                { attackMod: -1, type: 'buckler' }
              ]
             },
          ] as Array<CharacterAttack>,
          partyBuffs : [
            { name: 'flagbearer',  bonuses: [ { attackMod: 1, damageMod: 1, fearSave: 1, charmSave: 1, type: 'morale' } ] },
            { name: 'inspire courage',  bonuses: [ { attackMod: 4, damageMod: 4, fearSave: 4, type: 'competence' } ] },
            { name: 'good hope',  bonuses: [ { attackMod: 2, damageMod: 2, fearSave: 2, charmSave: 2, type: 'morale' } ] },
            { name: 'haste', bonuses: [ { attackMod: 1, extraAttacks: 1 } ] },
          ] as Array<Buff>,
          selfBuffs : [
            { name: 'enlarge', conditions: ['enlarged'], bonuses: [ { str: 2, type: 'size' }, { attackMod: -1, type: 'size' } ] },
            { name: 'rage', conditions: ['raging'], bonuses: [ { str: 4, type: 'morale' } ] },
            { name: 'power attack', bonuses: [ { meleeAttack: -4, damage1h: +8, damage2h: +12  } ] },
            { name: 'robot slayer', bonuses: [ { attackMod: 1, type: 'trait' }]},
            { name: 'elemental blood', bonuses: [ { damageDice: '1d6', type: 'electricity' } ] },
          ] as Array<Buff>,
          weaponBuffs : [
            { name: 'bane', bonuses: [ 
              { attackMod: 4, damageMod: 4, type: 'enh', stacks: true },
              { damageDice: '2d6', nested: true }]
            },
            { name: '+1 weapon spirit', bonuses: [
              { attackMod: 1, damageMod: 1, type: 'enh', stacks: true }]
            },
            { name: '+2 weapon spirit', bonuses: [
              { attackMod: 2, damageMod: 2, type: 'enh', stacks: true }]
            },
            { name: '+3 weapon spirit', bonuses: [
              { attackMod: 3, damageMod: 2, type: 'enh', stacks: true }]
            },
          ] as Array<Buff>,
          actions: [
            { name: 'charge', bonuses: [ { meleeAttack: 2 } ] },
            { name: 'flanking', bonuses: [ { meleeAttack: 2 }]},
            { name: 'fighting defensively', bonuses: [ { meleeAttack: -4  } ] },
          ] as Array<Buff>,
        },
      ] as Array<Character>;

    return {
      selectedCharacter: characters[0] ?? null,
      selectedAttack: characters[0]?.attacks[0] ?? null,
      combinedBuffs: {} as Record<string, Array<CombinedBuff>>,
      conditions: [] as Array<string>,
      isFullAttack: true,
      isCritConfirmationChecked: false,
      selectedIterativeIndex: 0,
      characters,
      weaponDamageTable: [
        '1d2',
        '1d3',
        '1d4',
        '1d6',
        '1d8',
        '1d10',
        '2d6',
        '2d8',
        '3d6',
        '3d8',
        '4d6',
        '4d8',
        '6d6',
        '6d8',
        '8d6',
        '8d8',
        '12d6',
        '12d8',
        '16d6'
      ],
    };
  },
  computed: {
    isEnlarged() {
      return this.conditions.includes('enlarged');
    },
    critPrefix() {
      return this.isCritConfirmation ? 'crit confirm ' : '';
    },
    dieRoll() {
      return (this.selectedAttack && this.selectedAttack.crit && this.selectedAttack.crit < 20)
        ? `d20cs>${this.selectedAttack.crit}`
        : 'd20';
    },
    sizedDamage() {
      if (!this.isEnlarged) {
        return this.selectedAttack.damageDice;
      }

      let damageDice = this.selectedAttack.damageDice;
      if (damageDice.startsWith('d')) {
        // treat d4 as 1d4 so that we can find it in the table
        damageDice = '1' + damageDice;
      }

      const currentIndex = this.weaponDamageTable.indexOf(damageDice);
      if (currentIndex < 0) {
        // not found, keep current damage
        return this.selectedAttack.damageDice;
      }

      // increase by 2 steps, capped at the largest die in the table
      const enlargedIndex = Math.min(currentIndex + 2, this.weaponDamageTable.length - 1);
      return this.weaponDamageTable[enlargedIndex];
    },
    isCritConfirmation() {
      return this.isCritConfirmationChecked && !this.isFullAttack;
    },
    extraAttacks() {
      return this.combinedBuffs['extraAttacks']
    },
    attackStat() {
      if (!this.selectedAttack || !this.selectedCharacter) {
        return null;
      }
      const stat = this.selectedAttack.stat;
      const statBuffs = this.combinedBuffs?.[stat] ?? [];
      return statBuffs.reduce(
        (total: number, buff: CombinedBuff) => total + (Number(buff.value) || 0),
        this.selectedCharacter[stat]
      );
    },
    attackStatBonus() {
      if (!this.attackStat) {
        return null;
      }
      return Math.floor((this.attackStat - 10) / 2);
    },
    damageStatBonus() {
      return this.selectedAttack.type.includes('2h')
        ? Math.floor(this.attackStatBonus * 1.5)
        : this.attackStatBonus;
    },
    attackBuffs() {
      return this.buffModString('attackMod');
    },
    damageBuffs() {
      return this.buffModString('damageMod');
    },
    nestedDamageDice() {
      return this.damageDiceString(true);
    },
    bonusDamageDice() {
      return this.damageDiceString(false);
    },
    baseAttacks() {
      var attackRange: Array<number> = [];
    
      if (!this.selectedCharacter) {
        return attackRange;
      }
      //first attack
      attackRange.push(this.selectedCharacter.baseAttack);

      // use fixed number for natural attacks
      if (this.selectedAttack && this.selectedAttack.attacks) {
        for (var i = 1; i < this.selectedAttack.attacks; i++) {
          attackRange.push(this.selectedCharacter.baseAttack);
        }
      } else {
        for (var iterativeAttack = (this.selectedCharacter.baseAttack-5); iterativeAttack > 0; iterativeAttack -= 5) {
          attackRange.push(iterativeAttack);
        }
      }

      return attackRange;
    },
    fullAttacks() {
      const attacks: Array<IterativeAttack> = [];
      const prefix = this.critPrefix;
      const first = this.baseAttacks[0];

      // first attack
      attacks.push({
        name: `${prefix}attack ${this.baseAttacks.length > 1 ? ' 1' : ''}`,
        value: first
      });

      // extra attacks (e.g. haste, natural attacks)
      for (const extraAttack of this.extraAttacks || []) {
        if (extraAttack.value == 1) {
          attacks.push({ name: `${prefix}${extraAttack.name}`, value: first });
        } else if (extraAttack.value > 1) {
          for (let i = 0; i < extraAttack.value; i++) {
            attacks.push({ name: `${prefix}${extraAttack.name} ${i + 1}`, value: first });
          }
        }
      }

      // iterative attacks
      for (let i = 1; i < this.baseAttacks.length; i++) {
        attacks.push({ name: `${prefix}attack ${i + 1}`, value: this.baseAttacks[i] });
      }

      return attacks;
    },
    fullDamage() {
      const attack = `${this.sizedDamage}+${this.damageStatBonus}[${this.selectedAttack.stat}]${this.damageBuffs}${this.nestedDamageDice}`
      return `[[ ${attack} ]]${this.bonusDamageDice} dmg`;
    },
    fullAttackMacro() {
      const macro = `&{template:default} {{name=${this.selectedAttack.name}}}`;
      const attacks = this.isFullAttack
        ? this.fullAttacks
        : [this.fullAttacks[this.selectedIterativeIndex]];
      return macro + attacks.map((attack: IterativeAttack) => this.attackMacroLine(attack)).join('');
    },
    simpleDamageRoll() {
      const { bonus, extra } = this.accumulateBuffs(this.getBuffs('damageMod'));
      return `[[${this.sizedDamage}+${this.damageStatBonus + bonus}${extra}${this.nestedDamageDice}]]${this.bonusDamageDice}`;
    },
  },
  setup() {
      const toast = useToast();

      // Make it available inside methods
      return { toast }
  },
  methods: {
    simpleAttack(iterative: IterativeAttack) {
      return `${this.simpleAttackRoll(iterative)} for ${this.simpleDamageRoll}`;
    },
    simpleAttackRoll(iterative: IterativeAttack) {
      const { bonus, extra } = this.accumulateBuffs(this.getBuffs('attackMod'));
      const attackBonus = iterative.value + this.attackStatBonus + bonus;
      return `${iterative.name} [[${this.dieRoll}+${attackBonus}${extra}]]`;
    },
    // Splits a list of buffs into a numeric total (bonus) and a string of
    // non-numeric/dice modifiers (extra), e.g. "+1d6".
    accumulateBuffs(buffs: Array<CombinedBuff>) {
      let bonus = 0;
      let extra = '';
      buffs.forEach((buff: CombinedBuff) => {
        const buffValue = Number(buff.value) || null;
        if (buffValue) {
          bonus += buffValue;
        } else if (String(buff.value).startsWith('+') || String(buff.value).startsWith('-')) {
          extra += `${buff.value}`
        } else {
          extra += `+${buff.value}`
        }
      });
      return { bonus, extra };
    },
    // Renders sorted buffs into a macro string, e.g. " +4[inspire courage competence]".
    buffModString(buffName: string) {
      return this.getBuffs(buffName)
        .sort(this.compareBuffValues)
        .map((buff: CombinedBuff) => ` ${this.parseBuff(buff)}`)
        .join('');
    },
    // Renders damageDice buffs. `nested` selects dice added inside the main damage
    // roll (e.g. bane's +2d6) rather than separate bonus rolls wrapped in [[ ]].
    damageDiceString(nested: boolean) {
      if (this.isCritConfirmation && !this.isFullAttack) {
        return '';
      }
      return this.getBuffs('damageDice')
        .filter((buff: CombinedBuff) => !!buff.nested === nested)
        .map((buff: CombinedBuff) => {
          const damageString = this.parseBuff(buff);
          const negative = damageString.startsWith('-');
          const body = negative ? damageString.substring(1) : damageString;
          const value = nested ? body : `[[${body}]]`;
          return `${negative ? '-' : '+'}${value}`;
        })
        .join('');
    },
    compareBuffValues(a: CombinedBuff, b: CombinedBuff) {
        return Number(b.value) - Number(a.value);
    },
    getBuffs(buffName: string) {
      return this.combinedBuffs?.[buffName]?.flat() ?? [];
    },
    fullAttackString(baseAttack: Number) {
      const attack = `${this.dieRoll}+${baseAttack}[base]+${this.attackStatBonus}[${this.selectedAttack.stat}]${this.attackBuffs}`
      return `[[ ${attack} ]]`;
    },
    attackMacroLine(attack: IterativeAttack) {
      return `{{ ${attack.name}=${this.fullAttackString(attack.value)} for ${this.fullDamage}}}`;
    },
    parseBuff(buff: CombinedBuff) {
      if (!buff) {
        return '';
      }

      let buffValue = Number(buff.value) || null;
      let sign = (buffValue && buffValue > 0)
        ? '+'
        : '';

      // filter with join adds a space only if both are non-empty
      return `${sign}${buff.value}[${[buff.name, buff.type].filter(Boolean).join(" ")}]`;
    },
    selectFirstAttack() {
      this.selectedAttack = (this.selectedCharacter && this.selectedCharacter.attacks)
        ? this.selectedCharacter.attacks[0]
        : null;
    },
    copyToClipboard() {
      const clipboardData =
        event.clipboardData ||
        window.clipboardData ||
        event.originalEvent?.clipboardData ||
        navigator.clipboard;

      clipboardData.writeText(this.fullAttackMacro);

      this.toast.info("Copied to Clipboard", {
        position: "top-right",
        timeout: 1000,
        closeOnClick: true,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        draggable: false,
        showCloseButtonOnHover: false,
        hideProgressBar: true,
        closeButton: "button",
        icon: true,
        rtl: false
      });
    },
  },
});
</script>

<style scoped>
  .macro:hover {
    cursor: pointer;
  }
  input {
    margin-right: 3px;
  }
  label.disabled {
    color: #7676764d;
  }
</style>
