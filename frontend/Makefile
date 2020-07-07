# The binary to build (just the basename).
MODULE := frontend

# Where to push the docker image.
REGISTRY ?= gcr.io/yiblet/inquest

IMAGE := $(REGISTRY)/$(MODULE)

# This version-strategy uses git tags to set the version string
TAG := $(shell git describe --tags --always --dirty)

BLUE='\033[0;34m'
NC='\033[0m' # No Color

run:
	yarn run dev

test:
	@yarn test

build:
	yarn run tsc

lint:
	@yarn lint


fix:
	@yarn fix


# Example: make build-prod VERSION=1.0.0
build-prod:
	@echo "\n${BLUE}Building Production image with labels:\n"
	@echo "name: $(MODULE)"
	@echo "version: $(VERSION)${NC}\n"
	@sed                                     \
	    -e 's|{NAME}|$(MODULE)|g'            \
	    -e 's|{VERSION}|$(VERSION)|g'        \
	    docker/prod.Dockerfile | docker build -t $(IMAGE):$(VERSION) -f- .


build-dev:
	@echo "\n${BLUE}Building Development image with labels:\n"
	@echo "name: $(MODULE)"
	@echo "version: $(TAG)${NC}\n"
	@sed                                 \
	    -e 's|{NAME}|$(MODULE)|g'        \
	    -e 's|{VERSION}|$(TAG)|g'        \
	    docker/dev.Dockerfile | docker build -t $(IMAGE):$(TAG) -f- .

set-version:
	# sed 's/"version".*/"version": "$(VERSION)",/g' -i package.json

# Example: make shell CMD="-c 'date > datefile'"
shell: build-dev
	@echo "\n${BLUE}Launching a shell in the containerized build environment...${NC}\n"
		@docker run                                                 \
			-ti                                                     \
			--rm                                                    \
			--entrypoint /bin/bash                                  \
			$(IMAGE):$(TAG)										    \
			$(CMD)

# Example: make push VERSION=0.0.2
push: build-prod
	@echo "\n${BLUE}Pushing image to GitHub Docker Registry...${NC}\n"
	@docker push $(IMAGE):$(VERSION)

push-latest: push
	docker tag $(IMAGE):$(VERSION) $(IMAGE):latest
	@docker push $(IMAGE):latest

version:
	@echo $(TAG)

.PHONY: clean image-clean build-prod push test build set-version

clean:
	rm -rf node_modules/

docker-clean:
	@docker system prune -f --filter "label=name=$(MODULE)"
