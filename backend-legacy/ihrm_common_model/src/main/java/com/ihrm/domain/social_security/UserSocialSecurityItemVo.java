package com.ihrm.domain.social_security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSocialSecurityItemVo implements Serializable {
    private static final long serialVersionUID = -7977005360444844711L;
    private String id;

    /**
     * 姓名
     */
    private String username;
    /**
     * 手机
     */
    private String mobile;
    /**
     * 工号
     */
    private String workNumber;
    /**
     * 部门名称
     */
    private String departmentName;
    /**
     * 入职时间
     */
    private String timeOfEntry;
    /**
     * 离职时间
     */
    private String leaveTime;
    /**
     * 参保城市id
     */
    private String participatingInTheCityId;
    /**
     * 参保城市名称
     */
    private String participatingInTheCity;

    /**
     * 社保基数
     */
    private Integer socialSecurityBase;
    /**
     * 公积金城市id
     */
    private String providentFundCityId;
    /**
     * 公积金城市名称
     */
    private String providentFundCity;
    /**
     * 公积金基数
     */
    private Integer providentFundBase;
}
