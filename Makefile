# The binary to build (just the basename).
MODULE := inquest

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
	@make -C probe test

lint:
	@make -C probe lint

# Example: make build-prod VERSION=1.0.0
build-prod:
	@make -C probe build-prod


build-dev:
	@make -C probe build-dev

# Example: make shell CMD="-c 'date > datefile'"
shell: build-dev
	@make -C probe shell

# Example: make push VERSION=0.0.2
push: build-prod
	@make -C probe push

version:
	@echo $(TAG)

.PHONY: clean image-clean build-prod push test

clean:
	rm -rf .pytest_cache .coverage .pytest_cache coverage.xml

docker-clean:
	@make -C probe docker-clean
