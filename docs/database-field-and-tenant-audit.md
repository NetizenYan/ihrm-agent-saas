# 数据库字段与租户隔离审计

> 结论状态：静态分析 SQL 脚本与部分服务代码，未连接数据库执行查询。  
> SQL 文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql`。  
> 后端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版`。

## 1. 总体结论

| 结论 | 依据文件路径 |
|---|---|
| `ihrm` 业务库静态扫描到 51 张表，按前缀分为公司、系统、权限、员工、考勤、社保、薪资、审批、通知等模块。 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql` |
| 多数表没有显式外键约束，关系主要依靠字段名和服务代码维护。 | 同上 |
| 未发现统一逻辑删除字段；删除能力多表现为 Controller/Service 物理删除或状态字段控制。 | SQL 文件；`ihrm_company`、`ihrm_system` Controller 文件 |
| 部分明细表不含 `company_id`，必须通过父表或用户表关联租户，否则存在跨租户查询风险。 | SQL 文件；`ihrm_salarys`、`ihrm_social_securitys`、`ihrm_employee` 服务代码 |
| Agent 查询必须先获得当前用户 `companyId`，且所有业务查询必须携带租户隔离条件或可证明的父表关联条件。 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_common\src\main\java\com\ihrm\common\controller\BaseController.java` |

## 2. 表级字段审计

