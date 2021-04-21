import { computed } from "../src/computed.js";
import { reactive } from "../src/reactivity.js";
import { watch } from "../src/watch.js";
const obj = reactive({ name: 'zcg' });

const fullName = computed(() => {
    return obj.name;
});

watch(obj, function(newVal) {
    console.log(newVal, 'fullName');
}, { immediate: true, deep: true });

obj.name = 'wlx';