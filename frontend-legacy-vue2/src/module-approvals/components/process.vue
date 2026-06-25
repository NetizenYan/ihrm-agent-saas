<template>
  <div class="add-form">
    <el-dialog title="转正审批" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :model="formData" label-position="right" label-width="100px">
        <el-form-item label="应用：" prop="processType">
          <el-select class="filter-item" filterable v-model="formData.processType">
            <el-option
              v-for="item in baseData.approvalType"
              :key="item.id" :label="item.value" :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="节点：">
          <p><strong></strong><el-button 
              size="small" 
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="addTemp">新增节点</el-button></p>
            <div v-for="(item, index) in tempList"
              :label="'域名' + index"
              :key="item.key"
              :prop="'item.' + index + '.name'" style="border-top:1px solid #ececec;margin-top:10px;">
              <el-form-item label="名称：" prop="formOfEmployment" style="padding:10px 0;">
                <el-input v-model="item.name" style="width:300px;"></el-input>
              </el-form-item>
              <el-form-item label="执行人：" prop="formOfEmployment">
                <el-select class="filter-item" multiple v-model="item.user" style="width:300px;">
                <el-option
                  v-for="item in employeesSimpleListData"
                  :key="item.id" :label="item.fullName" :value="item.id">
                </el-option>
              </el-select>
              </el-form-item>
            </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveBtn">保存</el-button>
        <el-button @click="dialogFormVisible = false">{{$t('table.cancel')}}</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { settSave, employeesSimpleList } from '@/api/base/employees'
import { process } from '@/api/hrm/approvalsApi.js'
import commonApi from '@/api/constant/approvals'
var _this = null
export default {
  name: 'setting',
  props: ['setData'],
  data() {
    return {
      dialogFormVisible: false,
      activeName: 'first',
      employeesSimpleListData: [],
      formData: {
        processType: '',
        points: []
      },
      tempList: [],
      baseData: []
    }
  },
  methods: {
    // 业务方法
    setupUI() {
      this.baseData = commonApi
    },
    // 弹层显示
    dialogFormV() {
      this.dialogFormVisible = true
    },
    // 弹层隐藏
    dialogFormH() {
      this.dialogFormVisible = false
    },

    // 界面交互
    // 表单提交
    saveBtn() {
      for (var i = 0; i < this.tempList.length; i++) {
        var userData = this.tempList[i].user.join(',')
        var data = {
          name: this.tempList[i].name,
          users: userData
        }
        this.formData.points.push(data)
      }
      process(this.formData)
        .then(() => {
          this.$message.success('流程添加成功！')
          this.dialogFormVisible = false
        })
        .catch(e => {
          this.$message.error('保存失败！')
        })
    },
    // 新增一条模板数据
    addTemp() {
      if (this.tempList.length < 5) {
        this.tempList = this.tempList || []
        this.tempList.push({
          name: '',
          key: Date.now()
        })
      } else {
        this.$message.error('节点不能超过5个')
      }
    }
  },
  // 挂载结束
  mounted: function() {},
  // 创建完毕状态
  created: function() {
    _this = this
    this.setupUI()
  },
  // 组件更新
  updated: function() {}
}
</script>

<style rel="stylesheet/scss" lang="scss">
.inputText {
  width: 400px;
  height: 32px;
  resize: none;
  line-height: 22px;
  overflow: hidden;
  font-size: 12px;
  border: 1px solid #dddee1;
  padding: 4px 7px;
  border-radius: 5px;
}
</style>

<style rel="stylesheet/scss" lang="scss" scoped>
.setInfo {
  label {
    margin-right: 15px;
    padding: 0;
  }
}
.el-checkbox + .el-checkbox {
  margin: 0;
}
</style>
