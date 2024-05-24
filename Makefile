.ONESHELL:
.DEFAULT_GOAL := help

# allow user specific optional overrides
-include Makefile.overrides

export

.PHONY: help
help: ## show help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: ci
ci: ## run all ci commands
	@npm test
	@npm run lint
	@npm run fmt:check


.PHONY: ci-fix
ci-fix: ## run all ci commands but with fixes enabled
	@npm test
	@npm run lint:fix
	@npm run fmt

.PHONY: fmt
fmt:
	@npm run fmt

.PHONY: lint
lint:
	@npm run lint:fix
