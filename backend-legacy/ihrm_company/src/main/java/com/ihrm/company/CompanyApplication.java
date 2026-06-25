package com.ihrm.company;

import com.ihrm.common.utils.IdWorker;
import com.ihrm.common.utils.JwtUtils;
import io.sentry.Sentry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.HandlerExceptionResolver;

//1.配置springboot的包扫描
@SpringBootApplication(scanBasePackages = "com.ihrm")
//2.配置jpa注解的扫描
@EntityScan(value="com.ihrm.domain.company")
//3.注册到eureka
@EnableEurekaClient
public class CompanyApplication {

    /**
     * 启动方法
     */
    public static void main(String[] args) {
	    Sentry.init("http://0641be2867664b0daed5c615b7a398a6@sentry.itheima.net/16");
        SpringApplication.run(CompanyApplication.class,args);
    }

	@Bean
	public HandlerExceptionResolver sentryExceptionResolver() {
		return new io.sentry.spring.SentryExceptionResolver();
	}

	@Bean
	public ServletContextInitializer sentryServletContextInitializer() {
		return new io.sentry.spring.SentryServletContextInitializer();
	}

    @Bean
    public JwtUtils jwtUtils() {
        return new JwtUtils();
    }
    @Bean
    public IdWorker idWorker() {
        return new IdWorker();
    }
}
