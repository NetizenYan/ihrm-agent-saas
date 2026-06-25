FROM java:8
ADD  *.jar ihrm_social_securitys.jar
EXPOSE 9004
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_social_securitys.jar"]
