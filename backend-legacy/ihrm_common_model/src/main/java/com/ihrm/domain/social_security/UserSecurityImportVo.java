package com.ihrm.domain.social_security;

import com.ihrm.domain.poi.ExcelAttribute;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSecurityImportVo {
    /**
     * 手机号
     */
    @ExcelAttribute(sort = 0)
    private String mobile;
    /**
     * 姓名
     */
    @ExcelAttribute(sort = 1)
    private String username;
    /**
     * 在职状态
     */
    @ExcelAttribute(sort = 2)
    private String workStatus;
    /**
     * 参保城市
     */
    @ExcelAttribute(sort = 3)
    private String participatingInTheCity;
    /**
     * 公积金城市
     */
    @ExcelAttribute(sort = 4)
    private String providentFundCity;
    /**
     * 社保类型
     */
    @ExcelAttribute(sort = 5)
    private String socialSecurityType;
    /**
     * 户籍类型
     */
    @ExcelAttribute(sort = 6)
    private String householdRegistrationType;
    /**
     * 社保基数
     */
    @ExcelAttribute(sort = 7)
    private Double socialSecurityBase;
    /**
     * 社保企业
     */
    @ExcelAttribute(sort = 8)
    private Double socialSecurityCompanyBase;
    /**
     * 社保个人
     */
    @ExcelAttribute(sort = 9)
    private Double socialSecurityPersonalBase;
    /**
     * 公积金基数
     */
    @ExcelAttribute(sort = 10)
    private Double providentFundBase;
    /**
     * 公积金企业
     */
    @ExcelAttribute(sort = 11)
    private Double providentFundCompanyBase;
    /**
     * 公积金个人
     */
    @ExcelAttribute(sort = 12)
    private Double providentFundPersonalBase;
    /**
     * 养老企业
     */
    @ExcelAttribute(sort = 13)
    private Double pensionCompany;
    /**
     * 养老个人
     */
    @ExcelAttribute(sort = 14)
    private Double pensionPersonal;
    /**
     * 医疗企业
     */
    @ExcelAttribute(sort = 15)
    private Double medicalCompany;
    /**
     * 医疗个人
     */
    @ExcelAttribute(sort = 16)
    private Double medicalPersonal;
    /**
     * 失业企业
     */
    @ExcelAttribute(sort = 17)
    private Double unemploymentCompany;
    /**
     * 失业个人
     */
    @ExcelAttribute(sort = 18)
    private Double unemploymentPersonal;
    /**
     * 工伤企业
     */
    @ExcelAttribute(sort = 19)
    private Double workInjuryCompany;
    /**
     * 生育企业
     */
    @ExcelAttribute(sort = 20)
    private Double fertilityCompany;
    /**
     * 大病企业
     */
    @ExcelAttribute(sort = 21)
    private Double seriousIllnessCompany;
    /**
     * 大病个人
     */
    @ExcelAttribute(sort = 22)
    private Double seriousIllnessPersonal;
}
