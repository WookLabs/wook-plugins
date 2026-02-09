---
name: rtl-format
description: Verilog/SystemVerilog 파일을 RTL 코딩 표준에 맞게 자동 포매팅
user-invocable: true
---

# /rtl-format

RTL 코딩 표준에 따라 Verilog 파일을 자동 포매팅합니다.

## Usage

```
/rtl-format <path>
```

- `<path>`: `.v` 파일 경로 또는 디렉토리 경로
- 디렉토리 지정 시 하위 `**/*.v` 파일 전부 포매팅

## Examples

```
/rtl-format C:\work\project\rtl\top_module.v
/rtl-format C:\work\project\rtl\
```

## Behavior

`rtl-format` 스킬을 호출합니다. 로직 변경 없이 순수 포매팅만 수행하므로 승인 없이 바로 적용합니다.
