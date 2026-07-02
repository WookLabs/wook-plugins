# GLM 모드 활성화

현재 프로젝트를 Z.AI GLM 최신 모드로 전환한다. 모델 버전을 하드코딩하지 않고, 실행 시점에 Z.AI 공식 문서에서 최신 권장값을 조회한다.

## 절차

1. `~/.env` 파일에서 `ZAI_API_KEY` 값을 읽는다. 파일이 없거나 키가 없으면 사용자에게 알리고 중단한다.

2. 최신 권장 모델을 조회한다. Z.AI 공식 문서는 URL에 `.md`를 붙이면 원본 마크다운을 반환하므로, 아래의 결정적(deterministic) 추출을 우선 사용한다:

   a. Bash로 실행:

   ```bash
   curl -fsS -m 20 "https://docs.z.ai/devpack/tool/claude.md" | grep -oE '"ANTHROPIC_DEFAULT_(OPUS|SONNET|HAIKU)_MODEL"[[:space:]]*:[[:space:]]*"[^"]+"'
   ```

   정상 출력 예시 (키 이름으로 매핑, 줄 순서는 무관):

   ```
   "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7"
   "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.2[1m]"
   "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.2[1m]"
   ```

   참고: 문서에는 같은 키가 따옴표 없는 불릿 목록 형태로도 등장하지만, 그것은 기본 매핑 설명일 뿐이다. 위 grep은 따옴표로 감싼 JSON 권장 설정 예시만 매칭한다.

   b. 세 키가 각각 정확히 하나의 값으로 추출되면 그 값을 사용하고 3단계로 진행한다.

   c. a가 실패하면(curl 오류, 세 키 미달, 같은 키에 서로 다른 값 중복 매칭) WebFetch로 `https://docs.z.ai/devpack/tool/claude`를 조회하여 Manual configuration 섹션의 settings.json 예시에서 세 값을 추출한다.

   d. c도 실패하면 GLM 모드로 전환하지 않고 사용자에게 다음과 같이 알린 뒤 중단한다:

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
