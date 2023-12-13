<template>
  <div>

    <select v-model="selectedCharacter" @change="selectFirstAttack">
      <option v-for="character in characters" :value="character">
        {{ character.name }}
      </option>
    </select>

    <div v-if="selectedCharacter">
      <CombinedBuffs :character="selectedCharacter" :selected-attack="selectedAttack" @changed="combinedBuffs = $event" />

      <div>
        <select v-model="selectedAttack">
          <option v-for="attack in selectedCharacter.attacks" :value="attack">
            {{ attack.name }}
          </option>
        </select>
        <br />
        <br />

        <Slider :value="isFullAttack" @changed="isFullAttack = $event" />
        <br />
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
      isFullAttack: true,
      characters : [
        {
          name: 'Deebo',
          baseAttack: 4,
          str: 19,
          attacks: [
            { name: 'MW Nodachi', stat:'str', type: 'melee2h', enhAttack: 1, damageDice: 'd10', crit: 18},
            { name: 'Bardiche', stat:'str', type: 'melee2h', damageDice: 'd10', crit: 19},
            { name: 'Heavy Flail', stat:'str', type: 'melee2h', damageDice: 'd10', crit: 19},
            { name: 'Claws', stat:'str', type: 'melee1h', damageDice: '1d6', attacks: 2 },
          ],
          bigUps: [
            { name: 'none', large: false},
            { name: 'enlarge', large: true}
          ],
          seperateAttacks: [
            { name: 'none', selected: true},
            { name: 'opp attack', type: 'melee', attackMod: 4, selected: false},
          ],
          partyBuffs : [
            {  name: 'flagbearer',  bonuses: [ { attackMod: 1, damageMod: 1, fearSave:1, charmSave: 1, type: 'morale' } ] },
            {  name: 'inspire courage',  bonuses: [ { attackMod: 1, damageMod: 1, type: 'competence' } ] },
            { name: 'haste', bonuses: [ { attackMod: 1, extraAttacks: 1 } ] },
          ],
          selfBuffs : [
            { name: 'rage', bonuses: [ { str: 4, type: 'morale' } ] },
            { name: 'power attack', bonuses: [ { meleeAttack: -2, damage1h: +4, damage2h: +6  } ] },
          ],
          conditionals: [
            { name: 'flanking', bonuses: [ { meleeAttack: 2 }]},
            { name: 'robot slayer', bonuses: [ { attackMod: 1, type: 'trait' }]},
          ]
        },
      ],
    };
  },
  mounted() {
    this.selectedCharacter = this.characters.length > 0 ? this.characters[0] : null;

    this.selectFirstAttack();
  },
  computed: {
    extraAttacks() {
      return this.combinedBuffs['extraAttacks']
    },
    attackStat() {
      if (!this.selectedAttack || !this.selectedCharacter) {
        return null;
      }
      let stat = this.selectedAttack.stat;
      let characterStatValue = this.selectedCharacter[stat];
      if (this.combinedBuffs && this.combinedBuffs.hasOwnProperty(stat)) {
        let statBuffTotal = this.combinedBuffs[stat].reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
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
      if (this.selectedAttack.enhAttack) {
        attackString += `+${this.selectedAttack.enhAttack}[enh]`;
      }

      let buffs = this.getBuffs('attackMod');
      buffs.sort(this.compareBuffValues).forEach((buff) => attackString += this.parseBuff(buff));

      return attackString;
    },
    damageBuffs() {
      let damageString = '';
      if (this.selectedAttack.enhDamage) {
        damageString += `+${this.selectedAttack.enhDamage}[enh]`;
      }

      let buffs = this.getBuffs('damageMod');
      buffs.sort(this.compareBuffValues).forEach((buff) => damageString += this.parseBuff(buff));

      return damageString;
    },
    baseAttacks() {
      var attackRange = [];
    
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
      var fullAttacks = [];

      //first attack
      fullAttacks.push({
        name: 'attack' + (this.baseAttacks.length > 1 ? ' 1' : ''),
        value: this.fullAttack(this.baseAttacks[0])
      });

      if (!this.isFullAttack) {
        return fullAttacks;
      }

      for (var extraAttackIndex in this.extraAttacks) {
        let extraAttack = this.extraAttacks[extraAttackIndex];
        if (extraAttack.value == 1) {
          fullAttacks.push({
            name: extraAttack.name,
            value: this.fullAttack(this.baseAttacks[0])
          });
        } else if (extraAttack.value > 1) {
          for (var i = 0; i < extraAttack.value; i++) {
            fullAttacks.push({
              name: extraAttack.name + ' ' + (i+1),
              value: this.fullAttack(this.baseAttacks[0])
            });
          }
        }
      }

      for (var i = 1; i < this.baseAttacks.length; i++) {
        let iterative = this.baseAttacks[i];
        fullAttacks.push({
          name: 'attack ' + (i+1),
          value: this.fullAttack(iterative)
        });
      }

      return fullAttacks;
    },
    fullDamage() {
      var attack = `${this.selectedAttack.damageDice}+${this.damageStatBonus}[${this.selectedAttack.stat}]${this.damageBuffs}`
      return `[[ ${attack} ]] dmg`;
    },
    fullAttackMacro() {
      let macro = `&{template:default} {{name=${this.selectedAttack.name}}}`;
      for (var i = 0; i < this.fullAttacks.length; i++) {
        let attack = this.fullAttacks[i];
        macro += `{{ ${ attack.name }=${ attack.value } for ${ this.fullDamage }}}`;
      }
      return macro;
    }
  },
  setup() {
      // Get toast interface
      const toast = useToast();
      // These options will override the options defined in the "app.use" plugin registration for this specific toast

      // Make it available inside methods
      return { toast }
    },
  methods: {
      compareBuffValues(a, b) {
          return b.value - a.value;
      },
      getBuffs(buffName) {
        if (!this.combinedBuffs || !this.combinedBuffs[buffName]) {
          return [];
        } else {
          return this.combinedBuffs[buffName].flat();
        }
      },
      fullAttack(baseAttack) {
        var dieRoll = (this.selectedAttack && this.selectedAttack.crit && this.selectedAttack.crit < 20)
          ? `d20cs>${this.selectedAttack.crit}`
          : 'd20';
        var attack = `${dieRoll}+${baseAttack}[base]+${this.attackStatBonus}[${this.selectedAttack.stat}]${this.attackBuffs}`
        return `[[ ${attack} ]]`;
      },
      parseBuff(buff) {
        if (!buff) {
          return '';
        }
        let sign = buff.value >=0 ? '+' : '';
        return ` ${sign}${buff.value}[${buff.name}${buff.type ? (' '+ buff.type) : ''}]`;
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
</style>
