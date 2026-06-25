package com.ihrm.demo;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

public class ParseJwtTest {

    /**
     * 解析jwtToken字符串。示例 token/key 从环境变量读取，避免在源码中固定凭证。
     */
    public static void main(String[] args) {
        String token = System.getenv("IHRM_JWT_DEMO_TOKEN");
        String key = System.getenv("IHRM_JWT_DEMO_KEY");
        if (token == null || token.trim().isEmpty() || key == null || key.trim().isEmpty()) {
            System.out.println("IHRM_JWT_DEMO_TOKEN or IHRM_JWT_DEMO_KEY is not set; skip demo token parsing.");
            return;
        }

        Claims claims = Jwts.parser().setSigningKey(key).parseClaimsJws(token).getBody();

        //私有数据存放在claims
        System.out.println(claims.getId());
        System.out.println(claims.getSubject());
        System.out.println(claims.getIssuedAt());

        //解析自定义claim中的内容
        String companyId = (String)claims.get("companyId");
        String companyName = (String)claims.get("companyName");

        System.out.println(companyId + "---" + companyName);
    }
}
