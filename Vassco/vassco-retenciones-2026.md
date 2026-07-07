# Motor de retenciones — Vassco · parámetros 2026

**Congelado:** 2026-07-06 · **Vigencia:** facturas desde 1-jul-2026 · **Revisar con:** contador de Vassco + RUT.
Las tarifas 2026 estuvieron en flujo (Decreto 572 de 2025 suspendido 8-may a 30-jun; reinstaurado por el Consejo de Estado desde 1-jul-2026). Este archivo refleja lo vigente **desde julio 2026**.

## Parámetro base
- **UVT 2026 = $52.374** (Resolución DIAN 000238 del 15-dic-2025).

## Retención en la fuente (renta) — Decreto 572 de 2025 (vigente desde 1-jul-2026)

| Concepto | Base mínima | Tarifa |
|---|---|---|
| **Compras generales** (bienes) | 10 UVT = **$523.740** | 2,5% declarante / 3,5% no declarante |
| **Víveres agrícolas/pecuarios SIN procesamiento industrial** | 92 UVT = **$4.818.408** | **1,5%** |
| Café pergamino/cereza | 70 UVT = $3.666.180 | 0,5% |
| **Servicios generales** | 4 UVT = **$209.496** | 4% declarante / 6% no declarante |
| Honorarios y comisiones | sin base | 10% (PN no decl.) / 11% (PJ y PN decl.) |
| Arrendamiento inmuebles | 27 UVT | 3,5% |

> ⚠️ Ojo mitad de año: durante 8-may a 30-jun/2026 la base de compras generales fue 27 UVT ($1.414.098). Desde **1-jul volvió a 10 UVT**. El motor debe usar la base según la **fecha de la factura**.

## ReteICA Bogotá
- Se practica sobre el valor del pago (base gravable), **tarifa por mil (‰) según la actividad CIIU del proveedor**.
- Bases mínimas Bogotá: compras 27 UVT ($1.414.098) · servicios 4 UVT ($209.496).
- Tarifas ‰ **por confirmar en la Cartilla ICA de la Secretaría de Hacienda de Bogotá** (referencias: comercio de alimentos ≈ 4,14‰; servicios ≈ 9,66‰; profesiones liberales 7,66‰).
- Vassco solo retiene ICA si está **designado agente retenedor de ICA** (confirmar).

## IVA / INC (impoconsumo)
- **No se calculan**: se leen del XML de cada factura (IVA 5%/19%, INC 8%).

## ✅ Perfil tributario de Vassco (CONFIRMADO — RUT del 27-oct-2025)
NIT 901962018-8. Responsabilidades (casilla 53): **05** (renta régimen **ORDINARIO**), **07 (Retención en la fuente a título de renta)**, 14 (exógena), 33 (INC/impoconsumo), 42 (contabilidad), 48 (IVA), 52 (factura electrónica), 55 (beneficiarios finales).

- **Régimen ORDINARIO** — NO Régimen Simple (no está el código 47) → **Vassco SÍ practica retención en la fuente en compras** (código 07). → `es_agente_renta = true`.
- **NO** es gran contribuyente ni autorretenedor.
- Responsable de **IVA (48)** e **INC 8% (33)** — restaurante. Actividades: 5611 (restaurante), 5621, 5630 (bar), 4724.
- **ReteICA Bogotá:** el RUT (nacional) no lo dice; el historial muestra que Vassco **sí** retiene ICA → `es_agente_ica = true` (confirmar tarifas por actividad en el RIT/cartilla Bogotá).

**Implicación:** Vassco SÍ retiene, pero como casi todas las compras son **víveres agropecuarios sin procesar (1,5% / tope 92 UVT ≈ $4,8M)**, la mayoría de facturas dan **RF $0**. Retiene de verdad en **compras generales > $523.740** (abarrotes, licor, empaques → 2,5%) y **servicios > 4 UVT**.

⚠️ **Conciliar con el contador:** en el historial se retuvo ~2,5% a algunos proveedores de comida (Ricam, Salcedo) aun en facturas pequeñas → no calza con la regla de víveres; probablemente los clasifica como *compra general*. El motor propone y marca REVISAR cuando difiere de la ley.

## Por proveedor (NIT) define
- ¿Declarante de renta? → 2,5% vs 3,5%.
- ¿Proveedor en Régimen Simple? → **no se le practica retefuente.**
- Naturaleza del bien: vívere agropecuario sin procesar (1,5% / 92 UVT) vs compra general (2,5% / 10 UVT) vs servicio.
- **Tabla semilla:** los 71 NIT del historial con su tarifa efectiva observada = primer criterio del motor.

## Lógica del motor (MVP con revisión humana)
1. Si Vassco NO es agente retenedor (según RUT) → RF=0, ICA=0. Fin.
2. Si el NIT está en la tabla semilla → aplica su trato observado y valida contra la ley; si difieren → marca **REVISAR**.
3. Si el NIT es nuevo → clasifica el bien (agropecuario / general / servicio) con reglas + Claude → aplica tarifa y tope → marca **REVISAR**.
4. Ante ambigüedad nunca escribe: deja el valor **sugerido** para aprobación humana.

## Aplicado a las 3 facturas reales (UVT 2026, desde julio)
| Proveedor | Total | Si "víveres" (1,5%/92 UVT) | Si "compras grales" (2,5%/10 UVT) |
|---|--:|--:|--:|
| RICAM (pollo) $332.700 | 332.700 | RF $0 (bajo 92 UVT) | RF $0 (bajo 10 UVT... **no**: 332.700 < 523.740 → $0) |
| S. Cárnicos (carne) $644.860 | 644.860 | RF $0 | RF ≈ $16.122 (2,5%) |
| Salcedo (fruver) $314.425 | 314.425 | RF $0 | RF $0 (bajo 523.740) |

→ La clasificación del bien y el régimen de Vassco cambian el resultado. Por eso van a revisión hasta tener el RUT.

## Fuentes
- UVT 2026: DIAN Res. 000238/2025 · https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000238%20de%2015-12-2025.Pdf
- Retefuente 2026 (Decreto 572): https://www.gerencie.com/tabla-de-retencion-en-la-fuente-2026.html · https://actualicese.com/retencion-en-la-fuente-por-compras-2026/
- ReteICA Bogotá: https://www.haciendabogota.gov.co/es/impuestos/impuesto-de-industria-y-comercio-ica · https://www.gobiernobogota.gov.co/transparencia/informacion-tributaria/tarifas-liquidacion-impuesto-industria-comercio
