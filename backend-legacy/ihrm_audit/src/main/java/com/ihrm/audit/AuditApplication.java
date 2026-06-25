package com.ihrm.audit;

import com.alibaba.fastjson.serializer.SerializerFeature;
import com.alibaba.fastjson.serializer.SimplePropertyPreFilter;
import com.alibaba.fastjson.support.config.FastJsonConfig;
import com.alibaba.fastjson.support.spring.FastJsonHttpMessageConverter;
import com.ihrm.common.utils.IdWorker;
import com.ihrm.common.utils.JwtUtils;
import io.sentry.Sentry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.HandlerExceptionResolver;

//1.配置springboot的包扫描
@SpringBootApplication(scanBasePackages = "com.ihrm",exclude ={ SecurityAutoConfiguration.class} )
//2.配置jpa注解的扫描
@EntityScan(value="com.ihrm.domain")
//3.注册到eureka
@EnableEurekaClient
@EnableDiscoveryClient
@EnableFeignClients
public class AuditApplication {

    /**
     * 启动方法
     */
    public static void main(String[] args) {
	    Sentry.init("http://0641be2867664b0daed5c615b7a398a6@sentry.itheima.net/16");
        SpringApplication.run(AuditApplication.class,args);
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

	/**
	 * 为了解决activiti对象转化json的问题
	 *      通过自定义json转化器的形式完成
	 *          通过使用fastjson替换默认的jackson转化json数据
	 *          在转化器中过滤了identityLinks属性
	 */
	@Bean
	public HttpMessageConverters fastJsonHttpMessageConverters() {
		FastJsonHttpMessageConverter fjc = new FastJsonHttpMessageConverter();
		FastJsonConfig config = new FastJsonConfig();
		config.setSerializerFeatures(SerializerFeature.PrettyFormat);
		SimplePropertyPreFilter filter = new SimplePropertyPreFilter();
		filter.getExcludes().add("identityLinks");
		config.setSerializeFilters(filter);
		fjc.setFastJsonConfig(config);
		HttpMessageConverter<?> converter = fjc;
		return new HttpMessageConverters(converter);
	}

}
