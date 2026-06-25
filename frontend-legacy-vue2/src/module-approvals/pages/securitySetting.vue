<template>
  <div class="securitySetting">
    <!-- <div class="settingList">
      <div class="title">员工审批</div>
      <div class="set">
        <span>转正</span>
        <span>
          <el-switch
            v-model="requestData.regular"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('regular')" class="el-icon-setting"></i>
      </div>
      <div class="set">
        <span>离职</span>
        <span>
          <el-switch
            v-model="requestData.quit"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('quit')" class="el-icon-setting"></i>
      </div>
      <div class="set">
        <span>调岗</span>
        <span>
          <el-switch
            v-model="requestData.adjust"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('adjust')" class="el-icon-setting"></i>
      </div>
    </div>
    <div class="settingList">
      <div class="title">工资审批</div>
      <div class="set">
        <span>工资审批</span>
        <span>
          <el-switch
            v-model="requestData.salarysApproval"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i class="el-icon-setting"></i>
      </div>
    </div>
    <div class="settingList">
      <div class="title">考勤审批</div>
      <div class="set">
        <span>请假</span>
        <span>
          <el-switch
            v-model="requestData.leave"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i class="el-icon-setting"></i>
      </div>
      <div class="set">
        <span>加班</span>
        <span>
          <el-switch
            v-model="requestData.overtime"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i class="el-icon-setting"></i>
      </div>
    </div>
    <div class="settingList">
      <div class="title">招聘审批</div>
      <div class="set">
        <span>录用</span>
        <span>
          <el-switch
            v-model="requestData.employment"
            @change="changeSet"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i class="el-icon-setting"></i>
      </div>
    </div>-->
    <div class="settingList">
      <div class="set">
        <span>请假</span>
        <span>
          <el-switch
            v-model="levelData.enable"
            @change="handleChange(levelData,$event)"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('regular')" class="el-icon-setting"></i>
      </div>
      <div class="set">
        <span>加班</span>
        <span>
          <el-switch
            v-model="overtimeData.enable"
            @change="handleChange(overtimeData,$event)"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('regular')" class="el-icon-setting"></i>
      </div>
      <div class="set">
        <span>离职</span>
        <span>
          <el-switch
            v-model="dimissionData.enable"
            @change="handleChange(dimissionData,$event)"
            active-color="#13ce66"
            :inactive-color="inactiveColor"
          ></el-switch>
        </span>
        <i @click="setFlow('regular')" class="el-icon-setting"></i>
      </div>
    </div>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="30%">
      <span style="text-align:center">
        <el-upload
          class="upload-demo"
          drag
          action="/api/user/process/deploy"
          :headers="myheader"
          :before-upload="beforeUpload"
          :on-error="uploadFail"
          :on-success="handleFileSuccess"
          :show-file-list="false"
          :file-list="fileList"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处</div>
        </el-upload>
      </span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getSetState,
  saveSetState,
  getFlowList,
  suspend
} from "@/api/hrm/approvalsApi";
import { importFilexml } from "@/filters/index";
import { getToken } from "@/utils/auth";
export default {
  name: "users-table-index",
  components: {},
  data() {
    return {
      requestData: {},
      activeColor: "#13ce66",
      inactiveColor: "#ccc",
      dialogVisible: false,
      processing: false,
      uploadTip: "点击上传",
      fileList: [],
      dataBase: [],
      levelData:{
        enable:false
      },
      overtimeData:{
        enable:false
      },
      dimissionData:{
        enable:false
      },
    };
  },
  computed: {
    myheader: function() {
      return {
        Authorization: `Bearer ${getToken()}`
      };
    }
  },
  methods: {
    getData() {
      getFlowList().then(res => {
        let data = res.data.data;
        data.map(item => {
          let items = {
            ...item,
            enable: item.persistentState.suspensionState!=2
          }
           console.log(items)
          if(items.key=="process_leave") {
            this.levelData = items;
          }else if(items.key=="process_dimission") {
            this.dimissionData = items;
          }else{
            this.overtimeData = items;
          }
         
        });  
      });
    },
    handleChange(obj, e) {
      if(!obj.key) {
        this.$message.error("还未上传流程");
        return 
      }
      var parent = {
        processKey: obj.key,
        enable: e
      };
      suspend(parent)
        .then(res => {
          // console.log(res)
        })
        .catch(err => {
          this.$message.error(err);
          this.loading = false;
        });
    },
    changeSet() {
      saveSetState(this.requestData)
        .then(res => {
          this.$message.success("设置保存成功！");
        })
        .catch(err => {
          this.$message.error(err);
          this.loading = false;
        });
    },
    setFlow(obj) {
      this.dialogVisible = true;
      console.log(obj);
    },
    // 文件上传完成
    typeTip(obj) {
      this.$message.error(obj);
    },
    beforeUpload(file, obj) {
      importFilexml(file, obj, this.typeTip);
    },
    // 上传错误
    uploadFail(err, file, fileList) {
      this.uploadTip = "点击上传";
      this.processing = false;
      this.$message.error(err);
    },
    // 上传成功
    handleFileSuccess(obj, file, fileList) {
      console.log(456, file);
      this.uploadTip = "点击上传";
      this.processing = false;
      this.dialogImportVisible = false;
      if (obj.code === 99999) {
        this.$message.error("导入失败" + "!");
      } else {
        this.$message.success("导入成功" + "!");
        this.$router.back(-1);
      }
    }
  },
  mounted() {
    // this.init();
    this.getData();
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables";
$active: #13ce66;
$inactive: #ccc;
.securitySetting {
  padding: 20px;
  background: #fff;
  border-radius: 3px;
  margin: 15px;
  border: 1px solid #ebeef5;
  .settingList {
    margin-bottom: 20px;
    .title {
      font-weight: bold;
      line-height: 40px;
      margin-bottom: 20px;
      border-bottom: solid 1px #ccc;
    }
    .set {
      border: solid 1px #ccc;
      border-radius: 3px;
      padding: 15px 30px 15px 20px;
      position: relative;
      display: inline-block;
      margin-right: 20px;
      span:first-child {
        padding-right: 15px;
        border-right: solid 1px #ccc;
        margin-right: 15px;
      }
      .el-icon-setting {
        position: absolute;
        right: 5px;
        top: 5px;
        color: #999;
      }
    }
  }
}
</style>
