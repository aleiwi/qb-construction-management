# QB - Makefile for local and free deployment
.PHONY: help install dev build test docker gh-pages clean

help:
	@echo "QB Construction Management - Make targets"
	@echo "  make install     - Install backend + frontend deps"
	@echo "  make dev         - Run backend + frontend locally"
	@echo "  make build       - Build frontend (local)"
	@echo "  make build-pages - Build frontend for GitHub Pages"
	@echo "  make test        - Run backend + frontend tests"
	@echo "  make docker      - Build and run Docker stack (local)"
	@echo "  make gh-pages    - Build and push to gh-pages branch"
	@echo "  make clean       - Clean build artifacts"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm ci

dev:
	@echo "Run in two terminals:"
	@echo "  cd backend && uvicorn app.main:app --reload"
	@echo "  cd frontend && npm run dev"

build:
	cd frontend && npm run build

build-pages:
	cd frontend && VITE_GH_PAGES=true npm run build && cp dist/index.html dist/404.html && touch dist/.nojekyll

test:
	cd backend && python -m pytest -v
	cd frontend && npm run test

docker:
	docker compose up -d --build
	@echo "Frontend: http://localhost:8080"
	@echo "Backend: http://localhost:8000/docs"

gh-pages: build-pages
	powershell -ExecutionPolicy Bypass -File scripts/free-deploy.ps1

clean:
	rm -rf frontend/dist frontend/node_modules/.vite
	rm -rf backend/__pycache__ backend/.pytest_cache
	find backend -name "*.pyc" -delete
