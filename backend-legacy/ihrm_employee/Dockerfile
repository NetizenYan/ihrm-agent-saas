FROM java:8
ADD  *.jar ihrm_employee.jar
EXPOSE 9003
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_employee.jar"]
