import { computed } from "../src/computed.js";
import { reactive } from "../src/reactivity.js";
import { watch } from "../src/watch.js";
const obj = reactive({ name: 'zcg' });

// computed
const fullName = computed(() => {
    return obj.name;
});

// watch
watch(() => fullName.value, function(newVal) {
    console.log(newVal, 'fullName');
}, { immediate: true, flush: 'sync' });

// watch(fullName, function(newVal) {
//     console.log(newVal, 'fullName');
// }, { immediate: true, flush: 'sync' });

// console.log(fullName.value);
obj.name = 'wlx';
// console.log(fullName.value);