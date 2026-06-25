<template>
  <div class="boxInfo">
    <!-- 数据表格 -->
    <!-- 部门：
    <el-select v-model="requestParameters.departmentId" placeholder="请选择" @change="handleChange">
      <el-option v-for="item in departmentData" :key="item.id" :label="item.name" :value="item.id"></el-option>
    </el-select> -->
    <div class="fr clearfix searchInfo">
      <!-- <div class="serachInput">
        <el-input
          placeholder="搜索"
          v-model="requestParameters.keyword"
          clearable
          @keyup.enter.native="dataSearch(itemes,index)"
        ></el-input>
      </div>-->
      <!-- <el-input v-model="requestParameters.keyword" placeholder="请输入姓名" @click="handleSearch"></el-input> -->
      <a
        class="el-button fr el-button--primary el-button--mini"
        title="导出"
        @click="handelFileDownload"
      >导出</a>
    </div>
    <el-table
      :key="tableKey"
      :data="tables"
      empty-text="暂无数据"
      fit
      highlight-current-row
      style="width: 100%; margin-top:10px;"
      border
      id="item"
    >
      <el-table-column prop="name" label="姓名" width="120"></el-table-column>
      <el-table-column prop="workNumber" label="工号" width="100"></el-table-column>
      <el-table-column prop="mobile" label="手机号" width="200"></el-table-column>
      <el-table-column prop="department" label="部门" width="200"></el-table-column>
      <el-table-column prop="leaveDays" label="事假" width="100"></el-table-column>
      <el-table-column prop="dayOffLeaveDays" label="调休" width="100"></el-table-column>
      <el-table-column prop="normalDays" label="正常" width="100"></el-table-column>
      <el-table-column prop="laterTimes" label="迟到次数" width="100"></el-table-column>
      <el-table-column prop="earlyTimes" label="早退次数" width="100"></el-table-column>
      <el-table-column prop="averageDailyNaturalDays" label="日均时长" width="150"></el-table-column>
      <el-table-column prop="absenceDays" label="旷工天数" width="100"></el-table-column>
      <el-table-column prop="isFullAttendanceint" :formatter="fStandards" label="是否全勤" width="100"></el-table-column>
      <el-table-column prop="actualAtteOfficialDays" label="实际出勤天数" width="180"></el-table-column>
      <el-table-column prop="workingDays" label="应出勤工作日" width="120"></el-table-column>
    </el-table>
    <!-- 分页 -->
    <!-- <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :page-size="requestParameters.pagesize"
        layout="total, prev, pager, next"
        :total="Number(counts)"
      ></el-pagination>
    </div>-->
    <!-- end -->
    <!-- 数据表格 / -->
    <div class="butList">
      <el-tooltip
        class="item"
        effect="dark"
        content="将当前报表存放至归档，归档可以多次，但只保留最后一次"
        placement="top-start"
      >
        <el-button type="primary" @click="archivingReportForm">归档{{month}}月份报表</el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="开始做下月考勤" placement="top-start">
        <el-button type="primary" @click="createReportForm">新建报表</el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import {
  reportFormList,
  archives,
  newReports,
  importReport
} from "@/api/hrm/attendances";
import { list, archive } from "@/api/base/dept";
import commonApi from "@/utils/common";
import { getBlob } from "@/filters/index";
import FileSaver from "file-saver";
import XLSX from "xlsx";
export default {
  name: "exampleList",
  components: {},
  props: ["yearMonth", "month"],
  data() {
    return {
      // baseData: [],
      dataList: [],
      seleList: [],
      text: "", // 新增、编辑文本
      tableKey: 0,
      listLoading: true,
      counts: "",
      barSearch: {
        alertText: ""
      },
      requestParameters: {
        //departmentId: "",
        atteDate: ""
      },
      departmentData: [],
      isArchived: "",
      loading: false,
      centerDialogVisible: false,
      infoTip: "",
      archivedData: {}
    };
  },
  computed: {
    // 模糊搜索
    tables() {
      const search = this.requestParameters.keyword;
      if (search) {
        return this.dataList.filter(data => {
          return Object.keys(data).some(key => {
            return (
              String(data[key])
                .toLowerCase()
                .indexOf(search) > -1
            );
          });
        });
      }
      return this.dataList;
    }
  },
  methods: {
    fStandards(state) {
      return state==0?"是":"否";
    },
    // 业务方法
    async doQuery(params) {
      this.listLoading = true;
      await reportFormList(params)
        .then(data => {
          if (data !== null) {
            this.dataList = data.data.data;
            this.listLoading = false;
          }
        })
        .catch(e => {
          this.$message.error("错了哦，这是一条错误消息");
        });
    },
    // 部门
    // async getdepartment() {
    //   await list().then(data => {
    //     this.departmentData = data.data.data.depts;
    //     this.requestParameters.departmentId = this.departmentData[0].id;
    //     this.doQuery(this.requestParameters);
    //   });
    // },
    // 新增用户刷新列表
    handleLoadDataList() {
      this.doQuery(this.requestParameters);
    },
    async archivingReportForm() {
      var atteDate = {
        archiveDate: this.yearMonth
      };
      this.$confirm("您确认归档该月报表吗?", "归档" + this.month + "报表", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      }).then(() => {
          archive(atteDate).then(data => {
            this.$message({
              type: "success",
              message: "归档成功！!"
            });
          });
        }).catch(ret => {
          console.log(ret)
        })
    },
    // 选择部门
    handleChange(val) {
      this.requestParameters.departmentId = val;
      this.doQuery(this.requestParameters);
    },
    // 新建报表
    createReportForm() {
      let msg = "您确认新建报表吗？新建成功后,已归档数据不可修改";
      let nextMonth = commonApi.getNextMonth(this.yearMonth)
      var atteTime = this.yearMonth.substring(0,4) +"-"+ this.yearMonth.substring(4);
      atteTime = commonApi.getNextMonth(atteTime).datas.replace("-","");
      this.requestParameters.yearMonth = atteTime;
      this.$confirm(msg, "新建" + this.yearMonth + "报表", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      }).then(() => {
        newReports(this.requestParameters).then(data => {
          if(data.data.success){
            this.$router.push("/attendances/index")
          }
        });
      }).catch(ret => {
          console.log(ret)
        })
    },
    // 界面交互
    // 界面初始数据

    // 每页显示信息条数
    handleSizeChange(pageSize) {
      this.requestParameters.pagesize = pageSize;
      if (this.requestParameters.page === 1) {
        this.doQuery(this.requestParameters);
      }
    },
    // 进入某一页
    handleCurrentChange(val) {
      this.requestParameters.page = val;
      this.doQuery(this.requestParameters);
    },
    // 下载文件
    handelFileDownload() {
      // var parent = {
      //   departmentId: this.requestParameters.departmentId,
      //   atteDate: this.requestParameters.atteDate
      // };
      // importReport(parent)
      //   .then(response => {
          let getName = "人事报表";
          let items = XLSX.utils.table_to_book(document.querySelector("#item"));
          getBlob(getName, items, XLSX.write, FileSaver.saveAs);
          this.$message.success("导出报表成功！");
        // })
        // .catch(e => {
        //   console.log("发生错误了", e);
        //   this.$message.error("导出报表失败！");
        // });
    }
    // // 搜索
    // dataSearch() {
    //   this.doQuery(this.requestParameters);
    // }
  },
  // 挂载结束
  mounted: function() {},
  // 创建完毕状态
  created: function() {
    this.requestParameters.atteDate = this.yearMonth;
    //this.getdepartment();
    this.doQuery(this.requestParameters);
  },
  // 组件更新
  updated: function() {}
};
</script>
<style rel="stylesheet/scss" lang="scss">
.el-message-box--center .el-message-box__content p {
  text-align: left;
}
</style>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./../../styles/variables.scss";
.butList {
  // border-top: solid 1px #f4f4f4;
  margin-top: 15px;
  text-align: center;
  background: #fff;
  span {
    display: inline-block;
    background: $green;
    color: #fff;
    padding: 8px 20px;
    border-radius: 3px;
    margin: 10px;
    cursor: pointer;
  }
  .cancel {
    background: #ccc;
    color: #666;
  }
}
</style>
