# Kkondeokji Design

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-kkondeokji-design-git-main-ysh616s-projects.vercel.app/)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/J6ZamBrMGwe)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://v0-kkondeokji-design-git-main-ysh616s-projects.vercel.app/](https://v0-kkondeokji-design-git-main-ysh616s-projects.vercel.app/)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/J6ZamBrMGwe](https://v0.dev/chat/projects/J6ZamBrMGwe)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## 세션 관리

이 프로젝트는 강화된 세션 관리 시스템을 사용합니다:

- ✅ **멀티 디바이스 지원**: 여러 기기에서 로그인해도 세션 충돌 없음
- ✅ **자동 세션 정리**: 로그인/로그아웃 시 완전한 세션 초기화
- ✅ **탭 간 동기화**: 한 탭에서 로그아웃하면 모든 탭 동기화
- ✅ **자동 재검증**: 페이지 포커스 시 세션 자동 확인

자세한 내용은 [세션 관리 가이드](./docs/SESSION_MANAGEMENT.md)를 참조하세요.

### 개발 시 유용한 명령어

```typescript
// 세션 디버그 정보 출력 (개발 환경)
import { debugSession } from '@/lib/session-manager';
await debugSession();
```
