FROM java:8
ADD  *.jar ihrm_attendance.jar
EXPOSE 9005
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_attendance.jar"]
