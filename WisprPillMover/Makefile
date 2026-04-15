.PHONY: build run clean release install uninstall

APP_NAME    := WisprPillMover
BUILD_DIR   := .build
INSTALL_DIR := /usr/local/bin

# ── Development ──────────────────────────────────────────────

build:
	swift build

run: build
	$(BUILD_DIR)/debug/$(APP_NAME)

# ── Release ──────────────────────────────────────────────────

release:
	swift build -c release

install: release
	@mkdir -p $(INSTALL_DIR)
	cp $(BUILD_DIR)/release/$(APP_NAME) $(INSTALL_DIR)/$(APP_NAME)
	@echo "Installed to $(INSTALL_DIR)/$(APP_NAME)"
	@echo "Run '$(APP_NAME)' from any terminal, or add it to Login Items."

uninstall:
	rm -f $(INSTALL_DIR)/$(APP_NAME)
	@echo "Removed $(INSTALL_DIR)/$(APP_NAME)"

# ── Housekeeping ─────────────────────────────────────────────

clean:
	swift package clean
	rm -rf $(BUILD_DIR)
