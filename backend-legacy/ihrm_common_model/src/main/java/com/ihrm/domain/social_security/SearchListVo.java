package com.ihrm.domain.social_security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchListVo implements Serializable {
    private static final long serialVersionUID = -8247920133289436000L;
    /**
     * 页码
     */
    private Integer page;
    /**
     * 页尺寸
     */
    private Integer pageSize;
    /**
     * 关键词
     */
    private String keyword;
    /**
     * 选中部门列表
     */
    private List<String> departmentChecks;
    /**
     * 选中公积金城市列表
     */
    private List<String> providentFundChecks;
    /**
     * 选中参保城市列表
     */
    private List<String> socialSecurityChecks;
}
