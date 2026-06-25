<template>
  <div class="quitApproval">
    <div class="contLeft">
      <h2>{{information.user_name}}申请请假</h2>
      <div class="topTit">
        <img src="./../../assets/img.jpeg" alt />
        <div class="info">
          <p class="name">
            <strong>{{information.username}}</strong>
          </p>
          <p>
            <span>部门：{{information.departmentName}}</span>
          </p>
          <p>
            <span>入职时间： {{information.timeOfEntry | formatDate}}</span>
          </p>
        </div>
      </div>
      <div class="content">
        <!-- <p v-for="(item, index) in information.body" :key="index"><span>{{item.key}} </span> {{item.val}}</p> -->
        <p>
          <span>申请类型：</span>请假
        </p>
        <p>
          <span>请假类型：</span>
          {{information.data.holidayType ==1 ?'事假' : '调休'}}
        </p>
        <p>
          <span>申请单位：</span>
          天
        </p>
        <p>
          <span>开始时间：</span>
          {{information.data.startTime | formatDate}}
        </p>
        <p>
          <span>结束时间：</span>
          {{information.data.endTime | formatDate}}
        </p>
        <p>
          <span>请假时长：</span>
          {{information.data.duration}}
        </p>
        <p>
          <span>申请事由：</span>
          {{information.data.reason}}
        </p>
      </div>
    </div>
    <div class="contRit">
      <div class="topTit">
        <strong>审批记录</strong>
      </div>
      <div class="Items">
        <li v-for="(item, index) in taskInstanceOutList" :key="index">
          <div class="name" :style="index==taskInstanceOutList.length-1?'border-right:none':''">
            <p>{{item.handleTime | formatDate}}</p>
            <!-- <p>{{item.description}}</p> -->
          </div>
          <div class="act">
            <strong>{{item.handleUserName}}</strong>
            <span v-if="index==0">发起申请</span>
            <span v-else-if="item.handleType == '3'">审批驳回</span>
            <span v-else-if="item.handleType == '4'">已撤销</span>
            <span v-else-if="item.handleType == '1'">未开始</span>
            <span v-else-if="item.handleType == '2'">审批通过</span>
            <span v-else>审批中</span>
          </div>
        </li>
      </div>
    </div>
  </div>
</template>

<script>
import {approvalsDetail, approvalsTaskDetail, processLeave, downImg } from "@/api/hrm/approvalsApi";
import { formatDate } from "@/utils/index.js";
export default {
  name: "users-table-index",
  components: {},
  data() {
    return {
      information: {},
      taskInstanceOutList: [],
      imgs: '',
    };
  },
  filters: {
    formatDate(time) {
      var date = new Date(time);
      return formatDate(date, "yyyy-MM-dd hh:mm");
    }
  },
  methods: {
    init() {
      let id = this.$route.params.id
      approvalsDetail({id }).then(res => {
        this.information = res.data.data;
        this.information.data = JSON.parse(this.information.procData);
      })
      approvalsTaskDetail({id }).then(res => {
        this.taskInstanceOutList = res.data.data;
      })
      // this.taskInstanceOutList =  res.data.data.procInstanceOut.taskInstanceOutList;
    },
    // 图片下载
    // 图片下载
    getReviewHistory(id) {
      downImg({ picture_id: id }).then(response => {
        return 'data:image/png;base64,' + btoa(
          new Uint8Array(response.request.response).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
      })
      .then(data => {
        this.imgs = data
      })
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables";

</style>
