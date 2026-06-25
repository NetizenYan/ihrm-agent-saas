<template>
  <div class="AdjustThePost">
    <div class="infoBox">
      <div class="logo">
        <img src="./../../assets/img.jpeg" alt />
      </div>
      <div class="info">
        <p>
          <span class="name">{{ ruleForm.username }}</span>
        </p>
        <p>
          <span>部门：</span>
          {{ ruleForm.departmentName }}
        </p>
        <p>
          <span>入职时间：</span>
          {{ruleForm.timeOfEntry | formatDate}} 
        </p>
      </div>
    </div>
    <div>
      <el-form :model="ruleForm" ref="ruleForm" label-width="100px" class="demo-ruleForm">
        <!-- <el-form-item label="申请类型：" prop="applicationType">
          <el-input
            v-model="ruleForm.applicationType"
            style="width: 220px;"
            :disabled="true"
          ></el-input>
        </el-form-item> -->
        <el-form-item label="请假类型：" prop="holidayType">
          <el-input  v-model="ruleForm.data.holidayType" style="width: 220px;" :disabled="true"></el-input>
        </el-form-item>
        <!-- <el-form-item label="申请单位：" prop="applicationUnit">
          <el-input v-model="ruleForm.applicationUnit" style="width: 220px;"></el-input>
        </el-form-item>-->
        <el-form-item label="开始时间：" prop="startTime">
          <el-date-picker
            v-model="ruleForm.data.startTime"
            type="datetime"
            placeholder="选择日期"
            :disabled="computeOpType"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间：" prop="endTime">
          <el-date-picker
            v-model="ruleForm.data.endTime"
            type="datetime"
            placeholder="选择日期"
            :disabled="computeOpType"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="请假时长：" prop="duration">
          <el-input v-model="ruleForm.data.duration" style="width: 220px;" :disabled="true"></el-input>
        </el-form-item>
        <!--
        <el-form-item label="请假统计：" prop="leaveStatistics">
          <el-input v-model="ruleForm.leaveStatistics" style="width: 220px;" :disabled="true"></el-input>
        </el-form-item>-->
        <el-form-item label="申请原因：" prop="cause">
          <el-input
            type="textarea"
            style="width: 400px;"
            placeholder="显示请假人填写的请假原因"
            v-model="ruleForm.data.reason"
            :disabled="computeOpType"
          ></el-input>
        </el-form-item>
        <div class="buttones" style="text-align: center;margin-top: 40px">
          <el-form-item>
            <el-button
              type="primary"
              @click="btnClick"
              v-show="(this.ruleForm.state == 0 || this.ruleForm.state == 1) && this.tabLab =='launch'"
            >撤销</el-button>
            <el-button
              type="primary"
              @click="btnPass"
              v-show="(this.ruleForm.state == 0 || this.ruleForm.state == 1) && this.tabLab =='approvals'"
            >通过</el-button>
            <el-button
              type="primary"
              @click="btnReject"
              v-show="(this.ruleForm.state == 0 || this.ruleForm.state == 1) && this.tabLab =='approvals'"
            >驳回</el-button>
          <el-button
              type="primary"
              @click="btnSave"
              v-show="this.ruleForm.state == 4 && this.tabLab =='launch'"
            >提交</el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import {
  approvalsDetail,
  approvalsDel,
  approvalsPass,
  approvalsReject,
  applyeLave
} from "@/api/hrm/approvalsApi";
import { formatDate } from "@/utils/index.js";
export default {
  name: "users-table-index",
  props: ["selectedId", "tabLab"],
  data() {
    return {
      dialogImageUrl: "",
      dialogVisible: false,
      timeValue: "",
      ruleForm: {}
    };
  },
  computed: {
    computeOpType() {
      return this.ruleForm.stateOfApproval == "已撤销" ? false : true;
    }
  },
  methods: {
    async init(id) {
      this.id = id;
      const { data: detailRes } = await approvalsDetail({ id });
      if (detailRes.success) {
        this.ruleForm = detailRes.data;
        this.ruleForm.data = JSON.parse(this.ruleForm.procData);
        let type = this.ruleForm.data.holidayType;
        this.ruleForm.data.holidayType=type==1?"请假":"调休"
      }
    },
    async btnClick() {
      let id = this.id;
      const { data: delRes } = await approvalsDel({ id });
      if (delRes.success) {
        this.$message.success("撤销成功");
        this.$emit("closeDialog");
      }
    },
    async btnPass() {
      let id = this.id;
      const { data: passRes } = await approvalsPass({ id });
      if (passRes.success) {
        this.$message.success("操作成功");
        this.$emit("closeDialog");
      }
    },
    async btnReject() {
      let id = this.id;
      const { data: rejectRes } = await approvalsReject({ id });
      if (rejectRes.success) {
        this.$message.success("操作成功");
        this.$emit("closeDialog");
      }
    },
    async btnSave() {
      let sendForm = {};
      sendForm.processInstanceId = this.id;
      sendForm.holidayType=this.ruleForm.holidayType=='请假'?7:18
      sendForm.startTime = this.ruleForm.startTime;
      sendForm.endTime = this.ruleForm.endTime;
      sendForm.reasonsForApplication = this.ruleForm.cause;
      const { data: saveRes } = await applyeLave(sendForm);
      if (saveRes.success) {
        this.ruleForm = {};
        this.$emit("closeDialog");
      }
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    updateData(id) {
      this.init(id);
    }
  },
  mounted() {
    this.init(this.selectedId);
  },
  filters: {
    formatDate(time) {
      var date = new Date(time);
      return formatDate(date, "yyyy-MM-dd hh:mm");
    }
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables";
.AdjustThePost {
  .infoBox {
    display: flex;
    border-bottom: solid 1px #ccc;
    margin-bottom: 20px;
    padding: 10px 0 20px 0;
    img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
    }
    .logo {
      border: solid 1px #ccc;
      width: 102px;
      height: 102px;
      border-radius: 50%;
      margin-right: 20px;
    }
    .info {
      p {
        line-height: 30px;
        .name {
          font-size: 16px;
        }
        span {
          font-weight: bold;
          display: inline-block;
          margin-right: 0px;
          margin-left: 10px;
        }
      }
    }
    .buttones {
      text-align: center;
    }
  }
}
</style>
