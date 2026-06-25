package com.ihrm.domain.social_security;

import com.ihrm.domain.system.City;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSocialSecurityVo implements Serializable {
    private static final long serialVersionUID = -8159761281782335447L;
    /**
     * 用户名称
     */
    private String fullName;
    /**
     * 在职状态
     */
    private Integer onTheJob;
    /**
     * 最新工资基数
     */
    private String salaryBase;
    /**
     * 入职时间
     */
    private String dateOfEntry;
    /**
     * 身份证号
     */
    private String idNumber;
    /**
     * 本月是否缴纳社保 0为不缴纳 1为缴纳
     */
    private Integer enterprisesPaySocialSecurityThisMonth;
    /**
     * 本月是否缴纳公积金 0为不缴纳 1为缴纳
     */
    private Integer enterprisesPayTheProvidentFundThisMonth;
    /**
     * 参保城市
     */
    private City participatingInTheCity;

    /**
     * 参保类型  1为首次开户 2为非首次开户
     */
    private Integer socialSecurityType;

    /**
     * 户籍类型 1为本市城镇 2为本市农村 3为外埠城镇 4为外埠农村
     */
    private Integer householdRegistrationType;

    /**
     * 社保基数
     */
    private Integer socialSecurityBase;

    /**
     * 工伤比例
     */
    private BigDecimal industrialInjuryRatio;

    /**
     * 社保备注
     */
    private String socialSecurityNotes;
    /**
     * 公积金城市
     */
    private City providentFundCity;
    /**
     * 公积金基数
     */
    private Integer providentFundBase;
    /**
     * 公积金企业比例
     */
    private BigDecimal enterpriseProportion;
    /**
     * 公积金个人比例
     */
    private BigDecimal personalProportion;
    /**
     * 公积金企业缴纳数额
     */
    private BigDecimal enterpriseProvidentFundPayment;
    /**
     * 公积金个人缴纳数额
     */
    private BigDecimal personalProvidentFundPayment;
}
