FROM java:8
ADD  *.jar ihrm_company.jar
EXPOSE 9001
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_company.jar"]
