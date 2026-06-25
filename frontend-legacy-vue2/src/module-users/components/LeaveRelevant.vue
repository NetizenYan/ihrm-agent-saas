<template>
  <div class="usersContainer">
    <el-form
      :model="ruleForm"
      ref="ruleForm"
      status-icon
      label-width="110px"
      class="demo-ruleForm"
      enctype="multipart/form-data"
    >
      <el-form-item label="假期类型">
        <el-select v-model="ruleForm.holidayType" placeholder="请选择" style="width: 220px;" @change="handleChange">
          <el-option
            v-for="item in baseData.leaveType"
            :key="item.id"
            :label="item.value"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="申请单位">
        <span>按天</span>
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-col :span="8">
          <el-date-picker
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="选择日期"
            v-model="ruleForm.startTime"
            style="width: 340px;"
          ></el-date-picker>
        </el-col>
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-col :span="8">
          <el-date-picker
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="选择日期"
            v-model="ruleForm.endTime"
            style="width: 340px;"
          ></el-date-picker>
        </el-col>
      </el-form-item>
      <el-form-item label="请假时长" v-if='state==="1"'>
          <el-input style="width: 340px;" v-model="ruleForm.duration"></el-input>
      </el-form-item>
      <el-form-item label="申请天数" v-if='state==="0"'>
          <el-input style="width: 340px;" v-model="ruleForm.duration"></el-input>
      </el-form-item>
      <el-form-item label="申请理由" prop="reason">
        <el-input
          type="textarea"
          style="width: 340px;"
          :autosize="{ minRows: 3, maxRows: 8}"
          placeholder="请输入内容"
          v-model="ruleForm.reason"
        ></el-input>
      </el-form-item>

      <!--
      <el-form-item label="图片">
        <el-upload
          action
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :on-remove="handleRemove"
          ref="upload"
          :http-request="submitUpload"
          
        >
          <i class="el-icon-plus"></i>
          <div slot="tip" class="el-upload__tip" style="color:#f00;">注： 只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
        <el-dialog :visible.sync="dialogVisible">
          <img width="100%" :src="dialogImageUrl" alt />
        </el-dialog>
      </el-form-item>
      -->
      <el-form-item>
        <el-button type="primary" @click="submitForm('ruleForm')">提交</el-button>
        <el-button @click="resetForm()">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { applyeLave,startProcess } from "@/api/hrm/approvalsApi";
import commonApi from '@/api/constant/users'
export default {
  name: "users-table-index",
  data() {
    return {
      dialogImageUrl: "",
      dialogVisible: false,
      state:'1',
      ruleForm: {
        startTime: "",
        endTime: "",
        reason: "",
        holidayType: "",
        duration:0,
        applyUnit:'按天',
        processKey:"process_leave",
        processName:"请假",
        userId:this.$store.getters.userId
      },
      baseData:{},
      opType: 7,
      options: [
        {
          value: 7,
          label: "请假"
        },
        {
          value: 18,
          label: "调休"
        }
      ],
      duration: 0,
      rules: {
        start_time: [
          { required: true, message: "开始时间", trigger: "change" }
        ],
        end_time: [{ required: true, message: "结束时间", trigger: "change" }],
        reason: [{ required: true, message: "加班原因", trigger: "blur" }]
      }
    };
  },
  created(){
    this.baseData = commonApi
  },
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    submitForm(name) {
      console.log(this.ruleForm)
      startProcess(this.ruleForm).then(res => {
        if(res.data.success) {
          this.$message.success(res.data.message)
          this.$emit('handleShow')
        }
      })
    },
    resetForm() {
      this.ruleForm = {};
    },
    handleChange(obj){
      this.state=obj
    },
    submitUpload(content) {
      var _this = this;
      let formData = new FormData();
      formData.append("file", content.file);
      formData.append("start_time", _this.ruleForm.start_time);
      formData.append("end_time", _this.ruleForm.end_time);
      formData.append("reason", _this.ruleForm.reason);
      formData.append("holiday_type", _this.ruleForm.holiday_type);
      formData.append("apply_unit", _this.ruleForm.apply_unit);
      applyeLave(formData)
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  computed: {
    computeDuration() {
      let duration = 0;
      if (this.ruleForm.start_time && this.ruleForm.end_time) {
        
        let durationStamp = (new Date(this.ruleForm.end_time)).valueOf() - (new Date(this.ruleForm.start_time)).valueOf();
        let fourHours = 1000 * 60 * 60 * 4;
        let total = Math.floor(durationStamp / fourHours);
        duration = Math.floor(total / 2) + (total % 2) * 0.5;
      }
      return duration;
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables";
// .usersContainer {
// }
</style>
