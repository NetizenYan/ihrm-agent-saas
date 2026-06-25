<template>
  <div class="dashboard-container">
    <div class="app-container">
      <ScoialPageTool />
      <div class="cont-bod-box">
        <el-table
          :data="tableData"
          style="width: 100%"
          :default-sort="{prop: 'date', order: 'descending'}"
        >
          <el-table-column type="selection" width="30"></el-table-column>
          <el-table-column type="index" width="80" label="序号"></el-table-column>
          <el-table-column prop="processName" label="审批类型" sortable></el-table-column>
          <el-table-column prop="username" label="申请人" sortable></el-table-column>
          <el-table-column prop="procCurrNodeUserName" label="当前审批人" sortable></el-table-column>
          <el-table-column label="审批发起时间" sortable>
            <template slot-scope="scope">
              <span>{{scope.row.procApplyTime | formatDate}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="process_state" label="审批状态" sortable>
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
          <el-table-column label="操作" width="100">
            <template slot-scope="scope" style>
              <span class="seeDet" @click="detailes(scope.row)">查看</span>
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
  </div>
</template>

<script>
import { list } from "@/api/hrm/approvalsApi.js";
import ScoialPageTool from "../components/ScoialPageTool";
import { formatDate } from "@/utils/index.js";
export default {
  name: "social-securitys-table-index",
  components: { ScoialPageTool },
  data() {
    return {
      tableData: [],
      pageInfo: "",
      total: '',
      requestParameters: {
        page: 1,
        pageSize: 10
      }
    };
  },
  filters: {
    formatDate(time) {
      var date = new Date(time);
      return formatDate(date, "yyyy-MM-dd hh:mm");
    }
  },
  methods: {
    // 初始化数据
    init() {
      list(this.requestParameters)
        .then(res => {
          this.total = res.data.data.total
          this.tableData = res.data.data.rows;
          this.loading = false;
        })
        .catch(err => {
          this.$message.error(err);
          this.loading = false;
        });
    },
    detailes(obj) {
      var name = obj.processName;
      switch (name) {
        case "工资":
          this.$router.push({ path: "./salaryApproval/" + obj.processId });
          break;
        case "入职":
          this.$router.push({ path: "./enterApproval/" + obj.processId });
          break;
        case "请假":
          this.$router.push({ path: "./leaveApproval/" + obj.processId });
          break;
        case "离职":
          this.$router.push({ path: "./quitApproval/" + obj.processId });
          break;
        case "加班":
          this.$router.push({ path: "./overtimeApproval/" + obj.processId });
      }
    },
    // 每页显示信息条数
    handleSizeChange(pageSize) {
      this.requestParameters.pagesize = pageSize
      if (this.requestParameters.page === 1) {
        this.init(this.requestParameters)
      }
    },
    // 进入某一页
    handleCurrentChange(val) {
      this.requestParameters.page = val
      this.init()
    },
  },
  mounted() {
    this.init();
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.cont-bod-box {
  padding: 20px;
  background: #fff;
  border-radius: 3px;
  margin-top: 15px;
  margin-bottom: 15px;
  border: 1px solid #ebeef5;
}
.page-list {
  text-align: right;
  margin-top: 10px;
}
</style>
