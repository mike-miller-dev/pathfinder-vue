<template>
  <div v-for="bonus in bonuses">
    <input type="checkbox" :value="bonus" :id="bonus.name" v-model="selectedBuffs" v-on:click="clearIfNecessary">
    <label :for="bonus.name">{{bonus.name}}</label>
  </div>

</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type { Buff } from "@/models/Buff";
export default defineComponent({
  name: 'BonusList',
  emits: ["changed"],
  props : {
    bonuses : {
      type: Array<Buff>,
      required: true
    },
    selectOne: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedBuffs: []
    }
  },
  methods: {
    clearIfNecessary(event) {
      if (this.selectOne && event.target.checked) {
        // clear other selections
        this.selectedBuffs = [ event.target._value];
      }
    },
  },
  watch: {
    selectedBuffs: function (newVal: Array<Buff>) {
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