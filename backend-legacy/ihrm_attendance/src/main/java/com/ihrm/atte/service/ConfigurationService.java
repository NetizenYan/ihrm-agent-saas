package com.ihrm.atte.service;

import com.ihrm.atte.dao.*;
import com.ihrm.common.entity.ResultCode;
import com.ihrm.common.exception.CommonException;
import com.ihrm.common.utils.BeanMapUtils;
import com.ihrm.common.utils.IdWorker;
import com.ihrm.domain.atte.entity.*;
import com.ihrm.domain.atte.enums.DeductionEnum;
import com.ihrm.domain.atte.enums.LeaveTypeEnum;
import com.ihrm.domain.atte.vo.ConfigVO;
import com.ihrm.domain.atte.vo.ExtDutyVO;
import com.ihrm.domain.atte.vo.ExtWorkVO;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.*;


@Service
public class ConfigurationService{

    @Autowired
    private AttendanceConfigDao attendanceConfigDao;

    @Autowired
    private LeaveConfigDao leaveConfigDao;

    @Autowired
    private DeductionDictDao deductionDictDao;

    @Autowired
    private ExtraDutyConfigDao extraDutyConfigDao;

    @Autowired
    private ExtraDutyRuleDao extraDutyRuleDao;

    @Autowired
    private DayOffConfigDao dayOffConfigDao;

    @Autowired
    private IdWorker idWorker;

    //查询考勤设置
	public AttendanceConfig getAtteConfig(String companyId, String departmentId) {
		AttendanceConfig ac = attendanceConfigDao.findByCompanyIdAndDepartmentId(companyId,departmentId);
		if(ac == null) {
			ac = new AttendanceConfig();
		}
		ac.setCompanyId(companyId);
		ac.setDepartmentId(departmentId);
		return ac;
	}

	//保存或者更新考勤设置
	public void saveAtteConfig(AttendanceConfig attendanceConfig) {
		//1.查询是否存在响应的考勤记录
		AttendanceConfig vo = attendanceConfigDao.findByCompanyIdAndDepartmentId(attendanceConfig.getCompanyId(), attendanceConfig.getDepartmentId());
		//2.如果存在,更新
		if(vo != null) {
			attendanceConfig.setId(vo.getId());
		}else {
			//3.如果不存在,设置id,保存
			attendanceConfig.setId(idWorker.nextId() +"");
		}
		attendanceConfigDao.save(attendanceConfig);
	}

	public void leaveConfigSaveOrUpdate(LeaveConfig leaveConfig) {
		LeaveConfig demo = leaveConfigDao.findByCompanyIdAndDepartmentIdAndLeaveType(leaveConfig.getCompanyId(), leaveConfig.getDepartmentId(), leaveConfig.getLeaveType());
		if(demo != null) {
			leaveConfig.setId(demo.getId());
		}else {
			//3.如果不存在,设置id,保存
			leaveConfig.setId(idWorker.nextId() +"");
		}
		leaveConfigDao.save(leaveConfig);
	}

	public void attendanceConfigSaveOrUpdate(@Valid AttendanceConfig attendanceConfig) {
		attendanceConfigDao.save(attendanceConfig);
	}

	public void deductionDictSaveOrUpdate(DeductionDict leaveConfig) {
		DeductionDict demo = deductionDictDao.findByCompanyIdAndDepartmentIdAndDedTypeCode(leaveConfig.getCompanyId(), leaveConfig.getDepartmentId(), leaveConfig.getDedTypeCode());
		if(demo != null) {
			leaveConfig.setId(demo.getId());
		}else {
			//3.如果不存在,设置id,保存
			leaveConfig.setId(idWorker.nextId() +"");
		}
		deductionDictDao.save(leaveConfig);
	}


	public AttendanceConfig getAtteCfgItem(String companyId, String departmentId) {
		return attendanceConfigDao.findByCompanyIdAndDepartmentId(companyId,departmentId);
	}

	public List<LeaveConfig> getLeaveCfg(String companyId, String departmentId) {
		return leaveConfigDao.findByCompanyIdAndDepartmentId(companyId,departmentId);
	}

	public List<DeductionDict> getDedCfgList(String companyId, String departmentId) {
		return deductionDictDao.findByCompanyIdAndDepartmentId(companyId,departmentId);
	}


