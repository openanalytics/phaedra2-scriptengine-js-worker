FROM registry.openanalytics.eu/proxy/library/node:21
WORKDIR /usr/app

ENV PH2_IMAGING_LIB /usr/app/ph2-imaging.jar
ADD https://nexus.openanalytics.eu/service/rest/v1/search/assets/download?repository=snapshots&group=eu.openanalytics.phaedra&name=phaedra2-imaging&maven.extension=jar&maven.classifier=exec&sort=version $PH2_IMAGING_LIB

RUN apt install -y wget apt-transport-https gpg
RUN wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor | tee /etc/apt/trusted.gpg.d/adoptium.gpg > /dev/null
RUN echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list

RUN apt update && \
    apt install --no-install-recommends -y imagemagick temurin-21-jdk
ENV IM_IDENTIFY_EXEC identify

RUN mkdir libs
RUN java -jar /usr/app/ph2-imaging.jar copylibs -d /usr/app/libs
ENV LD_LIBRARY_PATH /usr/app/libs

ENV NODE_OPTIONS="--max-old-space-size=16384"

COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "src/app.js" ]