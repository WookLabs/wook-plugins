# GLM 모드 비활성화

현재 프로젝트를 Anthropic API로 복귀한다.

## 절차

1. 현재 프로젝트의 `.claude/settings.json`을 읽는다. 파일이 없으면 "GLM 모드가 활성화되어 있지 않습니다"라고 알리고 중단한다.

2. `env` 객체에서 다음 키를 **제거**한다:
   - `ANTHROPIC_AUTH_TOKEN`
   - `ANTHROPIC_BASE_URL`
   - `API_TIMEOUT_MS`
   - `ANTHROPIC_DEFAULT_OPUS_MODEL`
   - `ANTHROPIC_DEFAULT_SONNET_MODEL`
   - `ANTHROPIC_DEFAULT_HAIKU_MODEL`

3. `env`의 다른 키는 보존한다. `env` 외의 다른 설정도 보존한다. `env`가 비어있으면 `env` 키 자체를 제거한다.

4. 파일을 저장한다.

5. 사용자에게 결과를 보고한다:

```
✅ GLM 모드 비활성화 완료
   Provider: Anthropic (기본)
   설정 파일: .claude/settings.json
   ⚠️ 새 터미널을 열거나 /reload 해야 적용됩니다.
```
