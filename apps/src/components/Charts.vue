<template>
  <div ref="chart" style="width:100%;height:240px"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] }   // [{name,value}]
})

let chart = ref(null)
let ins = null

onMounted(() => {
  ins = echarts.init(chart.value)
  render()
})
watch(() => props.data, render)

function render() {
  if (!ins) return
  ins.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { label: { show: true, fontSize: 14 } },
        data: props.data
      }
    ]
  })
}
</script>