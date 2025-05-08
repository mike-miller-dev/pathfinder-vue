<template>
  <div v-for="bonus in bonuses">
    <input v-if="selectOne" type="radio" :value="bonus" :id="bonus.name" v-model="selectedBuff" v-on:click="clearIfNecessary">
    <input v-else type="checkbox" :value="bonus" :id="bonus.name" v-model="selectedBuffs">
    <label :for="bonus.name">{{bonus.name}}</label>
  </div>

</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'BonusList',
  emits: ["changed"],
  props : {
    bonuses : {
      type: Array,
      required: true
    },
    selectOne: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedBuff: null,
      selectedBuffs: []
    }
  },
  methods: {
    clearIfNecessary(event) {
      if (this.selectOne) {
        var newSelection = event.target._value;
        if (this.selectedBuff && this.selectedBuff.name == newSelection.name) {
          // clear radio button when clicked again
          this.selectedBuffs = [ ];
          this.selectedBuff = null;
        } else {
          this.selectedBuffs = [ newSelection];
        }
      }
    },
  },
  watch: {
    selectedBuffs: function (newVal) {
      this.$emit('changed', newVal);
    }
  },
});

</script>
<style scoped>
  input {
    margin-right: 3px;
  }

  input[type="radio"] {
    -webkit-appearance: checkbox; /* Chrome, Safari, Opera */
    -moz-appearance: checkbox;    /* Firefox */
    -ms-appearance: checkbox;     /* not currently supported */
  }
</style>