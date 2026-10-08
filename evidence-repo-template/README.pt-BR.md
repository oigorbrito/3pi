# Template de Repositório Guiado por Evidências

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

Este repositório é um **starter harness** (estrutura inicial de testes e verificações), e não uma declaração de maturidade ou conformidade.

Seu objetivo é fazer com que um novo repositório inicie com:

- instruções de projeto versionadas e evidências de engenharia;
- um comando mínimo executável de verificação;
- estado do projeto legível por máquina;
- gatilhos explícitos de maturidade/release;
- relatórios fail-closed (`PASS`, `GAP`, `UNKNOWN_EXTERNAL`, `NOT_APPLICABLE`);
- um caminho para controles mais fortes à medida que requisitos definidos externamente se tornem aplicáveis.

## Verificação canônica

```bash
python scripts/harness.py
python -m unittest discover -s tests -v
```

## Checklist de primeiro uso

1. Substitua o nome e objetivo do projeto abaixo.
2. Selecione uma licença real e salve-a como `LICENSE` (consulte `LICENSE-SELECT.md`).
3. Atualize `policy/project-state.json` apenas com fatos observáveis.
4. Implemente o projeto em `src/` e os testes em `tests/`.
5. Configure as Regras de Repositório / proteção de branch do GitHub fora do repositório.
6. Habilite o OpenSSF Scorecard usando `.github/workflows/scorecard.yml.example` após fixar cada ação a um SHA de commit exato.

## Objetivo do projeto

**STATUS: UNDEFINED**

Descreva o projeto aqui antes que a implementação seja considerada estabelecida.

## Uso básico

**STATUS: NOT_RELEASED**

Antes do primeiro lançamento oficial, substitua esta seção por instruções de instalação, configuração e uso básico.

## Relato de defeitos

Use o GitHub Issues para defeitos não sensíveis. Vulnerabilidades de segurança devem seguir o `SECURITY.md`.

## Semântica de maturidade

`product_stage` em `policy/project-state.json` é apenas informativo. Termos como `MVP` **não** são tratados como prova de um nível de maturidade OpenSSF.

O alvo normativo de maturidade de segurança é `osps_target_level`, e toda promoção deve ser suportada por evidências observáveis. Veja `docs/MATURITY.md`.
