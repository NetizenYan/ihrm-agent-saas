FROM java:8
ADD  *.jar ihrm_salarys.jar
EXPOSE 9006
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_salarys.jar"]
