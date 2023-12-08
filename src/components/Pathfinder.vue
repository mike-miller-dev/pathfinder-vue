<template>
  <div>

    <select v-model="selectedCharacter" @change="selectFirstAttack">
      <option v-for="character in characters" :value="character">
        {{ character.name }}
      </option>
    </select>

    <div v-if="selectedCharacter">
      <CombinedBuffs :character="selectedCharacter" @changed="combinedBuffs = $event"/>

      <div>
        <select v-model="selectedAttack">
          <option v-for="attack in selectedCharacter.attacks" :value="attack">
            {{ attack.name }}
          </option>
        </select>

        <div v-if="selectedAttack">
          <div v-for="(attack, index) in fullAttacks">
            <p>{{ attack.value }} {{ attack.name }}</p>
            <p>{{ fullDamage }}</p>
            <br />
          </div>
          
        </div>

        
      </div>
    </div>
    
    
  </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CombinedBuffs from './CombinedBuffs.vue';
export default defineComponent({
  name: 'Pathfinder',
  components: {
    CombinedBuffs
  },
  data() {
    return {
      selectedCharacter: null,
      selectedAttack: null,
      combinedBuffs: [],
      characters : [
        {
          name: 'Deebo',
          baseAttack: 4,
          str: 19,
          attacks: [
            { name: 'mw nodachi', stat:'str', type: 'melee2h', attackMod: 8, damageDice: '3d6', damageMod: 12, damageRoll: 10.5, largeDamageDice: '4d6', largeDamageRoll: 14, largeDamageMod: 14, crit: 17},
            { name: 'unarmed', stat:'str', type: 'melee1h', attackMod: 7, damageDice: '2d6', damageMod: 11, damageRoll: 7, largeDamageDice: '3d6', largeDamageRoll: 10.5, largeDamageMod: 13},
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
            { 
              name: 'flagbearer', 
              bonuses: [
                {
                  attackMod: 1, damageMod: 1, fearSave:1, charmSave: 1, type: 'morale'
                }
              ]
            },
            { 
              name: 'haste', 
              bonuses: [
                {
                  attackMod: 1, extraAttacks: 1
                }
              ]
            },
          ],
          selfBuffs : [
            { 
              name: 'rage', 
              bonuses: [
                {
                  str: 4, type: 'morale'
                }
              ]
            }
          ],
          conditionals: [
            { name: 'power attack', bonuses: [ { meleeAttack: -2, damage1h: +4, damage2h: +6  } ] },
            { name: 'flanking', bonuses: [ { meleeAttack: 2 }]},
            { name: 'vs robot', bonuses: [ { attackMod: 1 }]},
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
      let attackString = this.parseBuff('attackMod');
      if (this.selectedAttack.type == 'melee1h' || this.selectedAttack.type == 'melee2h') {
        attackString += this.parseBuff('meleeAttack');
      }
      return attackString;
    },
    damageBuffs() {
      let attackString = this.parseBuff('damage');
      if (this.selectedAttack.type == 'melee1h') {
        attackString += this.parseBuff('damageMelee');
        attackString += this.parseBuff('damage1h');
      } else if (this.selectedAttack.type == 'melee2h') {
        attackString += this.parseBuff('damageMelee');
        attackString += this.parseBuff('damage2h');
      }
      return attackString;
    },
    baseAttacks() {
      var attackRange = [];
    
      if (!this.selectedCharacter) {
        return attackRange;
      }
      //first attack
      attackRange.push(this.selectedCharacter.baseAttack);

      for (var iterativeAttack = (this.selectedCharacter.baseAttack-5); iterativeAttack > 0; iterativeAttack -= 5) {
        attackRange.push(iterativeAttack);
      }
      return attackRange;
    },
    fullAttacks() {
      var fullAttacks = [];

      //first attack
      fullAttacks.push({
        name: '1',
        value: this.fullAttack(this.baseAttacks[0])
      });

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
          name: i+1,
          value: this.fullAttack(iterative)
        });
      }

      return fullAttacks;
    },
    fullDamage() {
      var attack = `${this.selectedAttack.damageDice}+${this.damageStatBonus}[${this.selectedAttack.stat}]${this.damageBuffs}`
      return `[[ ${attack} ]] dmg`;
    },
  },
  methods: {
      fullAttack(baseAttack) {
        var attack = `d20+${baseAttack}[base]+${this.attackStatBonus}[${this.selectedAttack.stat}]${this.attackBuffs}`
        return `[[ ${attack} ]] ${this.selectedAttack.name}`;
      },
      parseBuff(buffName) {
        let attackString = '';
        if (this.combinedBuffs.hasOwnProperty(buffName)) {
          for (var buffIndex in this.combinedBuffs[buffName]) {
            let buff = this.combinedBuffs[buffName][buffIndex];
            let sign = buff.value >=0 ? '+' : '';
            attackString += `${sign}${buff.value}[${buff.name}${buff.type ? (' '+ buff.type) : ''}]`;
          }
        }
        return attackString;
      },
      selectFirstAttack() {
        this.selectedAttack = (this.selectedCharacter && this.selectedCharacter.attacks)
          ? this.selectedCharacter.attacks[0]
          : null;
      }
    },
});
</script>

<style scoped>

</style>
