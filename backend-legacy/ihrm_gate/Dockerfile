FROM java:8
ADD  *.jar ihrm_gate.jar
ENTRYPOINT ["java","-Xmx256m","-jar","-Dspring.config.location=/data/application-pro.yml","ihrm_gate.jar"]