	@Transactional(rollbackFor = Exception.class)
	public void extDutySaveOrUpdate(ExtDutyVO atteExtDutyVO) {

		//参数获取
		String companyId = atteExtDutyVO.getCompanyId();
		String departmentId = atteExtDutyVO.getDepartmentId();
		String workHoursDay = atteExtDutyVO.getWorkHoursDay();

		Integer isClock = atteExtDutyVO.getIsClock();
		String isCompensationint = atteExtDutyVO.getIsCompensationint();

		// 调休最后有效日期
		String latestEffectDate = (Calendar.getInstance().get(Calendar.YEAR)+1)+"-"+ atteExtDutyVO.getLatestEffectDate();
		// 调休最后有效日期
		String unit = atteExtDutyVO.getUnit();


		//加班配置
		ExtraDutyConfig extraDutyConfig = new ExtraDutyConfig();

		ExtraDutyConfig extraDutyConfigItem = extraDutyConfigDao.findByCompanyIdAndDepartmentId(companyId, departmentId);

		Date now = new Date();
		if (null != extraDutyConfigItem){

			//公共
			extraDutyConfigItem.setUpdateDate(now);
			//参数更新
			extraDutyConfigItem.setCompanyId(companyId);
			extraDutyConfigItem.setDepartmentId(departmentId);
			extraDutyConfigItem.setWorkHoursDay(workHoursDay);
			extraDutyConfigItem.setIsClock(isClock);
			extraDutyConfigItem.setIsCompensationint(isCompensationint);
			extraDutyConfigDao.save(extraDutyConfigItem);
		}else {
			extraDutyConfig.setId(String.valueOf(idWorker.nextId()));
			extraDutyConfig.setCompanyId(companyId);
			extraDutyConfig.setDepartmentId(departmentId);
			extraDutyConfig.setWorkHoursDay(workHoursDay);
			extraDutyConfig.setIsClock(isClock);
			extraDutyConfig.setIsCompensationint(isCompensationint);
			extraDutyConfig.setCreateDate(now);
			extraDutyConfigDao.save(extraDutyConfig);
		}

		//配置规则处理
		ExtraDutyConfig cfg = extraDutyConfigDao.findByCompanyIdAndDepartmentId(companyId, departmentId);
		String extraDutyConfigId = cfg.getId();

		List<ExtraDutyRule> rules = atteExtDutyVO.getRules();

		//每次公司的加班规则都整体更新
		if (rules != null && !rules.isEmpty()){

			extraDutyRuleDao.deleteByExtraDutyConfigId(extraDutyConfigId);

			//指定数据
			for (ExtraDutyRule extraDutyRule: rules) {

				extraDutyRule.setId(String.valueOf(idWorker.nextId()));
				extraDutyRule.setExtraDutyConfigId(extraDutyConfigId);

			}

			extraDutyRuleDao.saveAll(rules);
		}

		//调休配置
		DayOffConfig dayOffConfigItem = dayOffConfigDao.findByCompanyIdAndDepartmentId(companyId, departmentId);

		DayOffConfig dayOffConfig = new DayOffConfig();
		dayOffConfig.setId(String.valueOf(idWorker.nextId()));

		dayOffConfig.setUnit(unit);
		dayOffConfig.setCompanyId(companyId);
		dayOffConfig.setDepartmentId(departmentId);
		dayOffConfig.setLatestEffectDate(latestEffectDate);

		if (null != dayOffConfigItem){
			dayOffConfigItem.setUnit(unit);
			dayOffConfigItem.setCompanyId(companyId);
			dayOffConfigItem.setDepartmentId(departmentId);
			dayOffConfigItem.setLatestEffectDate(latestEffectDate);
			dayOffConfigItem.setUpdateDate(now);
			dayOffConfigDao.save(dayOffConfigItem);
		}else{
			dayOffConfig.setCreateDate(now);
			dayOffConfigDao.save(dayOffConfig);
		}


	}


	public Map getExtWorkCfg(String companyId, String departmentId) {
		//返回值
		ExtWorkVO extWorkVO = new ExtWorkVO();
		ExtraDutyConfig extraDutyConfig = extraDutyConfigDao.findByCompanyIdAndDepartmentId(companyId, departmentId);
		List<ExtraDutyRule> extraDutyRules = extraDutyRuleDao.findByCompanyIdAndDepartmentId(companyId, departmentId);
		DayOffConfig dayOffConfig = dayOffConfigDao.findByCompanyIdAndDepartmentId(companyId, departmentId);
		extWorkVO.setExtraDutyConfig(extraDutyConfig);
		extWorkVO.setExtraDutyRuleList(extraDutyRules);
		extWorkVO.setDayOffConfigs(dayOffConfig);
		return BeanMapUtils.beanToMap(extWorkVO);
	}
}
