FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
WORKDIR /app
COPY --from=build /app/target/billing-service-*.jar /app/app.jar
ENV PORT=8080 SERVICE_NAME=billing-service
USER appuser
EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]
