# API 清单与 Agent Tool 风险评估

> 结论状态：静态扫描 Controller/API 文件，未实际调用接口。  
> 后端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版`。  
> 前端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版`。  
> 请求参数和返回类型来自 Controller 方法签名；复杂 DTO 字段未逐项展开，证据不足处已标注。

## 1. 风险与 Agent Tool 判断口径

| 等级 | 判断标准 | 依据 |
|---|---|---|
| 低 | 公开基础数据或低敏只读数据，例如城市、部门只读 | Controller 路径与业务语义，文件路径见接口表。 |
| 中 | 公司、组织、用户基础信息等内部数据 | Controller 路径与实体命名，文件路径见接口表。 |
| 高 | 考勤、员工档案、审批查询、角色权限读取、导出 | Controller 路径与业务语义，文件路径见接口表。 |
| 极高 | 薪资、社保、审批写入、权限写入、删除、导入、流程部署、角色分配 | `ihrm_salarys`、`ihrm_social_securitys`、`ihrm_audit`、`ihrm_system` 权限 Controller，文件路径见接口表。 |

登录与权限判断依据：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\java\com\ihrm\system\ShiroConfiguration.java`、`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_common\src\main\java\com\ihrm\common\shiro\realm\IhrmRealm.java`、`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\java\com\ihrm\system\controller\UserController.java`。除明确标注 `@RequiresPermissions` 的接口外，其余接口是否有细粒度 API 权限注解，静态证据不足。

## 2. Controller 接口总表

### 2.1 考勤服务 `ihrm_attendance`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/attendances/archives` | `ihrm_attendance\src\main\java\com\ihrm\atte\controller\AttendanceController.java` | `archives` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/attendances/{id}` | 同上 | `editAtte` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/reports/{id}` | 同上 | `findInfosById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/reports/year` | 同上 | `findReportsByYear` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/archive/{userId}/{yearMonth}` | 同上 | `historyData` | path `userId`、`yearMonth` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/attendances/import` | 同上 | `importExcel` | upload/body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances` | 同上 | `importExcel` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/archive/item` | 同上 | `item` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/newReports` | 同上 | `newReports` | query 证据不足 | `Result` | 可能写入报表，证据不足 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/attendances/reports` | 同上 | `reports` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/cfg/atte/item` | `ihrm_attendance\src\main\java\com\ihrm\atte\controller\ConfigController.java` | `atteConfig` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/cfg/ded/list` | 同上 | `dedCfgItem` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/cfg/deduction` | 同上 | `deductionSaveOrUpdate` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/cfg/extDuty` | 同上 | `extDutySaveOrUpdate` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/cfg/extDuty/item` | 同上 | `extWorkCfgItem` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/cfg/leave/list` | 同上 | `leaveCfgItem` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/cfg/leave` | 同上 | `leaveSaveOrUpdate` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/cfg/atte` | 同上 | `saveAtteConfig` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |

### 2.2 审批服务 `ihrm_audit`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/user/process/deploy` | `ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` | `deployProcess` | `MultipartFile file` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/user/process/definition` | 同上 | `definitionList` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/user/process/suspend/{processKey}` | 同上 | `suspendProcess` | path `processKey` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| PUT | `/user/process/instance/{page}/{size}` | 同上 | `instanceList` | path `page,size`，body `ProcInstance` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/user/process/instance/{id}` | 同上 | `instanceDetail` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/user/process/startProcess` | 同上 | `startProcess` | body `Map` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| PUT | `/user/process/instance/commit` | 同上 | `commit` | body `ProcTaskInstance` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/user/process/instance/tasks/{id}` | 同上 | `tasks` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |

### 2.3 公司组织服务 `ihrm_company`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/company` | `ihrm_company\src\main\java\com\ihrm\company\controller\CompanyController.java` | `save` | body `Company` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/company` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 中 |
| GET | `/company/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 中 |
| PUT | `/company/{id}` | 同上 | `update` | path `id`，body `Company` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| DELETE | `/company/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/company/department` | `ihrm_company\src\main\java\com\ihrm\company\controller\DepartmentController.java` | `save` | body `Department` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/company/department` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 是 | 低 |
| POST | `/company/department/search` | 同上 | `findByCode` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 中 |
| GET | `/company/department/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 是 | 低 |
| PUT | `/company/department/{id}` | 同上 | `update` | path `id`，body `Department` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| DELETE | `/company/department/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | 需登录；权限注解证据不足 | 否 | 极高 |

