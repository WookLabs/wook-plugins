---
description: "[15단계] 내보내기 - 원고 내보내기"
---

[NOVEL-SISYPHUS: 내보내기]

$ARGUMENTS

## 지원 형식

| 형식 | 설명 |
|------|------|
| md (기본) | 마크다운 단일 파일 |
| txt | 플레인 텍스트 |
| html | HTML (스타일 포함) |
| epub | 전자책 (향후) |

## 실행 단계

1. **형식 결정**
   - 인자 있음: 해당 형식
   - 미지정: md

2. **파일 병합**
   ```
   # {title}

   ## 제1화: {title_1}
   {chapter_1 content}

   ---

   ## 제2화: {title_2}
   {chapter_2 content}

   ...
   ```

3. **파일 저장**
   - `exports/{project_id}.{format}`
   - `exports/{project_id}_chapters/` (개별 파일)

## 출력

```
내보내기 완료!
- 파일: exports/novel_20250117_143052.md
- 회차: 50화
- 총 글자수: 250,000자
```
