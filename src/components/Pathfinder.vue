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
          <input type="checkbox" :id="crit-confirmation" :value="isCritConfirmationChecked" v-model="isCritConfirmationChecked" :disabled="isFullAttack">
          <label :for="crit-confirmation" :class="isFullAttack ? 'disabled': ''">crit confirmation</label>
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
    return {
      selectedCharacter: null,
      selectedAttack: null,
      combinedBuffs: [],
      conditions: [],
      isFullAttack: true,
      isCritConfirmationChecked: false,
      selectedIterativeIndex: 0,
      characters : [
        {
          name: 'Deebo',
          baseAttack: 10,
          str: 24,
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
          buffs: [
            [ // party buffs
              { name: 'flagbearer',  bonuses: [ { attackMod: 1, damageMod: 1, fearSave: 1, charmSave: 1, type: 'morale' } ] },
              { name: 'inspire courage',  bonuses: [ { attackMod: 3, damageMod: 3, fearSave: 3, type: 'competence' } ] },
              { name: 'good hope',  bonuses: [ { attackMod: 2, damageMod: 2, fearSave: 2, charmSave: 2, type: 'morale' } ] },
              { name: 'haste', bonuses: [ { attackMod: 1, extraAttacks: 1 } ] },
            ] as Array<Buff>,

            [ //self buffs
              { name: 'enlarge', conditions: ['enlarged'], bonuses: [ { str: 2, type: 'size' }, { attackMod: -1, type: 'size' } ] },
              { name: 'rage', conditions: ['raging'], bonuses: [ { str: 4, type: 'morale' } ] },
              { name: 'power attack', bonuses: [ { meleeAttack: -3, damage1h: +6, damage2h: +9  } ] },
              { name: 'elemental blood', bonuses: [ { damageDice: '1d6', type: 'electricity' } ] },
            ] as Array<Buff>,

            [ // vs enemies
              { name: 'robot slayer', bonuses: [ { attackMod: 1, type: 'trait' }]},
            ] as Array<Buff>,


            [ //weapon buffs
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

            [ // actions
              { name: 'charge', bonuses: [ { meleeAttack: 2 } ] },
              { name: 'flanking', bonuses: [ { meleeAttack: 2 }]},
              { name: 'fighting defensively', bonuses: [ { meleeAttack: -4  } ] },
            ] as Array<Buff>
          ],
        },
      ] as Array<Character>,
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
  mounted() {
    this.selectedCharacter = this.characters.length > 0 ? this.characters[0] : null;

    this.selectFirstAttack();
  },
  computed: {
    isEnlarged() {
        return this.conditions.indexOf('enlarged') >= 0;
    },
    sizedDamage() {
      if (!this.isEnlarged) {
        return this.selectedAttack.damageDice;
      }

      let damageDice = this.selectedAttack.damageDice;
      if (damageDice.startsWith('d')) {
        // treat d4 as 1d4 so that we can find it in the table
        damageDice = '1'+damageDice;
      }

      let currentIndex = this.weaponDamageTable.indexOf(damageDice);
      if (currentIndex < 0) {
        // not found, keep current damage
        return this.selectedAttack.damageDice;
      } else if ((currentIndex +2) <= this.weaponDamageTable.length) {
        // can increase by 2 steps
        return this.weaponDamageTable[currentIndex+2];
      } else {
        // cannot increase by 2 steps, return max instead
        return this.weaponDamageTable[this.weaponDamageTable.length-1];
      }
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
      let stat = this.selectedAttack.stat;
      let characterStatValue = this.selectedCharacter[stat];

      let statBuffTotal = 0;
      if (this.combinedBuffs && this.combinedBuffs.hasOwnProperty(stat)) {
        this.combinedBuffs[stat].forEach((buff: Buff) => {
          let buffValue = Number(buff.value) || null;
          if (buffValue) {
            statBuffTotal += buffValue;
          }
        });

        return characterStatValue + statBuffTotal
      } else {
        return characterStatValue;
      }
    },
    attackStatBonus() {
      if (!this.attackStat) {
        return null;
      }
      return Math.floor((this.attackStat - 10) / 2);
    },
    damageStatBonus() {
      if (this.selectedAttack.type.indexOf('2h') > -1) {
        return Math.floor(this.attackStatBonus * 1.5);
      } else {
        return this.attackStatBonus;
      }
    },
    attackBuffs() {
      let attackString = '';

      let buffs = this.getBuffs('attackMod');
      buffs.sort(this.compareBuffValues).forEach((buff: Buff) => attackString += ' ' + this.parseBuff(buff));

      return attackString;
    },
    damageBuffs() {
      let damageString = '';

      let buffs = this.getBuffs('damageMod');
      buffs.sort(this.compareBuffValues).forEach((buff: Buff) => damageString += ' ' + this.parseBuff(buff));

      return damageString;
    },
    nestedDamageDice() {
      let extraDamageString = '';

      if (this.isCritConfirmation && !this.isFullAttack) {
        return extraDamageString;
      }

      let damageDice = this.getBuffs('damageDice');
      damageDice.forEach((buff: Buff) => {
        if (buff.nested) {
          let damageString = this.parseBuff(buff);

          if (damageString.startsWith('-')) {
            extraDamageString += `-${damageString.substring(1)}`
          } else {
            extraDamageString += `+${damageString}`
          }
        }
      });

      return extraDamageString;
    },
    bonusDamageDice() {
      let extraDamageString = '';

      if (this.isCritConfirmation && !this.isFullAttack) {
        return extraDamageString;
      }

      let damageDice = this.getBuffs('damageDice');
      damageDice.forEach((buff: Buff) => {
        if (!buff.nested) {
          let damageString = this.parseBuff(buff);

          if (damageString.startsWith('-')) {
            extraDamageString += `-[[${damageString.substring(1)}]]`
          } else {
            extraDamageString += `+[[${damageString}]]`
          }
        }
      });

      return extraDamageString;
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
      var fullAttacks: Array<IterativeAttack> = [];

      //first attack
      fullAttacks.push({
        name: `${this.isCritConfirmation ? 'crit confirm ' : ''}attack ${this.baseAttacks.length > 1 ? ' 1' : ''}`,
        value: this.baseAttacks[0]
      });

      for (var extraAttackIndex in this.extraAttacks) {
        let extraAttack = this.extraAttacks[extraAttackIndex];
        if (extraAttack.value == 1) {
          fullAttacks.push({
            name: `${this.isCritConfirmation ? 'crit confirm ' : ''}${extraAttack.name}`,
            value: this.baseAttacks[0]
          });
        } else if (extraAttack.value > 1) {
          for (var i = 0; i < extraAttack.value; i++) {
            fullAttacks.push({
              name: `${this.isCritConfirmation ? 'crit confirm ' : ''}${extraAttack.name} ${i+1}`,
              value: this.baseAttacks[0]
            });
          }
        }
      }

      for (var i = 1; i < this.baseAttacks.length; i++) {
        let iterative = this.baseAttacks[i];
        fullAttacks.push({
          name: `${this.isCritConfirmation ? 'crit confirm ' : ''}attack ${i+1}`,
          value: iterative
        });
      }

      return fullAttacks;
    },
    fullDamage() {
      var attack = `${this.sizedDamage}+${this.damageStatBonus}[${this.selectedAttack.stat}]${this.damageBuffs}${this.nestedDamageDice}`
      return `[[ ${attack} ]]${this.bonusDamageDice} dmg`;
    },
    fullAttackMacro() {
      let macro = `&{template:default} {{name=${this.selectedAttack.name}}}`;
      if (this.isFullAttack) {
        for (var i = 0; i < this.fullAttacks.length; i++) {
          let attack = this.fullAttacks[i];
          macro += `{{ ${ attack.name }=${ this.fullAttackString(attack.value) } for ${ this.fullDamage }}}`;
        }
      } else {
        let attack = this.fullAttacks[this.selectedIterativeIndex];
        macro += `{{ ${ attack.name }=${ this.fullAttackString(attack.value) } for ${ this.fullDamage }}}`;
      }
      return macro;
    },
    simpleDamageRoll() {
      var damageRoll = this.sizedDamage;
      var damageBonus = this.damageStatBonus;

      let extraDamageString = '';
      let damageBuffs = this.getBuffs('damageMod');

      damageBuffs.forEach((buff: Buff) => {
        let buffValue = Number(buff.value) || null;
        if (buffValue) {
          damageBonus += buffValue;
        } else if (buff.value.startsWith('+') || buff.value.startsWith('-')) {
          extraDamageString += `${buff.value}`
        } else {
          extraDamageString += `+${buff.value}`
        }
      });

      return `[[${damageRoll}+${damageBonus}${extraDamageString}${this.nestedDamageDice}]]${this.bonusDamageDice}`;
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
      var attackRoll = (this.selectedAttack && this.selectedAttack.crit && this.selectedAttack.crit < 20)
        ? `d20cs>${this.selectedAttack.crit}`
        : 'd20';
      var attackBonus = iterative.value + this.attackStatBonus;

      let attackBuffs = this.getBuffs('attackMod');
      let attackBuffNonNumeric = '';

      attackBuffs.forEach((buff: Buff) => {
        let buffValue = Number(buff.value) || null;
        if (buffValue) {
          attackBonus += buffValue;
        } else if (buff.value.startsWith('+') || buff.value.startsWith('-')) {
          attackBuffNonNumeric += `${buff.value}`
        } else {
          attackBuffNonNumeric += `+${buff.value}`
        }
      });
      return `${iterative.name} [[${attackRoll}+${attackBonus}${attackBuffNonNumeric}]]`;
    },
    compareBuffValues(a: Buff, b: Buff) {
        return b.value - a.value;
    },
    getBuffs(buffName: string) {
      if (!this.combinedBuffs || !this.combinedBuffs[buffName]) {
        return [];
      } else {
        return this.combinedBuffs[buffName].flat();
      }
    },
    fullAttackString(baseAttack: Number) {
      var dieRoll = (this.selectedAttack && this.selectedAttack.crit && this.selectedAttack.crit < 20)
        ? `d20cs>${this.selectedAttack.crit}`
        : 'd20';
      var attack = `${dieRoll}+${baseAttack}[base]+${this.attackStatBonus}[${this.selectedAttack.stat}]${this.attackBuffs}`
      return `[[ ${attack} ]]`;
    },
    parseBuff(buff: Buff) {
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
