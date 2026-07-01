# GLM 모드 활성화

현재 프로젝트를 Z.AI GLM 최신 모드로 전환한다. 모델 버전을 하드코딩하지 않고, 실행 시점에 Z.AI 공식 문서에서 최신 권장값을 조회한다.

## 절차

1. `~/.env` 파일에서 `ZAI_API_KEY` 값을 읽는다. 파일이 없거나 키가 없으면 사용자에게 알리고 중단한다.

2. WebFetch로 `https://docs.z.ai/devpack/tool/claude` 문서를 조회하여, Claude Code 연동 섹션에 명시된 다음 값을 추출한다:
   - `ANTHROPIC_DEFAULT_OPUS_MODEL` 권장값
   - `ANTHROPIC_DEFAULT_SONNET_MODEL` 권장값
   - `ANTHROPIC_DEFAULT_HAIKU_MODEL` 권장값

   조회에 실패하거나(네트워크 오류 등) 문서에서 세 값을 명확히 추출할 수 없으면, GLM 모드로 전환하지 않고 사용자에게 다음과 같이 알린 뒤 중단한다:

   ```
   ⚠️ Z.AI 공식 문서(docs.z.ai/devpack/tool/claude)에서 최신 모델 정보를 가져오지 못했습니다.
      문서를 직접 확인한 뒤 다시 시도해주세요.
   ```

3. 현재 프로젝트의 `.claude/settings.json`을 읽는다. 파일이 없으면 새로 생성한다.

4. `env` 객체에 다음 키를 추가/덮어쓴다 (아래 `<...>` 값은 2단계에서 조회한 실제 모델명으로 치환):

```json
{
  "ANTHROPIC_AUTH_TOKEN": "<ZAI_API_KEY 값>",
  "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
  "API_TIMEOUT_MS": "3000000",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "<조회된 Opus 권장 모델명>",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "<조회된 Sonnet 권장 모델명>",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "<조회된 Haiku 권장 모델명>"
}
```

5. 기존 `env`의 다른 키는 보존한다. `env` 외의 다른 설정도 보존한다.

6. 파일을 저장한다.

7. 사용자에게 결과를 보고한다 (모델명은 실제 조회된 값으로 표시):

```
✅ GLM 모드 활성화 완료
   Provider: Z.AI (api.z.ai)
   Models: Opus/Sonnet → <조회된 Sonnet 모델명>, Haiku → <조회된 Haiku 모델명>
   설정 파일: .claude/settings.json
   ⚠️ 새 터미널을 열거나 /reload 해야 적용됩니다.
```
