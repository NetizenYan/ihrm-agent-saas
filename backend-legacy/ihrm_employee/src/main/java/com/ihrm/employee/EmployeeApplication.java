package com.ihrm.employee;

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


@SpringBootApplication(scanBasePackages = "com.ihrm")
@EntityScan("com.ihrm.domain.employee")
@EnableEurekaClient
public class EmployeeApplication {

    public static void main(String[] args) {
	    Sentry.init("http://0641be2867664b0daed5c615b7a398a6@sentry.itheima.net/16");
        SpringApplication.run(EmployeeApplication.class, args);
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
    public IdWorker idWorkker() {
        return new IdWorker(1, 1);
    }

    @Bean
    public JwtUtils jwtUtil() {
        return new JwtUtils();
    }
}