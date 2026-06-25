<template>
  <div class="usersApprovalsContainer">
    <div class="approvalsTop">
      <div class="topLab">
        <span @click="tabSwitch('copy')" :class="[tabLab == 'copy' ? 'act' : '']">全部</span>
        <span @click="tabSwitch('launch')" :class="[tabLab == 'launch' ? 'act' : '']">我发起的</span>
        <span @click="tabSwitch('approvals')" :class="[tabLab == 'approvals' ? 'act' : '']">待审批</span>
      </div>
    </div>
    <div class="approvalsContent">
      <div class="topTitle">
        <div>
          <span>审批类型：</span>
          <el-radio-group v-model="approvalsTypes" style="margin:5px 0">
            <el-radio
              v-for="item in approvalsType"
              :label="item.key"
              :value="item.key"
              :key="item.deploymentId"
              @change="changeSelectParams"
            >{{item.name}}</el-radio>
          </el-radio-group>
        </div>
        <div v-if="tabLab != 'approvals'">
          <span>审批状态：</span>
          <el-checkbox-group v-model="approvalsStates">
            <el-checkbox
              v-for="item in approvalsState"
              :label="item.id"
              :value="item.id"
              :key="item.id"
              @change="changeSelectParams"
            >{{item.value}}</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <div>
        <el-table :data="tableData" style="width: 100%">
          <el-table-column type="selection" width="28"></el-table-column>
          <el-table-column type="index" label="序号" width="60"></el-table-column>
          <el-table-column prop="processName" label="审批类型"></el-table-column>
          <el-table-column prop="username" label="申请人" v-if="tabLab!=='launch'"></el-table-column>
          <el-table-column
            prop="procCurrNodeUserName"
            label="当前审批人"
            v-if="tabLab!=='approvals'"
          ></el-table-column>
          <el-table-column label="申请时间">
            <template slot-scope="scope">
              <span>{{scope.row.procApplyTime | formatDate}}</span>
            </template>
          </el-table-column>
          <!-- <el-table-column label="最后操作时间" v-if='tabLab!=="launch"'>
            <template slot-scope="scope">
              <span>{{scope.row.proc_last_node_time | formatDate}}</span>
            </template>
          </el-table-column>-->
          <el-table-column label="审批状态">
            <template slot-scope="scope">
              <span class="rovalsState" v-if="scope.row.processState==='0'">
                <em class="sub"></em>已提交
              </span>
              <span class="rovalsState" v-if="scope.row.processState==='1'">
                <em class="stay"></em>审批中
              </span>
              <span class="rovalsState" v-if="scope.row.processState==='2'">
                <em class="adopt"></em>审批通过
              </span>
              <span class="rovalsState" v-if="scope.row.processState==='3'">
                <em class="reject"></em>审批不通过
              </span>
              <span class="rovalsState" v-if="scope.row.processState==='4'">
                <em class="revoke"></em>撤销
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <!--  && (item.row.stateOfApproval == '待审批' || item.row.stateOfApproval == '已驳回') -->
              <el-button
                v-show="(tabLab == 'launch')&&(scope.row.processState==='1')"
                size="mini"
                type="primary"
                @click="clickPass('4',scope.row.processId)"
              >撤销</el-button>
              <!--  && item.row.currentApproverId == userId -->
              <el-button
                v-show="(tabLab == 'copy' || tabLab == 'approvals')&&(scope.row.processState==='1')"
                size="mini"
                type="primary"
                @click="clickPass('2',scope.row.processId)"
              >通过</el-button>
              <!--  && item.row.currentApproverId == userId -->
              <el-button
                v-show="(tabLab == 'copy' || tabLab == 'approvals')&&(scope.row.processState==='1')"
                size="mini"
                type="primary"
                @click="clickPass('3',scope.row.processId)"
              >驳回</el-button>
              <el-button
                size="mini"
                type="primary"
                @click="clickDetail(scope.row.processId,scope.row.processName)"
              >查看</el-button>
              <!-- <el-button size="mini" type="danger">打印</el-button> -->
            </template>
          </el-table-column>
        </el-table>
        <div class="page-list">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
            :total="Number(total)"
            :page-sizes="[10,20,30, 50]"
            layout="sizes, prev, pager, next, jumper"
          ></el-pagination>
        </div>
      </div>
    </div>
    <!--查看弹框-->
    <el-dialog :title="topLabel" :visible.sync="centerDialogVisible" width="50%" left>
      <!-- <BecomeARegularWorker v-show="seeState == 'becomeARegularWorker'" /> -->
      <!-- <AdjustThePost v-show="seeState == 'adjustThePost'" /> -->
      <Quit
        v-on:closeDialog="closeDialog"
        v-show="seeState == 'quit'"
        :selectedId="selectedId"
        :tabLab="tabLab"
        ref="quit"
      />
      <!-- <Examine v-show="seeState == 'examine'" /> -->
      <Leave
        v-show="seeState == 'leave'"
        :selectedId="selectedId"
        :tabLab="tabLab"
        ref="leave"
        v-on:closeDialog="closeDialog"
      />
      <Overtime
        v-show="seeState == 'overtime'"
        :selectedId="selectedId"
        :tabLab="tabLab"
        ref="overtime"
        v-on:closeDialog="closeDialog"
      />
      <!-- <Employment v-show="seeState == 'employment'" /> -->
    </el-dialog>
    <!--查看弹框-->
    <!-- 通过审核 -->
    <el-dialog
    title="通过审核"
    :visible.sync="adoptVisible"
    width="30%"
    :before-close="handleClose">
    <span><el-input type="textarea" v-model="formData.handleOpinion"></el-input></span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="adoptVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleProcess">确 定</el-button>
    </span>
  </el-dialog>
    <!-- end -->
  </div>
