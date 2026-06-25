package com.ihrm.gate.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {


	@Autowired
	private Environment env;

	@GetMapping("/test")
	public String test() {

		String temp = env.getProperty("eureka.client.service-url.defaultZone")+"---"+env.getProperty("server.port");


		return temp;
	}

}
