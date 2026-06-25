<template>
  <div class="usersContainer">
    <div class="usersTop">
     <img src="../../assets/head.jpg"/>
          <div class="headInfoTip">
            <p class="firstChild">早安，HR 专员，祝你开心每一天！</p>
            <p class="lastChild">HR 专员  |  传智播客-总部-人力资源中心-招聘专员</p>
          </div>
    </div>
    <div class="usersContent">
      <div class="contBox">
        <div class="workCalendar">
          <div class="title">工作日历</div>
          <div class="contentItem">
            <DateIndex />
          </div>
        </div>
        <div class="shortcutEntrance">
          <div class="title">快捷入口</div>
          <div class="contentItem">
            <div style="display: inline-block;margin-bottom: 10px;" @click = "apply('离职')"><span>申请</span></div>
            <div style="display: inline-block;margin-bottom: 10px;" @click = "apply('事假')"><span>请假</span></div>
            <router-link :to="{'path':'./approvals'}"><span>审批</span></router-link>
            <!-- <router-link :to="{'path':'./recruit'}"><span>招聘</span></router-link> -->
            <router-link :to="{'path':'./myinfo'}"><span>我的信息</span></router-link>
          </div>
        </div>
      </div>
      <div class="advContent">
        <div class="title">
          公告
        </div>
              <div class="contentItem">
                <!-- <ul class="noticeList">
                  <li v-for="item in filteredItems" :key="item.id">
                    <router-link :to="{'path':'./noticeDetails'}">
                      <div class="item">
                        <img :src="item.addPersonHeaderImage" alt="">
                        <div>
                          <p><span class="col">{{item.addPerson}}</span> 发布了 {{item.bulletinTitle}}</p>
                          <p>{{item.latestOperationTime}}</p>
                        </div>
                      </div>
                    </router-link>
                  </li>
                </ul> -->
                <ul class="noticeList">
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                  <li>
                    <div class="item">
                        <img  src="./../../assets/img.jpeg" alt="">
                        <div>
                          <p><span class="col">朱继柳</span> 发布了 第二十期“传智大讲堂”互动讨论获奖名单公布</p>
                          <p>2018-07-21 15:21:38</p>
                        </div>
                      </div>
                  </li>
                </ul>
              </div>
            </div>
    </div>

    <el-dialog :title="title" :visible.sync="dialogVisible" width="40%" >
      <span>
        <Apply v-show="lab == '离职'"  v-on:closeDialog="closeDialog" v-on:handleShow='handleShow'/>
        <!-- <OverTimeWork v-show="lab == '加班'" /> -->
        <LeaveRelevant v-show="lab == '事假'"  v-on:closeDialog="closeDialog" v-on:handleShow='handleShow'/>
        <!-- <LeaveRelevant v-show="lab == '调休'"/> -->
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {detail} from '@/api/base/users'
import {list} from '@/api/hrm/noticesApi'
import Apply from './../components/Apply'
import OverTimeWork from './../components/OverTimeWork'
import LeaveRelevant from '../components/LeaveRelevant'
import DateIndex from '../components/DateIndex'
import { log } from 'util';
export default {
  name: 'users-table-index',
  components: { Apply, OverTimeWork, LeaveRelevant, DateIndex },
  data() {
    return {
      dialogVisible: false,
      title: '离职',
      lab: '',
      userId: '',
      myInfo: {
      },
      noticesList: [
      ]
    }
  },
  methods: {
    init() {
      this.userInfo()
      //this.getNotices()
    },
    noticeClick(item){
      this.$bus.emit("noticeDetail",item)
      this.$bus.off()
    },
    async userInfo(){
        this.userId=this.$store.getters.userId
        let id=this.userId
        const { data: userInfoRes } = await detail({id})
        if(userInfoRes.success == true){
            this.myInfo=userInfoRes.data
        }
    },
    async getNotices(){
        let dataMonth = this.dataMonth
        const { data: noticesRes } = await list({status:1})
        if(noticesRes.success == true){
            let arr = noticesRes.data.rows
            if(arr.length > 3){
              this.noticesList = arr.slice(0, 3)
            }else{
              this.noticesList = arr
            }
        }
    },
    apply(obj) {
      if (obj === '离职' || obj === '加班') {
        this.title = '申请'
      } else if (obj === '事假' || obj === '调休') {
        this.title = '请假'
      }
      this.lab = obj
      this.dialogVisible = true
    },
    closeDialog(){
      this.lab = ''
      this.dialogVisible = false
    },
    handleShow(){
      this.dialogVisible = false
    }
  },
  mounted() {
    this.init()
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  @import "./../../styles/variables";
.usersContainer{
  padding: 25px 0;
  .usersTop{
    background: #fff;
    display: flex;
    padding:20px;
    img{
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border:solid 1px #ccc;
      margin-right: 20px;
    }
    div{
      flex: 1;
      p{margin: 17px 0;}
      p:first-child{
        position: relative;
        font-weight: bold;
        top:0px;
        font-size: 22px;
        line-height: 15px;
      }
    }
  }
  .usersContent{
    margin: 25px;
    .contBox {
      display: flex;
      .workCalendar {
        background: #fff;
        margin-right: 15px;
        border-radius: 5px 5px 0px 0px;
        flex: 2;
        .title{
          padding: 15px;
          border-bottom: solid 1px #ccc;
          font-size: 16px;
          font-weight: bold;
        }
        .contentItem{
          min-height: 350px;
        }
      }
      .shortcutEntrance {
        background: #fff;
        border-radius: 5px 5px 0px 0px;
        flex: 1;
        .title{
          padding: 15px;
          border-bottom: solid 1px #ccc;
          font-size: 16px;
          font-weight: bold;
        }
        .contentItem{
          padding: 15px;
          span{
            display: inline-block;
            border-radius: 3px;
            background: $green;
            color:#fff;
            padding: 8px 16px;
            margin-right: 10px;
          }
        }
      }
    }
    .advContent{
      margin: 15px 0;
      background: #fff;
      border-radius: 5px 5px 0px 0px;
      .title{
        font-size: 16px;
        padding: 20px;
        font-weight: bold;
        border-bottom: solid 1px #ccc;
      }
      .contentItem{
        padding:0 30px;
        min-height: 350px;
        .item{
          display: flex;
          border-bottom: solid 1px #ccc;
          img{
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin-right: 10px;
          }
          p{
            margin: 15px 0;
            span{
              color:$blue;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}
</style>