字段说明来自 SQL 脚本：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql`。

| 表 | 敏感等级 | 主键 | `company_id` | `user_id` | 状态/时间/逻辑删除字段 | 字段级说明与租户审计 |
|---|---|---|---|---|---|---|
| `co_company` | 中 | 证据不足 | 无 | 无 | `audit_state`、`state` | 公司主表；自身无 `company_id`，按公司 `id` 表示租户。 |
| `co_department` | 低 | `id` | 有 | 无 | 证据不足 | 部门表；Agent 查询必须限定 `company_id=currentCompanyId`。 |
| `co_transaction_record` | 中 | `id` | 有 | 有 | 证据不足 | 企业交易记录；涉及公司与用户，Agent 默认不开放。 |
| `bs_user` | 高 | `id` | 有 | 无 | `enable_state`、`in_service_status`、`correction_time` | 用户主表；包含账号和员工状态，Agent 查询必须脱敏并限定公司。 |
| `bs_city` | 低 | `id` | 无 | 无 | 证据不足 | 城市基础表；可作为低风险公共字典。 |
| `bs_month` | 低 | 证据不足 | 无 | 无 | 证据不足 | 月份字典；可作为公共字典。 |
| `bs_permission` | 极高 | `id` | 有 | 有 | 证据不足 | 历史权限或业务权限表；权限数据敏感。 |
| `pe_role` | 极高 | `id` | 有 | 无 | 证据不足 | 角色表；必须限定公司，写操作极高风险。 |
| `pe_user_role` | 极高 | `role_id,user_id` | 无 | 有 | 证据不足 | 用户角色关联表；需通过 `pe_role.company_id` 或 `bs_user.company_id` 隔离租户。 |
| `pe_role_permission` | 极高 | `role_id,permission_id` | 无 | 无 | 证据不足 | 角色权限关联表；需通过 `pe_role.company_id` 隔离租户。 |
| `pe_permission` | 极高 | `id` | 无 | 无 | `en_visible` | 权限主表；平台级权限定义，Agent 不应随意读取给普通用户。 |
| `pe_permission_menu` | 高 | `id` | 无 | 无 | 证据不足 | 菜单权限详情；需结合权限主表。 |
| `pe_permission_point` | 高 | `id` | 无 | 无 | `point_status` | 按钮权限详情；影响前端动作展示。 |
| `pe_permission_api` | 极高 | `id` | 无 | 无 | 证据不足 | API 权限详情；关系到后端访问控制。 |
| `em_user_company` | 高 | `user_id` | 有 | 有 | `in_service_status`、`correction_time`、`state` | 员工企业信息；以 `user_id` 关联用户，必须限定公司。 |
| `em_user_company_jobs` | 高 | `user_id` | 有 | 有 | `state_of_correction`、`correction_evaluation` | 岗位与转正信息；PII 和人事敏感。 |
| `em_user_company_personal` | 高 | `user_id` | 有 | 有 | `marital_status`、`state_of_children`、`is_there_a_major_medical_history` | 个人信息表，包含家庭和健康相关字段，默认不进入第一阶段 Agent。 |
| `em_archive` | 高 | `id` | 有 | 无 | 证据不足 | 员工归档表；必须限定公司和月份。 |
| `em_positive` | 高 | `user_id` | 无 | 有 | 证据不足 | 转正表；需通过 `bs_user` 或 `em_user_company` 关联公司。 |
| `em_resignation` | 高 | `user_id` | 无 | 有 | 证据不足 | 离职表；需通过用户表隔离租户。 |
| `em_transferposition` | 高 | `user_id` | 无 | 有 | `estatus` | 调岗表；需通过用户表隔离租户。 |
| `atte_attendance` | 高 | `id` | 有 | 有 | 证据不足 | 考勤记录；必须限定公司和用户范围。 |
| `atte_attendance_config` | 高 | `id` | 有 | 无 | 证据不足 | 考勤配置；必须限定公司。 |
| `atte_company_settings` | 高 | `company_id` | 有 | 无 | `is_settings` | 公司考勤配置；主键即公司。 |
| `atte_day_off_config` | 高 | `id` | 有 | 无 | 证据不足 | 休息日配置；必须限定公司。 |
| `atte_deduction_dict` | 高 | `id` | 有 | 无 | `is_absenteeism`、`is_enable` | 扣款规则字典；影响考勤薪资，写操作高风险。 |
| `atte_deduction_type` | 中 | 证据不足 | 无 | 无 | 证据不足 | 扣款类型基础字典；无租户字段，按公共字典处理。 |
| `atte_extra_duty_config` | 高 | `id` | 有 | 无 | `is_clock`、`is_compensationint` | 加班配置；必须限定公司。 |
| `atte_extra_duty_rule` | 高 | `id` | 有 | 无 | `is_time_off`、`is_enable` | 加班规则；必须限定公司。 |
| `atte_leave_config` | 高 | `id` | 有 | 无 | `leave_type`、`is_enable` | 请假配置；必须限定公司。 |
| `atte_archive_monthly` | 高 | `id` | 有 | 无 | `archive_year`、`archive_month`、`is_archived` | 考勤月归档父表；必须限定公司和月份。 |
| `atte_archive_monthly_info` | 高 | `id` | 无 | 有 | 多个请假/考勤统计字段 | 考勤归档明细；需通过 `atte_archive_monthly.company_id` 关联租户。 |
| `ss_user_social_security` | 极高 | `user_id` | 无 | 有 | 多个社保/公积金字段 | 社保个人主表；必须通过 `bs_user.company_id` 或服务层租户条件隔离。 |
| `ss_company_settings` | 极高 | `company_id` | 有 | 无 | `is_settings` | 公司社保设置；主键即公司。 |
| `ss_payment_item` | 高 | `id` | 无 | 无 | 证据不足 | 社保缴费项目字典；公共字典，但与社保业务相关。 |
| `ss_city_payment_item` | 高 | `id` | 无 | 无 | 证据不足 | 城市缴费项目；公共字典，高风险上下文。 |
| `ss_archive` | 极高 | `id` | 有 | 无 | 证据不足 | 社保归档父表；必须限定公司和月份。 |
| `ss_archive_detail` | 极高 | `id` | 无 | 有 | `leave_date` | 社保归档明细；需通过 `ss_archive.company_id` 关联租户。 |
| `sa_user_salary` | 极高 | `user_id` | 无 | 有 | 证据不足 | 员工薪资主表；必须通过用户表或服务层公司条件隔离，默认不开放 Agent。 |
| `sa_user_salary_change` | 极高 | `id` | 无 | 有 | 证据不足 | 调薪记录；必须通过用户表隔离租户。 |
| `sa_settings` | 极高 | `company_id` | 有 | 无 | 证据不足 | 公司薪资设置；主键即公司。 |
| `sa_company_settings` | 极高 | `company_id` | 有 | 无 | `is_settings` | 公司薪资配置；写操作极高风险。 |
| `sa_archive` | 极高 | `id` | 有 | 无 | 证据不足 | 薪资归档父表；必须限定公司和月份。 |
| `sa_archive_detail` | 极高 | `id` | 无 | 有 | `in_service_status` | 薪资归档明细；需通过 `sa_archive.company_id` 关联租户。 |
| `proc_instance` | 高 | `process_id` | 无 | 有 | 多个流程状态字段 | 审批实例；无 `company_id`，需通过发起用户、流程租户或业务表隔离。 |
| `proc_task_instance` | 高 | `task_id` | 无 | 无 | 多个任务状态字段 | 审批任务；有处理人与应处理人字段，需通过流程实例关联租户。 |
| `proc_user_group` | 高 | `id` | 无 | 无 | 证据不足 | 流程用户组；租户隔离证据不足。 |
| `sys_file` | 中 | `id` | 无 | 无 | 证据不足 | 文件表；需结合业务归属判断租户，证据不足。 |
| `sys_mail_record` | 中 | `id` | 无 | 无 | 证据不足 | 邮件记录；租户字段证据不足。 |
| `sys_settings` | 中 | `company_id` | 有 | 无 | 证据不足 | 公司系统设置；主键即公司。 |
| `nots_notices` | 中 | `id` | 有 | 有 | `status` | 通知表；必须限定公司和用户可见范围。 |

## 3. `company_id` 覆盖情况

依据文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql`。