</template>

<script>
import {
  list,
  approvalsList,
  approvalsDel,
  approvalsPass,
  approvalsReject,
  getFlowList
} from "@/api/hrm/approvalsApi";
import baseApi from "@/api/constant/approvals";
import BecomeARegularWorker from "./../components/BecomeARegularWorker";
import AdjustThePost from "./../components/AdjustThePost";
import Quit from "../components/Quit";
import Examine from "../components/Examine";
import Leave from "../components/LeaveJob";
import Overtime from "../components/Overtime";
import Employment from "../components/Employment";
import { formatDate } from "@/utils/index.js";
export default {
  name: "users-table-index",
  components: {
    BecomeARegularWorker,
    AdjustThePost,
    Quit,
    Examine,
    Leave,
    Overtime,
    Employment
  },
  data() {
    return {
      seeState: "becomeARegularWorker",
      centerDialogVisible: false,
      topLabel: "转正",
      tabLab: "copy",
      approvalsType: [],
      approvalsTypes: "",
      approvalsState: baseApi.approvalState,
      approvalsStates: [],
      tableData: [],
      page: null,
      pageSize: null,
      total: '',
      selectedId: "",
      userId: "",
      pagination: {
        page: 1,
        pageSize: 10,
        process_key$equal: this.process_key$equal,
        process_state$in: this.process_state$in
        // proc_apply_user_id$equal:''
      },
      adoptVisible:false,
      formData:{
        handleOpinion:'',
        processId:'',
        handleType:''
      }
    };
  },
  filters: {
    formatDate(time) {
      var date = new Date(time);
      return formatDate(date, "yyyy-MM-dd hh:mm");
    }
  },
  created() {},
  methods: {
    async init(parent) {
      var parent = this.pagination;
      const { data: listRes } = await list(parent);
      if (listRes.success) {
        this.total=listRes.data.total
        this.tableData = listRes.data.rows;
      }
    },
    async getFlowData() {
      const { data: res } = await getFlowList();
      if (res.success) {
        this.approvalsType = res.data;
      }
    },
    async delProcess(id) {
      const { data: delRes } = await approvalsDel({ id });
      if (delRes.success) {
        this.$message.success("撤销成功");
        this.init();
      }
    },
    async handleProcess() {
      const { data: passRes } = await approvalsPass(this.formData);
      if (passRes.success) {
        this.$message.success("操作成功");
        this.adoptVisible=false
        this.init();
      }
      
    },
    async rejectProcess(id) {
      const { data: rejectRes } = await approvalsReject({ id });
      if (rejectRes.success) {
        this.$message.success("操作成功");
        this.init();
      }
    },
    changeSelectParams() {
      this.pagination.processKey = this.approvalsTypes;
      this.pagination.processState = this.approvalsStates.join(",");
      this.init();
    },
    // 每页显示信息条数
    handleSizeChange(pageSize) {
      this.pagination.pagesize = pageSize
      if (this.pagination.page === 1) {
        this.init(this.pagination)
      }
    },
    // 进入某一页
    handleCurrentChange(val) {
      this.pagination.page = val
      this.init()
    },
    tabSwitch(obj) {
      this.tabLab = obj;
      this.userId = this.$store.getters.userId;
      this.approvalsStates=[]
      this.pagination.processState=""
      // let sendData = {};
      if (this.tabLab === "launch") {
        delete this.pagination.userId;
        delete this.pagination.procCurrNodeUserId;
        this.pagination.userId = this.userId;
      } else if (this.tabLab === "approvals") {
        delete this.pagination.userId;
        delete this.pagination.procCurrNodeUserId;
        this.pagination.procCurrNodeUserId = this.userId;
        this.pagination.processState="1";
      } else if (this.tabLab === "copy") {
        delete this.pagination.userId;
        delete this.pagination.procCurrNodeUserId;
      }

      this.init(this.pagination);
    },
    clickCancel(id) {
      this.$confirm("", "是否撤销该流程", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      })
        .then(() => {
          this.delProcess(id);
        })
        .catch(() => {});
    },
    clickPass(num,id) {
      console.log(num)
      this.adoptVisible=true
      this.formData.processId=id
      if(num==='2'){
        this.formData.handleType='2'
      }else if(num==='3'){
        this.formData.handleType='3'
      }else if(num==='4'){
        this.formData.handleType='4'
      }
      this.formData.handleUserId=this.$store.getters.userId;
    },
    clickBack(id) {
      this.$confirm("是否驳回", "确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      })
        .then(() => {
          this.rejectProcess(id);
        })
        .catch(() => {});
    },
    clickDetail(id, approvalType) {
      this.centerDialogVisible = true;
      this.topLabel = approvalType;
      switch (approvalType) {
        case "调岗":
          this.seeState = "adjustThePost";
          break;
        case "离职":
          this.seeState = "quit";
          this.selectedId = id;
          this.$refs.quit.updateData(id);
          break;
        case "审核":
          this.seeState = "examine";
          break;
        case "加班":
          this.seeState = "overtime";
          this.selectedId = id;
          this.$refs.overtime.updateData(id);
          break;
        case "录用":
          this.seeState = "employment";
          break;
        case "请假":
          this.seeState = "leave";
          this.selectedId = id;
          this.$refs.leave.updateData(id);
          break;
        case "调休":
          this.seeState = "leave";
          this.selectedId = id;
          this.$refs.leave.updateData(id);
          break;
        default:
          this.seeState = "becomeARegularWorker";
          this.topLabel = "转正";
      }
    },
    closeDialog() {
      this.centerDialogVisible = false;
      this.init();
    },
    handleClose(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done();
          })
          .catch(_ => {});
      }
  },
  mounted() {
    this.init();
    this.getFlowData();
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables";
.usersApprovalsContainer {
  padding: 20px;
  .approvalsTop {
    color: #666;
    background: #fff;
    border-bottom: solid 1px #ccc;
    line-height: 40px;
    span {
      display: inline-block;
      padding: 0 25px;
      font-size: 18px;
      cursor: pointer;
    }
    .act {
      color: $blue;
      border-bottom: solid 2px $blue;
    }
  }
  .approvalsContent {
    .topTitle {
      background: #fff;
      padding: 15px;
      div {
        margin: 15px 0;
        span {
          position: relative;
          top: 2px;
          float: left;
          font-weight: bold;
        }
      }
    }
    .el-dropdown-link {
      color: #666;
      border: solid 1px #ccc;
      display: inline-block;
      width: 67px;
      height: 28px;
      padding: 2px 10px;
      font-size: 12px;
      border-radius: 3px;
      margin-right: 5px;
    }
  }
}
.page-list {
  text-align: right;
  margin-top: 10px;
}
.el-textarea__inner{ // 然后找到对应的类名，在这里将拉伸去掉即可
  resize: none;
  }
</style>