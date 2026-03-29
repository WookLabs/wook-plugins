# GLM 모드 활성화

현재 프로젝트를 Z.AI GLM-5.1 모드로 전환한다.

## 절차

1. `~/.env` 파일에서 `ZAI_API_KEY` 값을 읽는다. 파일이 없거나 키가 없으면 사용자에게 알리고 중단한다.

2. 현재 프로젝트의 `.claude/settings.json`을 읽는다. 파일이 없으면 새로 생성한다.

3. `env` 객체에 다음 키를 추가/덮어쓴다:

```json
{
  "ANTHROPIC_AUTH_TOKEN": "<ZAI_API_KEY 값>",
  "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
  "API_TIMEOUT_MS": "3000000",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
}
```

4. 기존 `env`의 다른 키는 보존한다. `env` 외의 다른 설정도 보존한다.

5. 파일을 저장한다.

6. 사용자에게 결과를 보고한다:

```
✅ GLM 모드 활성화 완료
   Provider: Z.AI (api.z.ai)
   Models: Opus/Sonnet → GLM-5.1, Haiku → GLM-4.5-Air
   설정 파일: .claude/settings.json
   ⚠️ 새 터미널을 열거나 /reload 해야 적용됩니다.
```
