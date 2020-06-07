# The binary to build (just the basename).
MODULE := inquest

# Where to push the docker image.
REGISTRY ?= gcr.io/yiblet/inquest

IMAGE := $(REGISTRY)/$(MODULE)

# This version-strategy uses git tags to set the version string
TAG := $(shell git describe --tags --always --dirty)

BLUE='\033[0;34m'
NC='\033[0m' # No Color

dist:
	poetry build

run:
	@python -m $(MODULE)

test:
	@pytest

fix:
	yapf -ir inquest

lint:
	@echo "\n${BLUE}Running yapf against source and test files...${NC}\n"
	@yapf -qr inquest
	@echo "\n${BLUE}Running Pylint against source and test files...${NC}\n"
	@pylint --rcfile=setup.cfg **/*.py

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
	sed -i 's/^version.*/version = "$(VERSION)"/g' pyproject.toml
	sed -i 's/^VERSION.*/VERSION = "$(VERSION)"/g' inquest/utils/version.py

# Example: make shell CMD="-c 'date > datefile'"
shell: build-dev
	@echo "\n${BLUE}Launching a shell in the containerized build environment...${NC}\n"
		@docker run                                                 \
			-ti                                                     \
			--rm                                                    \
			--entrypoint /bin/bash                                  \
			-u $$(id -u):$$(id -g)                                  \
			$(IMAGE):$(TAG)										    \
			$(CMD)

# Example: make push VERSION=0.0.2
push: build-prod
	@echo "\n${BLUE}Pushing image to GitHub Docker Registry...${NC}\n"
	@docker push $(IMAGE):$(VERSION)

version:
	@echo $(TAG)

.PHONY: clean image-clean build-prod push test

clean:
	rm -rf .pytest_cache .coverage .pytest_cache coverage.xml

docker-clean:
	@docker system prune -f --filter "label=name=$(MODULE)"
