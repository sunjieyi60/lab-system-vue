<template>
  <div ref="chart" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] }   // [{name,value}]
})

let chart = ref(null)
let ins = null
let resizeObserver = null

onMounted(() => {
  ins = echarts.init(chart.value)
  render()
  
  // 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    ins && ins.resize()
  })
  resizeObserver.observe(chart.value)
})

onUnmounted(() => {
  resizeObserver && resizeObserver.disconnect()
  ins && ins.dispose()
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
        center: ['45%', '45%'],
        radius: ['35%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { 
          show: true, 
          formatter: '{b}\n{d}%',
          position: 'outside',
          overflow: 'truncate',
          width: 70
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        emphasis: { label: { show: true, fontSize: 14 } },
        data: props.data
      }
    ]
  })
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 240px;
  min-height: 200px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 200px;
  }
}
</style>