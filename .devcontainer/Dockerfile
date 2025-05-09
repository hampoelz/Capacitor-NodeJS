FROM debian:latest

RUN apt-get update
RUN apt-get install -y \
    git \
    vim \
    sdkmanager \
    android-sdk
RUN rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="$PATH:$ANDROID_HOME/platform-tools/"
ENV PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin/"

RUN mkdir -p $ANDROID_HOME

RUN yes | sdkmanager --licenses
RUN sdkmanager "platform-tools" "tools"
