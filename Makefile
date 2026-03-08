.PHONY: install build start stop restart deploy nginx-reload logs

PORT ?= 3002
PROJECT_DIR := /home/literategoggles/Projects/chebakov.family
PID_FILE := $(PROJECT_DIR)/server.pid
LOG_FILE := $(PROJECT_DIR)/logs/server.log

install:
	cd $(PROJECT_DIR) && npm install

build:
	cd $(PROJECT_DIR) && npm run build

start:
	@mkdir -p $(PROJECT_DIR)/logs
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Server already running (PID: $$(cat $(PID_FILE)))"; \
	else \
		cd $(PROJECT_DIR) && \
		nohup npm run start -- -p $(PORT) > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE); \
		sleep 2; \
		if kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
			echo "Server started on port $(PORT) (PID: $$(cat $(PID_FILE)))"; \
		else \
			echo "Failed to start server. Check $(LOG_FILE)"; \
			exit 1; \
		fi \
	fi

stop:
	@if [ -f $(PID_FILE) ]; then \
		if kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
			kill $$(cat $(PID_FILE)); \
			rm -f $(PID_FILE); \
			echo "Server stopped"; \
		else \
			rm -f $(PID_FILE); \
			echo "PID file exists but process not running, cleaned up"; \
		fi \
	else \
		echo "No server running (no PID file)"; \
	fi

restart: stop start

nginx-reload:
	sudo nginx -t && sudo systemctl reload nginx

deploy: install build restart nginx-reload
	@echo "Deployment complete! Site available at https://chebakov.family"

logs:
	tail -f $(LOG_FILE)
