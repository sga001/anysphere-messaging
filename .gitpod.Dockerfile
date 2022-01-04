FROM gitpod/workspace-full

RUN sudo bash -c "$(wget -O - https://apt.llvm.org/llvm.sh)"
RUN sudo apt-get update && sudo apt-get install -y build-essential cmake valgrind doxygen graphviz ccache cppcheck libpq-dev

RUN brew install bazel && brew install buildifier && brew install grpcurl && brew tap hashicorp/tap && brew install hashicorp/tap/terraform
 
# RUN go install github.com/fullstorydev/grpcui/cmd/grpcui@latest

RUN echo 'export CC=clang' >> /home/gitpod/.bashrc
#RUN echo 'export CC=gcc' >> /home/gitpod/.bashrc

RUN echo 'export CCX=clang++' >> /home/gitpod/.bashrc
#RUN echo 'export CCX=g++' >> /home/gitpod/.bashrc

RUN git config --global alias.c commit && git config --global alias.s status && git config --global alias.p push && git config --global pull.ff only

RUN brew install fzf && $(brew --prefix)/opt/fzf/install

# install gcloud
RUN sudo apt-get install apt-transport-https ca-certificates gnupg && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg  add - && \
    apt-get update -y && \
    apt-get install google-cloud-sdk -y
# set up gcloud for docker
RUN gcloud auth configure-docker us-east1-docker.pkg.dev