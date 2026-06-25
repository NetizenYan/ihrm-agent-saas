FROM java:8
ADD  *.jar ihrm_system.jar
EXPOSE 9002
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_system.jar"]
