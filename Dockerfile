FROM google/dart:2.7-dev AS dart-runtime

WORKDIR /app

ADD pubspec.* /app/
RUN pub get
ADD bin /app/bin/
RUN pub get --offline
RUN dart2native /app/bin/main.dart -o /app/server

FROM frolvlad/alpine-glibc:alpine-3.9_glibc-2.29

COPY --from=dart-runtime /app/server /server

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

ENTRYPOINT ["/server"]