### 2.4 员工服务 `ihrm_employee`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/employees/archives/{month}` | `ihrm_employee\src\main\java\com\ihrm\employee\controller\EmployeeController.java` | `archives` | path `month` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/export/{month}` | 同上 | `export` | path `month` | 文件/响应流，证据不足 | 读/导出 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/archives` | 同上 | `findArchives` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/jobs` | 同上 | `findJobsInfo` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/leave` | 同上 | `findLeave` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/personalInfo` | 同上 | `findPersonalInfo` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/positive` | 同上 | `findPositive` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/transferPosition` | 同上 | `findTransferPosition` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/employees/{id}/pdf` | 同上 | `pdf` | path `id` | 文件/响应流，证据不足 | 读/导出 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/archives/{month}` | 同上 | `saveArchives` | path `month`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/{id}/jobs` | 同上 | `saveJobsInfo` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/{id}/leave` | 同上 | `saveLeave` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/{id}/personalInfo` | 同上 | `savePersonalInfo` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/{id}/positive` | 同上 | `savePositive` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/employees/{id}/transferPosition` | 同上 | `saveTransferPosition` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |

### 2.5 薪资服务 `ihrm_salarys`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/salarys/reports/{yearMonth}` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\ArchiveController.java` | `historyDetail` | path `yearMonth` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/salarys/company-settings` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\CompanySettingsController.java` | `getCompanySettings` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/salarys/reports/{yearMonth}/newReport` | 同上 | `newReport` | path `yearMonth` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/salarys/company-settings` | 同上 | `saveCompanySettings` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/salarys/modify/{userId}` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\SalaryController.java` | `modifyGet` | path `userId` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/salarys/modify/{userId}` | 同上 | `modify` | path `userId`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/salarys/init/{userId}` | 同上 | `init` | path `userId`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/salarys/list` | 同上 | `list` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/salarys/settings` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\SettingsController.java` | `getSettings` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| POST | `/salarys/settings` | 同上 | `saveSettings` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |

### 2.6 社保服务 `ihrm_social_securitys`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/social_securitys/{id}` | `ihrm_social_securitys\src\main\java\com\ihrm\social\controller\SocialSecurityController.java` | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/social_securitys/payment_item/{id}` | 同上 | `findPaymentItem` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/social_securitys/historys/archiveDetail/{userId}/{yearMonth}` | 同上 | `historysData` | path `userId,yearMonth` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/social_securitys/historys/{yearMonth}/archive` | 同上 | `historysDetail` | path `yearMonth` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/social_securitys/historys/{yearMonth}` | 同上 | `historysDetail` | path `yearMonth` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/social_securitys/historys/{year}/list` | 同上 | `historysList` | path `year` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/social_securitys/list` | 同上 | `list` | body/query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 极高 |
| PUT | `/social_securitys/historys/{yearMonth}/newReport` | 同上 | `saveSettings` | path `yearMonth` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/social_securitys/settings` | 同上 | `saveSettings` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| PUT | `/social_securitys/{id}` | 同上 | `saveUserSocialSecurity` | path `id`，body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/social_securitys/settings` | 同上 | `settings` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |

