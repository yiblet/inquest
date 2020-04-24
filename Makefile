# The binary to build (just the basename).
MODULE := inquest

# Where to push the docker image.
REGISTRY ?= gcr.io/yiblet/inquest

IMAGE := $(REGISTRY)/$(MODULE)

# This version-strategy uses git tags to set the version string
TAG := $(shell git describe --tags --always --dirty)

run:
	@echo "unable to run"

test:
	@make -C probe test
	@make -C backend test

lint:
	@make -C probe lint
	@make -C backend lint

# Example: make build-prod VERSION=1.0.0
build-prod:
	@make -C probe build-prod
	@make -C backend build-prod


build-dev:
	@make -C probe build-dev
	@make -C backend build-dev

# Example: make shell CMD="-c 'date > datefile'"
shell: build-dev
	@make -C probe shell
	@make -C backend shell

# Example: make push VERSION=0.0.2
push: build-prod
	@make -C probe push
	@make -C backend push

dev-frontend:
	@(cd frontend; yarn run dev)

dev-backend:
	@(cd backend; yarn run start)


version:
	@echo $(TAG)

.PHONY: clean image-clean build-prod push test

clean:
	rm -rf .pytest_cache .coverage .pytest_cache coverage.xml

docker-clean:
	@make -C probe docker-clean
	@make -C backend docker-clean