### 3.1 有 `company_id` 的表

`atte_archive_monthly`、`atte_attendance`、`atte_attendance_config`、`atte_company_settings`、`atte_day_off_config`、`atte_deduction_dict`、`atte_extra_duty_config`、`atte_extra_duty_rule`、`atte_leave_config`、`bs_permission`、`bs_user`、`co_department`、`co_transaction_record`、`em_archive`、`em_user_company`、`em_user_company_jobs`、`em_user_company_personal`、`nots_notices`、`pe_role`、`sa_archive`、`sa_company_settings`、`sa_settings`、`ss_archive`、`ss_company_settings`、`sys_settings`。

### 3.2 没有 `company_id` 的表

`atte_archive_monthly_info`、`atte_deduction_type`、`bs_city`、`bs_month`、`co_company`、`em_positive`、`em_resignation`、`em_transferposition`、`pe_permission`、`pe_permission_api`、`pe_permission_menu`、`pe_permission_point`、`pe_role_permission`、`pe_user_role`、`proc_instance`、`proc_task_instance`、`proc_user_group`、`sa_archive_detail`、`sa_user_salary`、`sa_user_salary_change`、`ss_archive_detail`、`ss_city_payment_item`、`ss_payment_item`、`ss_user_social_security`、`sys_file`、`sys_mail_record`。

## 4. 跨租户查询风险

