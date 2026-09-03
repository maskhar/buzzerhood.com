# CI/CD Deployment Guide - Step by Step

## Overview

Dokumen ini menjelaskan langkah-langkah deployment Buzzerhood menggunakan GitHub Actions untuk CI/CD automation.

---

## Prerequisites

### 1. GitHub Repository Setup

- [ ] Repository: `https://github.com/yourusername/buzzerhood`
- [ ] Branch strategy: `main` (production), `develop` (staging)
- [ ] Protected branches configured

### 2. Server Requirements

**Production Server**:
- OS: Ubuntu 20.04 / 22.04
- Docker & Docker Compose installed
- Domain: `dev-buzzerhood.carubra.com`
- SSL Certificate configured

**Specifications**:
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 20GB+

### 3. GitHub Secrets Configuration

Navigate to: `Repository Settings → Secrets and variables → Actions`

**Required Secrets**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_HOST` | Server IP/hostname | `20.20.20.173` |
| `SSH_USER` | SSH username | `maskhar` |
| `SSH_PRIVATE_KEY` | SSH private key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your-secure-password` |
| `JWT_PRIVATE_KEY` | JWT signing key | `-----BEGIN PRIVATE KEY-----...` |
| `JWT_PUBLIC_KEY` | JWT public key | `-----BEGIN PUBLIC KEY-----...` |

---

## Deployment Workflow Steps

1. Push code ke GitHub
2. GitHub Actions triggered
3. Run tests
4. Build Docker images
5. Deploy ke production server
6. Run health checks
7. Notify success/failure

---

**Created**: 2026-09-03  
**Version**: 1.0
