---
name: 05-design-world
description: 세계관 및 배경 설정 구축
user-invocable: true
---

[NOVEL-SISYPHUS: 세계관 설계]

$ARGUMENTS

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **프로젝트 로드**
   - `meta/project.json` 읽기 (장르, 시대 정보)

2. **lore-keeper 에이전트 호출**
   ```
   Task(subagent_type="novel-dev:lore-keeper", prompt="
   프로젝트 정보:
   - 장르: {genre}
   - 톤: {tone}
   - 시대: {시대 추론 또는 현대}

   세계관을 설계해주세요:

   1. 시공간 배경
      - 시대 (현대/근대/중세/미래)
      - 지리적 배경 (국가, 도시)
      - 기술 수준

   2. 사회 구조
      - 주요 사회 규범
      - 작품에 영향을 미치는 사회적 맥락

   3. 특수 설정 (판타지/SF인 경우)
      - 마법/능력 체계
      - 종족 설정

   4. 장소 데이터베이스 (최소 5개)
      - 주인공 집/회사/자주 가는 곳

   5. 고유 용어 사전 (해당 시)

   결과를 JSON 형식으로 출력해주세요.
   ")
   ```

3. **파일 생성**
   - `world/world.json` - 세계관 기본 설정
   - `world/locations.json` - 장소 DB
   - `world/terms.json` - 용어 사전

## 출력 예시

### world/world.json
```json
{
  "era": "현대",
  "year": "2025년",
  "location": {
    "country": "대한민국",
    "city": "서울",
    "district": "강남구"
  },
  "technology_level": "현대 기술",
  "social_context": {
    "norms": ["외모 중시 사회", "성공 지향적"],
    "relevant_issues": ["직장 내 서열", "재벌 문화"]
  }
}
```

### world/locations.json
```json
{
  "locations": [
    {
      "id": "loc_001",
      "name": "주인공 원룸",
      "type": "거주지",
      "description": "강남역 근처 소형 원룸. 깔끔하지만 좁음.",
      "atmosphere": "아늑, 소박",
      "related_characters": ["char_protagonist"]
    },
    ...
  ]
}
```
