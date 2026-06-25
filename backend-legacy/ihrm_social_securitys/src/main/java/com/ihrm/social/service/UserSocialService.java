package com.ihrm.social.service;

import com.ihrm.common.entity.PageResult;
import com.ihrm.domain.social_security.UserSocialSecurity;
import com.ihrm.domain.social_security.UserSocialSecurityItem;
import com.ihrm.social.dao.UserSocialSecurityDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.awt.image.RenderedImage;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class UserSocialService {

	@Autowired
	private EntityManager entityManager;
	
    @Autowired
    private UserSocialSecurityDao userSocialSecurityDao;

    //分页查询用户的社保数据
	public PageResult findAll(Integer page, Integer pageSize, String companyId) {
		//需要借助feign调用远程微服务获取用户数据
		//查询社保表获取社保信息
		Page page1 = userSocialSecurityDao.findPage(companyId, new PageRequest(page - 1, pageSize));
		return new PageResult(page1.getTotalElements(),page1.getContent());
	}

	//根据id查询
	public UserSocialSecurity findById(String id) {
		Optional<UserSocialSecurity> optional = userSocialSecurityDao.findById(id);
		return optional.isPresent()? optional.get() : null;
	}

	public void save(UserSocialSecurity uss) {
		userSocialSecurityDao.save(uss);
	}

	public Page<UserSocialSecurityItem> findAll(Integer page, Integer pageSize, String companyId, List<String> departments, List<String> socialSecurityCities, List<String> providentFundCities) {
		StringBuilder sqlBuilder = new StringBuilder();
		sqlBuilder.append("select bu.id,bu.username,bu.mobile,bu.work_number,bu.department_name,bu.time_of_entry,NULL AS leave_time,ssuss.participating_in_the_city_id,ssuss.participating_in_the_city,ssuss.provident_fund_city_id,ssuss.provident_fund_city,ssuss.social_security_base,ssuss.provident_fund_base from bs_user bu LEFT JOIN ss_user_social_security ssuss ON bu.id=ssuss.user_id WHERE bu.company_id = :companyId");
		StringBuilder countBuilder = new StringBuilder();
		countBuilder.append("select count(*) from bs_user bu LEFT JOIN ss_user_social_security ssuss ON bu.id=ssuss.user_id WHERE bu.company_id = :companyId");
		//添加部门动态条件
		if (departments != null && departments.size() > 0) {
			StringBuilder builder = getSelectCondition("bu.department_id", departments);
			sqlBuilder.append(builder);
			countBuilder.append(builder);
		}
		//添加社保城市动态条件
		if (socialSecurityCities != null && socialSecurityCities.size() > 0) {
			StringBuilder builder = getSelectCondition("ssuss.participating_in_the_city_id", socialSecurityCities);
			sqlBuilder.append(builder);
			countBuilder.append(builder);
		}
		//添加公积金城市动态条件
		if (providentFundCities != null && providentFundCities.size() > 0) {
			StringBuilder builder = getSelectCondition("ssuss.provident_fund_city_id", providentFundCities);
			sqlBuilder.append(builder);
			countBuilder.append(builder);
		}
		//添加分页条件
		if (page==null){
			page=1;
		}
		if (pageSize==null){
			pageSize=Integer.MAX_VALUE;
		}
		sqlBuilder.append(" LIMIT " + (page - 1) * pageSize + "," + pageSize);
		Query dataQuery = entityManager.createNativeQuery(sqlBuilder.toString(), UserSocialSecurityItem.class);
		dataQuery.setParameter("companyId", companyId);
		List<UserSocialSecurityItem> resultList = dataQuery.getResultList();
		Query countQuery = entityManager.createNativeQuery(countBuilder.toString());
		countQuery.setParameter("companyId", companyId);
		Number total = (Number) countQuery.getSingleResult();
		Pageable pageable = PageRequest.of(page - 1, pageSize);
		Page<UserSocialSecurityItem> userSocialSecurityItemPage = new PageImpl<UserSocialSecurityItem>(resultList, pageable, total.longValue());
		return userSocialSecurityItemPage;
	}

	private StringBuilder getSelectCondition(String field, List<String> dataList) {
		StringBuilder subSqlBuilder = new StringBuilder();
		subSqlBuilder.append(" AND " + field + " in (");
		AtomicInteger index = new AtomicInteger(0);
		dataList.forEach(did -> {
			if (index.get() == 0) {
				subSqlBuilder.append("'" + did + "'");
			} else {
				subSqlBuilder.append(",'" + did + "'");
			}
			index.incrementAndGet();
		});
		subSqlBuilder.append(")");
		return subSqlBuilder;
	}
}