| 风险 | 受影响表 | 依据文件路径 | Agent 处理要求 |
|---|---|---|---|
| 明细表无 `company_id` | `sa_archive_detail`、`ss_archive_detail`、`atte_archive_monthly_info` | SQL 文件 | 必须 join 父表 `sa_archive`、`ss_archive`、`atte_archive_monthly` 后按父表 `company_id` 过滤。 |
| 用户业务表无 `company_id` | `sa_user_salary`、`sa_user_salary_change`、`ss_user_social_security`、`em_positive`、`em_resignation`、`em_transferposition` | SQL 文件 | 必须 join `bs_user` 或 `em_user_company` 后按 `company_id` 过滤。 |
| 权限关联表无 `company_id` | `pe_user_role`、`pe_role_permission` | SQL 文件 | 必须通过 `pe_role.company_id` 或 `bs_user.company_id` 过滤。 |
| 审批表无 `company_id` | `proc_instance`、`proc_task_instance`、`proc_user_group` | SQL 文件；`ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` | 必须通过当前用户、流程 tenant 或业务单据关联租户；证据不足时禁止 Agent 查询。 |
| 详情接口按 id 查询 | 多个 `findById` Controller 方法 | `ihrm_company`、`ihrm_system`、`ihrm_salarys`、`ihrm_social_securitys` Controller 文件 | Agent 调用详情接口前后都必须校验返回数据属于当前公司。 |

## 5. 敏感表分级

| 等级 | 表 | 依据文件路径 |
|---|---|---|
| 极高 | `sa_user_salary`、`sa_user_salary_change`、`sa_settings`、`sa_company_settings`、`sa_archive`、`sa_archive_detail` | SQL 文件；`ihrm_salarys\src\main\java\com\ihrm\salarys\controller\*.java` |
| 极高 | `ss_user_social_security`、`ss_company_settings`、`ss_archive`、`ss_archive_detail` | SQL 文件；`ihrm_social_securitys\src\main\java\com\ihrm\social\controller\SocialSecurityController.java` |
| 极高 | `pe_role`、`pe_user_role`、`pe_role_permission`、`pe_permission*`、`bs_permission` | SQL 文件；`ihrm_system\src\main\java\com\ihrm\system\controller\PermissionController.java`；`RoleController.java` |
| 高 | `proc_instance`、`proc_task_instance`、`proc_user_group` | SQL 文件；`ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` |
| 高 | `bs_user`、`em_user_company*`、`em_archive`、`em_positive`、`em_resignation`、`em_transferposition` | SQL 文件；`ihrm_employee\src\main\java\com\ihrm\employee\controller\EmployeeController.java` |
| 高 | `atte_*` | SQL 文件；`ihrm_attendance\src\main\java\com\ihrm\atte\controller\*.java` |

## 6. Agent 查询必须携带的租户隔离条件

| 查询对象 | 必须条件 | 依据文件路径 |
|---|---|---|
| 直接含 `company_id` 的业务表 | `table.company_id = currentProfile.companyId` | `BaseController.java`；SQL 文件 |
| 用户相关表但无 `company_id` | `JOIN bs_user u ON target.user_id = u.id AND u.company_id = currentProfile.companyId` | SQL 文件 |
| 员工扩展表 | 优先 `JOIN em_user_company e ON target.user_id = e.user_id AND e.company_id = currentProfile.companyId` | SQL 文件 |
| 薪资归档明细 | `JOIN sa_archive a ON detail.archive_id = a.id AND a.company_id = currentProfile.companyId` | SQL 文件 |
| 社保归档明细 | `JOIN ss_archive a ON detail.archive_id = a.id AND a.company_id = currentProfile.companyId` | SQL 文件 |
| 考勤归档明细 | `JOIN atte_archive_monthly a ON info.atte_archive_monthly_id = a.id AND a.company_id = currentProfile.companyId` | SQL 文件 |
| 角色权限关联 | `JOIN pe_role r ON relation.role_id = r.id AND r.company_id = currentProfile.companyId` | SQL 文件 |
| 审批流程 | 必须证明 `process` 属于当前用户或当前公司；无法证明时拒绝 | SQL 文件；`ProcessController.java` |

禁止项：Agent 不得直接构造无租户条件的数据库查询；不得查询薪资、社保、审批、权限敏感表的全量数据；不得绕过 Java API 和 Shiro/RBAC 直接读取敏感数据。

