<template>
  <el-row :gutter="16">
    <!-- 基础管理 -->
    <el-col :span="8">
      <el-card title="基础管理">
        <div class="num">{{ base.total }}</div>
        <div class="txt">实验室总数</div>
        <Charts :data="base.units" />
      </el-card>
    </el-col>

    <!-- 教务管理 -->
    <el-col :span="8">
      <el-card title="教务管理">
        <el-tabs>
          <el-tab-pane label="正在上课">
            <div class="num">{{ edu.running }}</div>
            <el-table :data="edu.runningList" size="small" max-height="200">
              <el-table-column prop="lab" label="实验室" />
              <el-table-column prop="course" label="课程" />
              <el-table-column prop="people" label="人数" width="60" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="即将上课">
            <div class="num">{{ edu.will }}</div>
            <el-table :data="edu.willList" size="small" max-height="200">
              <el-table-column prop="lab" label="实验室" />
              <el-table-column prop="course" label="课程" />
              <el-table-column prop="people" label="人数" width="60" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>

    <!-- 控制中心 -->
    <el-col :span="8">
      <el-card title="控制中心">
        <el-row :gutter="12">
          <el-col :span="12" v-for="i in control" :key="i.label">
            <div class="num">{{ i.online }}/{{ i.total }}</div>
            <div class="txt">{{ i.label }}</div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>

    <!-- 预约管理 -->
    <el-col :span="12">
      <el-card title="预约管理">
        <el-row :gutter="12">
          <el-col :span="8"
            ><div class="num">{{ book.total }}</div>
            <div class="txt">预约总数</div></el-col
          >
          <el-col :span="8"
            ><div class="num">{{ book.people }}</div>
            <div class="txt">总人数</div></el-col
          >
          <el-col :span="8"
            ><div class="num">{{ book.pending }}</div>
            <div class="txt">待审批</div></el-col
          >
        </el-row>
      </el-card>
    </el-col>

    <!-- 资产管理 -->
    <el-col :span="12">
      <el-card title="资产管理">
        <el-row :gutter="12">
          <el-col :span="8"
            ><div class="num">¥{{ asset.totalVal }}</div>
            <div class="txt">资产总值</div></el-col
          >
          <el-col :span="8"
            ><div class="num">{{ asset.categoryCnt }}</div>
            <div class="txt">类别总数</div></el-col
          >
          <el-col :span="8"
            ><div class="num">{{ asset.unitCnt }}</div>
            <div class="txt">台套总数</div></el-col
          >
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import Charts from "@/components/Charts.vue";
import request from "@/api/request";

// ① 先全部 mock，后续改成 await request.get(...)
const base = reactive({
  total: 86,
  units: [
    { name: "计算机中心", value: 42 },
    { name: "电子中心", value: 24 },
    { name: "物理中心", value: 20 },
  ],
});
const edu = reactive({
  running: 12,
  will: 8,
  runningList: [{ lab: "16-202", course: "电路实验", people: 60 }],
  willList: [{ lab: "16-203", course: "数电实验", people: 80 }],
});
const control = reactive([
  { label: "智能门锁", online: 43, total: 50 },
  { label: "智能空开", online: 48, total: 50 },
  { label: "智能开关", online: 46, total: 50 },
  { label: "空调内机", online: 36, total: 43 },
]);
const book = reactive({ total: 120, people: 860, pending: 15 });
const asset = reactive({ totalVal: "2.3亿", categoryCnt: 128, unitCnt: 6854 });

// ② 后续打开这段即可
// onMounted(async () => {
//   const { data } = await request.get('/api/dashboard')
//   Object.assign(base, data.base)
//   Object.assign(edu, data.edu)
//   ...
// })
</script>

<style scoped>
.num {
  font-size: 28px;
  font-weight: bold;
  color: #0960bd;
  text-align: center;
}
.txt {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
}
</style>
