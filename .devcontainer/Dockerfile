FROM node:lts-slim

RUN apt-get update
RUN apt-get install -y \
    git \
    openjdk-17-jdk \
    sdkmanager \
    android-sdk
RUN rm -rf /var/lib/apt/lists/*

RUN npm install -g @capacitor/cli

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="$PATH:$ANDROID_HOME/platform-tools/"
ENV PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin/"

RUN mkdir -p $ANDROID_HOME && \
    chown node $ANDROID_HOME

RUN yes | sdkmanager --licenses
RUN sdkmanager "platform-tools" "tools"

WORKDIR /workspace
CMD ["/bin/bash"]
