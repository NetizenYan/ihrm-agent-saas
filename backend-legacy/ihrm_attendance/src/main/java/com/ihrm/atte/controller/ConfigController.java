package com.ihrm.atte.controller;

import com.ihrm.atte.service.ConfigurationService;
import com.ihrm.common.controller.BaseController;
import com.ihrm.common.entity.Result;
import com.ihrm.common.entity.ResultCode;
import com.ihrm.common.exception.CommonException;
import com.ihrm.domain.atte.entity.AttendanceConfig;
import com.ihrm.domain.atte.entity.DeductionDict;
import com.ihrm.domain.atte.entity.ExtraDutyRule;
import com.ihrm.domain.atte.entity.LeaveConfig;
import com.ihrm.domain.atte.vo.ExtDutyVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * 配置考勤设置的controller
 */
@RestController
@RequestMapping("/cfg")
public class ConfigController extends BaseController{

	@Autowired
	private ConfigurationService configurationService;

	/**
	 * 获取考勤设置
	 *  cfg/atte/item
	 *  post
	 *    参数 departmentId
	 */
	@RequestMapping(value = "/atte/item" ,method = RequestMethod.POST)
	public Result atteConfig(String departmentId) {
		AttendanceConfig ac = configurationService.getAtteConfig(companyId,departmentId);
		return new Result(ResultCode.SUCCESS,ac);
	}

	/**
	 * 保存考勤设置
	 *  cfg/atte
	 *  put
	 *    参数 AttendanceConfig
	 */
	@RequestMapping(value = "/atte" ,method = RequestMethod.PUT)
	public Result saveAtteConfig(@RequestBody AttendanceConfig attendanceConfig) {
		attendanceConfig.setCompanyId(companyId);
		configurationService.saveAtteConfig(attendanceConfig);
		return new Result(ResultCode.SUCCESS);
	}


	/**
	 * 请假保存更新
	 */
	@RequestMapping(value = "/leave", method = RequestMethod.PUT)
	public Result leaveSaveOrUpdate(@RequestBody  List<LeaveConfig> leaveConfigList){
		//公共
		for (LeaveConfig leaveConfig:leaveConfigList) {
			leaveConfig.setCompanyId(this.companyId);
			configurationService.leaveConfigSaveOrUpdate(leaveConfig);
		}
		return  new Result(ResultCode.SUCCESS);
	}

	/**
	 * 扣款保存更新
	 */
	@RequestMapping(value = "/deduction", method = RequestMethod.PUT)
	public Result deductionSaveOrUpdate(HttpServletRequest request , @RequestBody /*@Valid*/ List<DeductionDict> deductionDictList){
		for (DeductionDict deductionDict : deductionDictList ) {
			//公共
			deductionDict.setCompanyId(this.companyId);
			configurationService.deductionDictSaveOrUpdate(deductionDict);
		}
		return  new Result(ResultCode.SUCCESS);
	}

	/**
	 * 加班保存更新
	 */
	@RequestMapping(value = "/extDuty", method = RequestMethod.PUT)
	public Result extDutySaveOrUpdate(HttpServletRequest request , @RequestBody @Valid ExtDutyVO atteExtDutyVO){
		atteExtDutyVO.setCompanyId(this.companyId);
		configurationService.extDutySaveOrUpdate(atteExtDutyVO);
		return  new Result(ResultCode.SUCCESS);
	}


	/**
	 * 请假设置信息查询
	 */
	@RequestMapping(value = "/leave/list", method = RequestMethod.POST)
	public Result leaveCfgItem(String  departmentId) throws CommonException {
		List<LeaveConfig> leaveConfigList = configurationService.getLeaveCfg(companyId,departmentId);
		return  new Result(ResultCode.SUCCESS,leaveConfigList);
	}

	/**
	 * 扣款设置信息查询
	 */
	@RequestMapping(value = "/ded/list", method = RequestMethod.POST)
	public Result dedCfgItem(String  departmentId) throws Exception {
		//公共
		List<DeductionDict> deductionDictList = configurationService.getDedCfgList(companyId,departmentId);
		return new Result(ResultCode.SUCCESS,deductionDictList);
	}


	/**
	 * 加班设置信息查询
	 */
	@RequestMapping(value = "/extDuty/item", method = RequestMethod.POST)
	public Result extWorkCfgItem(String  departmentId) throws CommonException {
		Map map = configurationService.getExtWorkCfg(companyId,departmentId);
		return new Result(ResultCode.SUCCESS,map);
	}

}
