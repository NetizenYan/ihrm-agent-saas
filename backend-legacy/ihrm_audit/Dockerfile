FROM java:8
ADD  *.jar ihrm_audit.jar
EXPOSE 9007
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_audit.jar"]
