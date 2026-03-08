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
	@echo "Starting server on port $(PORT)..."
	@cd $(PROJECT_DIR) && \
	nohup npm run start -- -p $(PORT) > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE)
	@sleep 3
	@if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$(PORT) | grep -q "200"; then \
		echo "Server started successfully (PID: $$(cat $(PID_FILE)))"; \
	else \
		echo "Failed to start server. Check $(LOG_FILE)"; \
		cat $(LOG_FILE) | tail -10; \
		exit 1; \
	fi

stop:
	@echo "Stopping server..."
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
	fi
	@fuser -k $(PORT)/tcp 2>/dev/null || true
	@sleep 1
	@echo "Server stopped"

restart: stop start

nginx-reload:
	sudo nginx -t && sudo systemctl reload nginx

deploy: install build restart nginx-reload
	@echo "Deployment complete! Site available at https://chebakov.family"

logs:
	tail -f $(LOG_FILE)
