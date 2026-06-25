package com.ihrm.system;

import com.ihrm.common.utils.IdWorker;
import com.ihrm.common.utils.JwtUtils;
import io.sentry.Sentry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

//1.配置springboot的包扫描
@SpringBootApplication(scanBasePackages = "com.ihrm")
//2.配置jpa注解的扫描
@EntityScan(value="com.ihrm.domain.system")
@EnableEurekaClient
@EnableDiscoveryClient
@EnableFeignClients
public class SystemApplication {
    /**
     * 启动方法
     */
    public static void main(String[] args) {
	    Sentry.init("http://0641be2867664b0daed5c615b7a398a6@sentry.itheima.net/16");
	    SpringApplication.run(SystemApplication.class, args);
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
    public IdWorker idWorker() {
        return new IdWorker();
    }

    @Bean
    public JwtUtils jwtUtils() {
        return new JwtUtils();
    }

    //解决no session
    @Bean
    public OpenEntityManagerInViewFilter openEntityManagerInViewFilter() {
        return new OpenEntityManagerInViewFilter();
    }

}