### 2.7 系统权限服务 `ihrm_system`

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/sys/login` | `ihrm_system\src\main\java\com\ihrm\system\controller\UserController.java` | `login` | body `loginMap` | `Result` | 认证 | 匿名允许 | 否 | 高 |
| POST | `/sys/profile` | 同上 | `profile` | 当前登录 Session | `Result` | 读 | 需登录 | 是 | 中 |
| POST | `/sys/user` | 同上 | `save` | body `User` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/sys/user` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 高 |
| GET | `/sys/user/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 高 |
| PUT | `/sys/user/{id}` | 同上 | `update` | path `id`，body `User` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| DELETE | `/sys/user/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | `@RequiresPermissions("API-USER-DELETE")` | 否 | 极高 |
| GET | `/sys/user/simple` | 同上 | `simple` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 谨慎 | 中 |
| PUT | `/sys/user/assignRoles` | 同上 | `assignRoles` | body 证据不足 | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/sys/user/import` | 同上 | `importUser` | upload/body 证据不足 | `Result` | 写/导入 | 需登录；权限注解证据不足 | 否 | 极高 |
| 任意 | `/sys/user/upload/{id}` | 同上 | `upload` | path `id`，upload/body 证据不足 | `Result` | 写/上传 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/sys/test/{id}` | 同上 | `testFeign` | path `id` | `Result` | 测试 | 需登录；权限注解证据不足 | 否 | 中 |
| POST | `/sys/permission` | `ihrm_system\src\main\java\com\ihrm\system\controller\PermissionController.java` | `save` | body `Permission` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/sys/permission` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/sys/permission/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/sys/permission/{id}` | 同上 | `update` | path `id`，body `Permission` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| DELETE | `/sys/permission/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/sys/role` | `ihrm_system\src\main\java\com\ihrm\system\controller\RoleController.java` | `add` | body `Role` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| GET | `/sys/role` | 同上 | `findByPage` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/sys/role/list` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| GET | `/sys/role/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | 需登录；权限注解证据不足 | 否 | 高 |
| PUT | `/sys/role/{id}` | 同上 | `update` | path `id`，body `Role` | `Result` | 写 | 需登录；权限注解证据不足 | 否 | 极高 |
| DELETE | `/sys/role/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | 需登录；权限注解证据不足 | 否 | 极高 |
| PUT | `/sys/role/assignPrem` | 同上 | `assignPrem` | body 证据不足 | `Result` | 写/授权 | 需登录；权限注解证据不足 | 否 | 极高 |
| POST | `/sys/city` | `ihrm_system\src\main\java\com\ihrm\system\controller\CityController.java` | `save` | body `City` | `Result` | 写 | `/sys/city/**` 匿名允许 | 否 | 高 |
| GET | `/sys/city` | 同上 | `findAll` | query 证据不足 | `Result` | 读 | `/sys/city/**` 匿名允许 | 是 | 低 |
| GET | `/sys/city/{id}` | 同上 | `findById` | path `id` | `Result` | 读 | `/sys/city/**` 匿名允许 | 是 | 低 |
| PUT | `/sys/city/{id}` | 同上 | `update` | path `id`，body `City` | `Result` | 写 | `/sys/city/**` 匿名允许 | 否 | 高 |
| DELETE | `/sys/city/{id}` | 同上 | `delete` | path `id` | `Result` | 写/删除 | `/sys/city/**` 匿名允许 | 否 | 极高 |

### 2.8 公共与网关测试 Controller

| HTTP | 路径 | Controller 文件路径 | 方法名 | 请求参数 | 返回类型 | 读写 | 登录/权限 | Agent Tool | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| 任意 | `/autherror` | `ihrm_common\src\main\java\com\ihrm\common\controller\ErrorController.java` | `autherror` | query 证据不足 | `Result` | 错误响应 | 匿名/认证失败回调 | 否 | 低 |
| GET | `/test` | `ihrm_gate\src\main\java\com\ihrm\gate\controller\TestController.java` | `test` | 无 | 字符串/证据不足 | 测试 | 证据不足 | 否 | 低 |

## 3. 前端引用但后端 Controller 证据不足的路径

以下路径在前端 API 封装中出现，但在当前 day17 后端 Controller 静态扫描中未找到同名 Controller 方法。暂不建议作为 Agent Tool。

| 前端 API 文件路径 | 示例路径 | 结论 |
|---|---|---|
| `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api\base\frame.js` | `/frame/register`、`/frame/logout`、`/base/menus` | 后端 Controller 证据不足。 |
| `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api\base\faceLogin.js` | `/sys/faceLogin/**` | system Shiro 配置放行该路径，但 Controller 证据不足。 |
| `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api\employees.js` | `/employees`、`/employees/import`、`/employees/simple`、`/employees/{id}/accountStatus` | 前端引用与当前 `EmployeeController` 扫描结果不完全一致，证据不足。 |
| `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api\approvals.js` | `/approvals/**`、`/user/process_dimission/**` | 当前后端主要为 `/user/process/**`，前端路径存在历史差异，证据不足。 |
| `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api\dashboard.js` | `/home/**`、`/notices/**` | 后端 Controller 证据不足。 |

## 4. 第一阶段 Agent Tool 建议

| 工具名 | 调用接口 | 依据文件路径 | 读写 | 风险 | 第一阶段开放 |
|---|---|---|---|---|---|
| `get_current_profile` | `POST /sys/profile` | `ihrm_system\src\main\java\com\ihrm\system\controller\UserController.java` | 读 | 中 | 是 |
| `list_departments` | `GET /company/department` | `ihrm_company\src\main\java\com\ihrm\company\controller\DepartmentController.java` | 读 | 低 | 是，必须携带当前用户租户上下文 |
| `get_department` | `GET /company/department/{id}` | 同上 | 读 | 低 | 是，必须校验部门属于当前租户 |
| `list_cities` | `GET /sys/city` | `ihrm_system\src\main\java\com\ihrm\system\controller\CityController.java` | 读 | 低 | 是 |
| `list_users_simple` | `GET /sys/user/simple` | `ihrm_system\src\main\java\com\ihrm\system\controller\UserController.java` | 读 | 中 | 谨慎，仅管理场景且脱敏 |
| `list_roles` | `GET /sys/role` 或 `GET /sys/role/list` | `ihrm_system\src\main\java\com\ihrm\system\controller\RoleController.java` | 读 | 高 | 否，RBAC 信息敏感 |
| `list_attendance_reports` | `GET /attendances/reports` | `ihrm_attendance\src\main\java\com\ihrm\atte\controller\AttendanceController.java` | 读 | 高 | 否 |
| `list_salarys` | `POST /salarys/list` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\SalaryController.java` | 读 | 极高 | 否 |
| `list_social_securitys` | `POST /social_securitys/list` | `ihrm_social_securitys\src\main\java\com\ihrm\social\controller\SocialSecurityController.java` | 读 | 极高 | 否 |
| `commit_process_task` | `PUT /user/process/instance/commit` | `ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` | 写 | 极高 | 否 |

