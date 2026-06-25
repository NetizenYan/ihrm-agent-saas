package com.ihrm.demo;

import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Date;

public class CreateJwtTest {

    /**
     * 通过jjwt创建token。示例签名 key 从环境变量读取，避免在源码中固定密钥。
     */
    public static void main(String[] args) {
        String key = System.getenv("IHRM_JWT_DEMO_KEY");
        if (key == null || key.trim().isEmpty()) {
            System.out.println("IHRM_JWT_DEMO_KEY is not set; skip demo token creation.");
            return;
        }

        JwtBuilder jwtBuilder = Jwts.builder().setId("demo-user")
                .setSubject("demo-subject")
                .setIssuedAt(new Date())
                .signWith(SignatureAlgorithm.HS256, key)
                .claim("companyId","demo-company")
                .claim("companyName","demo-company-name");
        String token = jwtBuilder.compact();
        System.out.println(token);
    }
}
