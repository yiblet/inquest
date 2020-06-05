# The binary to build (just the basename).
MODULE := backend

# Where to push the docker image.
REGISTRY ?= gcr.io/yiblet/inquest

IMAGE := $(REGISTRY)/$(MODULE)

# This version-strategy uses git tags to set the version string
TAG := $(shell git describe --tags --always --dirty)

BLUE='\033[0;34m'
NC='\033[0m' # No Color

run:
	@echo "unable to run"

test:
	@yarn test


build: 
	yarn run tsc

lint: lint-generated
	@yarn lint

lint-generated: SHELL:=/bin/bash
lint-generated: build
	diff <(python3 scripts/make_entities.py src/entities) src/entities/index.ts
	diff <(python3 scripts/make_resolvers.py src/resolvers) src/resolvers/index.ts
	diff <(yarn run --silent schema:js) schema.graphql

fix: fix-generated
	@yarn fix

fix-python-generated:
	python3 scripts/make_entities.py src/entities > src/entities/index.ts
	python3 scripts/make_resolvers.py src/resolvers > src/resolvers/index.ts

fix-generated: SHELL:=/bin/bash
fix-generated: python-generated build
	yarn run --silent codegen
	yarn run --silent schema:js > schema.graphql


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

push-latest: push 
	docker tag $(IMAGE):$(VERSION) $(IMAGE):latest
	@docker push $(IMAGE):latest

version:
	@echo $(TAG)

.PHONY: clean image-clean build-prod push test build python-generated

clean:
	rm -rf node_modules/

docker-clean:
	@docker system prune -f --filter "label=name=$(MODULE)"
