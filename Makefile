.PHONY: install build start stop restart deploy nginx-reload logs setup

PORT ?= 3002
PROJECT_DIR := /home/literategoggles/Projects/chebakov.family
SERVICE_NAME := chebakov-family
SERVICE_FILE := $(PROJECT_DIR)/deploy/$(SERVICE_NAME).service
LOG_FILE := $(PROJECT_DIR)/logs/server.log

install:
	cd $(PROJECT_DIR) && npm install

build:
	cd $(PROJECT_DIR) && npm run build

setup:
	sudo cp $(SERVICE_FILE) /etc/systemd/system/$(SERVICE_NAME).service
	sudo systemctl daemon-reload
	sudo systemctl enable $(SERVICE_NAME)
	@echo "Service installed and enabled"

start:
	sudo systemctl start $(SERVICE_NAME)

stop:
	sudo systemctl stop $(SERVICE_NAME)

restart:
	sudo systemctl restart $(SERVICE_NAME)

status:
	sudo systemctl status $(SERVICE_NAME)

nginx-reload:
	sudo nginx -t && sudo systemctl reload nginx

deploy: install build restart
	@echo "Deployment complete! Site available at https://chebakov.family"

logs:
	journalctl -u $(SERVICE_NAME) -f
