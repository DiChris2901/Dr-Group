# DOCUMENTO EJECUTIVO ESTRATÉGICO: DR GROUP DASHBOARD
## Plataforma de Control Operacional para la Industria de Juegos de Suerte y Azar en Colombia

> **Tipo:** Documento Administrativo Ejecutivo
> **Elaborado por:** Consultor Estratégico Senior — Industria de JSA en Colombia
> **Fecha:** Febrero 2026
> **Versión:** 1.0.0
> **Clasificación:** Confidencial — Uso interno estratégico
> **Resoluciones incorporadas:**
> - Resolución 20250029784 del 26 de diciembre de 2025 (Protocolo Integral de Liquidación v19)
> - Resolución 20211200034224 de 2021 (Confiabilidad MET y gradualidad)

---

## RESUMEN EJECUTIVO

DR Group Dashboard se posiciona como un **Centro de Control Operacional especializado** para operadores de Juegos de Suerte y Azar (JSA) en la modalidad de Localizados en Colombia. El producto aborda un mercado regulado por Coljuegos con ~180 contratos de concesión activos, ~75,000 MET's operando a nivel nacional, y un recaudo estimado superior a COP $4 billones anuales (2024).

**Momento estratégico crítico:** La Resolución 20250029784 del 26 de diciembre de 2025 unifica y reemplaza TODOS los protocolos anteriores de liquidación, entrando en vigencia **a partir de la liquidación de marzo de 2026** (liberada los primeros 5 días de abril). Esta resolución introduce cambios fundamentales en:

- La fórmula de cálculo de derechos de explotación para MET's (CoinIn − CoinOut − Jackpots)
- La clasificación TV/TF con 6 condiciones simultáneas obligatorias
- El tratamiento de eventos significativos (03, 05, 07, 08)
- La extensión del protocolo a Bingos, ACDV y Mesas de Casino en un solo documento
- La eliminación de la compensación entre modalidades

**Esto crea una ventana de oportunidad inmediata** para un producto que automatice la comprensión y el cumplimiento de este nuevo protocolo, dado que la mayoría de operadores aún procesan sus liquidaciones en hojas de cálculo.

---

## TABLA DE CONTENIDOS

1. [Análisis del Mercado](#1-análisis-del-mercado)
2. [Posicionamiento del Producto](#2-posicionamiento-del-producto)
3. [Features Prioritizadas](#3-features-prioritizadas)
4. [Modelo de Negocio SaaS](#4-modelo-de-negocio-saas)
5. [Roadmap de 12 Meses](#5-roadmap-de-12-meses)
6. [Riesgos y Oportunidades Regulatorias](#6-riesgos-y-oportunidades-regulatorias)
7. [Análisis Competitivo](#7-análisis-competitivo)
8. [Estrategia de Pricing](#8-estrategia-de-pricing)

---

## 1. ANÁLISIS DEL MERCADO {#1-análisis-del-mercado}

### 1.1 Dimensión del Mercado Colombiano de JSA Localizados

| Indicador | Estimación 2024-2025 | Fuente |
|-----------|---------------------|--------|
| **Recaudo total JSA (todas las modalidades)** | ~COP $4.0 - $4.5 billones/año | Informes de gestión Coljuegos |
| **Contratos de concesión de localizados activos** | ~160 - 200 contratos | Coljuegos - Registro Contractual |
| **Máquinas Electrónicas Tragamonedas (MET's) autorizadas** | ~70,000 - 80,000 unidades | Estimación SCLM+ |
| **Salas de juego activas** | ~3,000 - 4,000 establecimientos | Estimación por municipios |
| **Bingos autorizados** | ~200 - 400 establecimientos | Estimación regulatoria |
| **ACDV (Apuestas Carreras/Deportes Virtuales)** | ~1,500 - 3,000 terminales | TDV registrados en SCJ |
| **Mesas de Casino y Esferódromos** | ~500 - 1,000 elementos | Inventario contractual |
| **SMMLV 2026** | ~COP $1,423,500 | Decreto del Gobierno Nacional |
| **Participación localizados en recaudo total** | ~55% - 60% | Estructura de ingresos Coljuegos |

### 1.2 Estructura del Mercado de Operadores

#### Segmento A — Grandes Operadores (10-15 empresas)
| Característica | Detalle |
|---------------|---------|
| **Tamaño** | 500+ MET's, 15+ salas, múltiples contratos |
| **Perfil tecnológico** | Software propio o ERP de gambling adaptado |
| **Dolor principal** | Integración con SCLM+, multi-contrato, consolidación |
| **Disposición a pagar** | COP $3M - $8M/mes por herramienta especializada |
| **Ejemplo** | Grupos empresariales con presencia en 5+ departamentos |

#### Segmento B — Medianos Operadores (30-50 empresas)
| Característica | Detalle |
|---------------|---------|
| **Tamaño** | 80-500 MET's, 3-15 salas, 1-2 contratos |
| **Perfil tecnológico** | Excel + hojas de cálculo manuales |
| **Dolor principal** | Liquidación manual, cuentas de cobro, cartera desorganizada |
| **Disposición a pagar** | COP $800K - $3M/mes |
| **Ejemplo** | DR Group (operador actual del dashboard) |

#### Segmento C — Pequeños Operadores (100-130 empresas)
| Característica | Detalle |
|---------------|---------|
| **Tamaño** | 80-150 MET's, 1-3 salas, 1 contrato |
| **Perfil tecnológico** | 100% manual — contador + Excel básico |
| **Dolor principal** | Cumplimiento regulatorio, cálculo de impuestos, riesgo de multas |
| **Disposición a pagar** | COP $200K - $800K/mes |
| **Ejemplo** | Operadores familiares en ciudades intermedias |

### 1.3 Dinámica Competitiva

**El mercado de software para operadores de JSA en Colombia es un océano azul:**

| Factor | Evaluación |
|--------|-----------|
| **Software especializado disponible** | Prácticamente inexistente. No hay un "QuickBooks de los casinos colombianos" |
| **Herramientas internacionales** | Existen (IGT Advantage, DRGT, Bally CMS) pero están diseñadas para casinos integrados (Las Vegas-style), NO para la regulación colombiana de Coljuegos |
| **Lo que realmente usan los operadores** | Excel + Word + WhatsApp + Contabilidad en Siigo/World Office |
| **Barreras de entrada** | Conocimiento regulatorio colombiano profundo + entendimiento del Excel de Coljuegos |
| **Ventaja del primer movedor** | ALTA — Quien capture primero a los operadores medianos domina el mercado |

### 1.4 Tendencias del Mercado

| Tendencia | Horizonte | Impacto en DR Group |
|-----------|-----------|---------------------|
| **SCLM+ (MET en tiempo real)** | 2025-2027 | Cambia el paradigma de Excel mensual a datos en tiempo real. Oportunidad de ser intermediario |
| **SCLB (Bingos conectados)** | 2025-2027 | Nuevo mercado vertical: operadores de Bingo necesitarán herramientas similares |
| **SCJ (ACDV conectado)** | 2025-2027 | Tercer vertical: terminales de apuestas virtuales |
| **Resolución 20250029784 (Protocolo Integral)** | Marzo 2026 | Unifica liquidación de TODAS las modalidades — herramienta multi-modalidad es diferenciador |
| **Digitalización regulatoria** | Continuo | Coljuegos avanza hacia 100% digital — los operadores manuales quedan en desventaja |
| **Consolidación de operadores** | 2025-2028 | Grupos comprando contratos de operadores pequeños — necesitan multi-contrato |
| **Presión fiscal creciente** | Continuo | Gobierno busca más recaudo → regulación más estricta → más necesidad de control |

### 1.5 Tamaño Direccionable del Mercado (TAM/SAM/SOM)

| Nivel | Cálculo | Valor Anual |
|-------|---------|-------------|
| **TAM** (Total Addressable Market) | ~180 operadores × COP $1.5M promedio/mes × 12 | ~COP $3,240M/año (~USD $810K) |
| **SAM** (Serviceable Available Market) | ~80 operadores medianos y pequeños × COP $1M/mes × 12 | ~COP $960M/año (~USD $240K) |
| **SOM** (Serviceable Obtainable Market — Año 1-2) | 10-15 operadores × COP $1.2M/mes × 12 | ~COP $144M - $216M/año (~USD $36K-$54K) |

> **Nota:** Estos cálculos son conservadores. El valor real de mercado es mayor si se incluyen servicios de implementación, consultoría regulatoria y módulos premium.

---

## 2. POSICIONAMIENTO DEL PRODUCTO {#2-posicionamiento-del-producto}

### 2.1 Declaración de Posicionamiento

> **Para** operadores de juegos de suerte y azar localizados en Colombia
> **Que** necesitan gestionar liquidaciones, cumplir regulación de Coljuegos y controlar su operación multi-sala
> **DR Group Dashboard** es un **Centro de Control Operacional especializado**
> **Que** automatiza el procesamiento del Excel de Coljuegos, genera cuentas de cobro, controla cartera y asegura cumplimiento regulatorio
> **A diferencia de** hojas de cálculo, ERPs genéricos o software de casinos internacionales
> **Nuestro producto** entiende la regulación colombiana (Ley 643/2001, Decreto 2372/2019, Resolución 20250029784/2025), habla el idioma del operador local, y transforma datos regulatorios en inteligencia operacional accionable.

### 2.2 Propuesta de Valor por Segmento

#### Para el Operador (Concesionario)
```
"Lo que haces en 4 horas con Excel, nosotros lo hacemos en 30 segundos — 
 con cero errores de cálculo y cumplimiento regulatorio automático."
```

**Beneficios concretos:**
- Procesamiento automático del Excel mensual de Coljuegos
- Cálculo exacto con la nueva fórmula: BLTV = Σ(CoinIn) − Σ(CoinOut) − Σ(Jackpots)
- Clasificación automática TV/TF según 6 condiciones de la Resolución 20250029784
- Detección proactiva de máquinas sin producción
- Cuentas de cobro PDF profesionales generadas en segundos
- Dashboard de cartera: quién te debe, cuánto, hace cuánto

#### Para el Dueño de Sala (Cliente del concesionario)
```
"Sabe exactamente cuánto produce tu sala, cuánto debes pagar, 
 y recibe tu cuenta de cobro transparente y verificable."
```

**Beneficios concretos:**
- Transparencia total en el desglose de costos
- Histórico de producción por máquina
- Comprobante de pago digital
- Comparativo de rendimiento entre períodos

#### Para el Área Financiera / Contable
```
"Conciliación automática entre producción real, cuentas de cobro 
 generadas y pagos recibidos — sin retrabajos manuales."
```

### 2.3 Diferenciadores Competitivos Clave

| # | Diferenciador | Descripción | ¿Por qué importa? |
|---|--------------|-------------|-------------------|
| 1 | **Procesamiento nativo del Excel de Coljuegos** | Auto-detección de encabezados, auto-match por contrato, agrupación por NUC | Ningún otro software entiende este archivo específico |
| 2 | **Multi-empresa / Multi-contrato** | Soporta múltiples NIT's y contratos en una sola plataforma | Holdings y grupos pueden consolidar operaciones |
| 3 | **Liquidación por sala automática** | Desglose desde la liquidación global hacia cada sala con cálculos independientes | Los operadores Modelo B no pueden funcionar sin esto |
| 4 | **Máquinas en cero proactivo** | Detección automática de MET's sin producción con histórico | Feature killer — nadie más lo ofrece automatizado |
| 5 | **Cumplimiento de Resolución 20250029784** | Implementación nativa de la nueva fórmula integral de liquidación (vigente marzo 2026) | Ventaja de primer movedor — la resolución es nueva |
| 6 | **Regulación colombiana embebida** | Ley 643, Decreto 2372, Art. 59 Ley 1955 — todo parametrizado | ERPs internacionales no entienden la regulación local |
| 7 | **APK de asistencias con geolocalización** | Control de empleados de sala con jornada laboral verificable | Complemento operativo que no ofrecen competidores de liquidación |

### 2.4 Lo que DR Group Dashboard NO ES

| No es... | Es... |
|----------|-------|
| Un ERP completo | Un Centro de Control Operacional **complementario** a Siigo, World Office, etc. |
| Un reemplazo del Portal del Operador de Coljuegos | Una herramienta de **preparación e inteligencia** que alimenta las declaraciones |
| Un software de contabilidad | Un sistema de **gestión operativa** con foco en liquidaciones y cartera |
| Un CMS de casino (slot management) | Un sistema de **cumplimiento regulatorio y facturación** para el operador |
| Una solución de gambling online | Una plataforma para **juegos terrestres/localizados** exclusivamente |

---

## 3. FEATURES PRIORITIZADAS {#3-features-prioritizadas}

### 3.1 Matriz de Priorización (Impacto vs Esfuerzo)

```
                          IMPACTO EN NEGOCIO
                     Bajo ◄───────────────► Alto
                  ┌────────────────────────────────┐
            Alto  │                    │            │
                  │  KPIs avanzados    │ Inventario │
                  │  Proveedores online│ Máquinas   │
                  │                    │            │
      E           │  Vencimiento docs  │ Adaptación │
      S           │                    │ Res.29784  │
      F   ────────┼────────────────────┼────────────┤
      U           │                    │            │
      E           │  Empleados/APK     │ Dashboard  │
      R           │  (ya existe)       │ Cartera    │
      Z           │                    │            │
      O           │  Salas CRUD        │ Proc. Excel│
            Bajo  │  (ya existe)       │ (ya existe)│
                  │                    │            │
                  └────────────────────────────────┘
```

### 3.2 Features Existentes — Ya Implementadas (Sprint 0)

| # | Feature | Estado | Valor de Mercado | Notas |
|---|---------|--------|-----------------|-------|
| 1 | Procesamiento Excel Coljuegos | ✅ Producción | ⭐⭐⭐⭐⭐ | Motor core. Auto-detect headers, auto-match contrato |
| 2 | Cálculo 12% + 1% | ✅ Producción | ⭐⭐⭐⭐⭐ | Fórmula correcta según Ley 643 Art. 34 |
| 3 | Tarifa Fija SMMLV | ✅ Producción | ⭐⭐⭐⭐⭐ | Configurable vía `system_config/general` |
| 4 | Liquidación por Sala | ✅ Producción | ⭐⭐⭐⭐⭐ | Desglose automático con sub-documentos |
| 5 | Cuenta de Cobro PDF | ✅ Producción | ⭐⭐⭐⭐ | PDF profesional con logo, NIT, desglose |
| 6 | Estado de Facturación | ✅ Producción | ⭐⭐⭐⭐ | Ciclo: pendiente → generada → enviada → pagada |
| 7 | CRUD de Salas | ✅ Producción | ⭐⭐⭐⭐ | 20+ campos, 3 documentos adjuntos |
| 8 | Máquinas en Cero | ✅ Producción | ⭐⭐⭐⭐⭐ | Detección proactiva con colección pre-computada |
| 9 | Multi-empresa | ✅ Producción | ⭐⭐⭐⭐ | Múltiples contratos de concesión |
| 10 | Exportación Excel (7 formatos) | ✅ Producción | ⭐⭐⭐⭐⭐ | Formato Python profesional |
| 11 | Auto-match por contrato | ✅ Producción | ⭐⭐⭐⭐⭐ | Cruza contrato del Excel con `company.contractNumber` |
| 12 | Empleados + APK Asistencias | ✅ Producción | ⭐⭐⭐⭐ | Geolocalización, jornada laboral |
| 13 | Compromisos Fijos | ✅ Producción | ⭐⭐⭐⭐ | Detecta "Coljuegos" como proveedor |
| 14 | Auditoría de Salas | ✅ Producción | ⭐⭐⭐⭐ | `sala_changes` con trazabilidad completa |

### 3.3 Features Nuevas — Priorizadas por la Resolución 20250029784

#### 🔴 PRIORIDAD CRÍTICA — Adaptación al Nuevo Protocolo de Liquidación

La Resolución 20250029784 del 26 de diciembre de 2025 **deroga completamente** la Resolución 20202100002044 de 2020 y establece un protocolo integral que entra en vigencia **desde la liquidación de marzo de 2026**.

| # | Feature | Urgencia | Justificación Regulatoria |
|---|---------|----------|--------------------------|
| **F-1** | **Adaptación de fórmula MET: BLTV = Σ(CoinIn) − Σ(CoinOut) − Σ(Jackpots)** | 🔴 INMEDIATA | Art. 5 — Regla general de liquidación. Reemplaza fórmula anterior de "producción × 12%" |
| **F-2** | **Clasificación automática TV/TF con 6 condiciones** | 🔴 INMEDIATA | Art. 4 — Un MET es TV solo si cumple TODAS: conectividad, confiabilidad SCLM, confiabilidad MET, evento 00 diario, sin cero >1 mes, requisitos técnicos |
| **F-3** | **Tratamiento de eventos significativos (03, 05, 07, 08)** | 🔴 ALTA | Art. 6 — Cálculo especial de deltas para RAM corruption, RAMCLEAR, Rollover. Prioridad 07 sobre 03/05/08 |
| **F-4** | **Regla de no compensación entre modalidades** | 🔴 ALTA | Art. 24 — VPDE = Σ(LTV) + Σ(LTF). Si negativos → cero. Sin arrastre entre meses ni entre modalidades |
| **F-5** | **Períodos fraccionados (Adición, Retiro, Traslado, Reemplazo)** | 🟡 ALTA | Art. 9 — Liquidación proporcional por días de operación |
| **F-6** | **Validación de contadores: VBL = CoinIn − CoinOut − Jackpots** | 🟡 ALTA | Art. 8 — Todos los valores diarios de liquidación ≥ 0. Sin carryover |
| **F-7** | **Soporte multi-modalidad: Bingos (BLTV = Ventas − Premios)** | 🟡 MEDIA | Art. 12 — Bingo ONLINE (TV) vs Bingo NO CONECTADO (TF). SCLB |
| **F-8** | **Soporte multi-modalidad: ACDV (Terminales de Venta)** | 🟡 MEDIA | Art. 17-19 — Ingresos brutos − premios pagados por TDV |
| **F-9** | **Soporte Mesas de Casino/Esferódromos** | 🟢 BAJA | Art. 20-21 — Siempre TF. Proporcional por días operación |
| **F-10** | **Consolidación multi-modalidad** | 🟡 ALTA | Art. 24-26 — VPDE + GA = VL total. Agrupación por tipo sin compensación cruzada |

#### 🟡 PRIORIDAD ALTA — Módulos de Gestión Operativa

| # | Feature | Impacto | Descripción |
|---|---------|---------|-------------|
| **F-11** | **Inventario Centralizado de Máquinas** | 🔴 Alto | Colección `maquinas/{nuc}` con estado, ubicación, historial de movimientos, producción acumulada |
| **F-12** | **Dashboard de Cartera (Cuentas por Cobrar)** | 🔴 Alto | Aging: 0-30d, 31-60d, 61-90d, 90+d. Conciliación pago vs cuenta de cobro |
| **F-13** | **Gestión de Contratos con Coljuegos** | 🔴 Alto | Vencimiento, novedades, cumplimiento mínimo de 80 MET's, alertas automáticas |
| **F-14** | **Tablero de Cumplimiento Regulatorio** | 🟡 Alto | Semáforo visual: ¿contratos vigentes? ¿documentos al día? ¿mínimo de MET's? ¿SCLM+ transmitiendo? |
| **F-15** | **Reportes automáticos para Coljuegos** | 🟡 Medio | Pre-llenado de declaración mensual (Art. 41), inventario de elementos activos |

#### 🟢 PRIORIDAD MEDIA — Inteligencia de Negocio

| # | Feature | Impacto | Descripción |
|---|---------|---------|-------------|
| **F-16** | **Análisis de Rentabilidad por Sala** | 🟡 Medio | Producción – derechos – gastos – costos = margen neto. ROI por máquina |
| **F-17** | **Gestión de Proveedores de Plataforma** | 🟢 Bajo-Medio | Fichas IGT/Novomatic/Zitro. Costos de conexión vs ingresos |
| **F-18** | **Alertas de Vencimiento de Documentos** | 🟢 Medio | Cámara Comercio, Uso de Suelos, Concepto Previo Alcaldía |
| **F-19** | **KPIs Avanzados de Negocio** | 🟢 Medio | Ranking de salas, producción per cápita, tendencias mensuales |
| **F-20** | **Preparación para SCLM+** | 🟢 Media (creciente) | Dashboard de transmisión, alertas de no-transmisión, reconciliación |

### 3.4 Impacto de la Resolución 20250029784 en Features Existentes

| Feature Existente | Cambio Requerido | Urgencia |
|-------------------|-----------------|----------|
| **Cálculo de impuestos** | Actualizar de "Producción × 12%" a "BLTV = Σ(CoinIn) − Σ(CoinOut) − Σ(Jackpots), LTV = BLTV × 12%" | 🔴 Antes de Marzo 2026 |
| **Procesamiento de Excel** | Puede requerir nuevas columnas si Coljuegos modifica el formato del Excel para reflejar CoinIn/CoinOut/Jackpots por separado | 🟡 Monitorear formato de Excel |
| **Tarifa Fija** | Las 6 condiciones de clasificación TV/TF son nuevas y más estrictas | 🔴 Antes de Marzo 2026 |
| **Máquinas en Cero** | Ahora con impacto regulatorio directo: >1 mes sin producción = pierde clasificación TV | 🔴 Antes de Marzo 2026 |
| **Liquidación por Sala** | Mantener, pero agregar consolidación multi-modalidad sin compensación entre tipos | 🟡 Cuando se agreguen Bingos/ACDV |

---

## 4. MODELO DE NEGOCIO SaaS {#4-modelo-de-negocio-saas}

### 4.1 Modelo de Monetización

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE INGRESOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  SUSCRIPCIÓN │    │  SETUP FEE   │    │  SERVICIOS ADDON   │ │
│  │  MENSUAL     │    │  (ONE-TIME)  │    │  (OPCIONALES)      │ │
│  │              │    │              │    │                    │ │
│  │ Base: /MET   │    │ Migración de │    │ Consultoría        │ │
│  │  o /sala     │    │ datos        │    │ regulatoria        │ │
│  │              │    │              │    │                    │ │
│  │ Incluye:     │    │ Config       │    │ Capacitación       │ │
│  │ - Procesam.  │    │ inicial      │    │ personalizada      │ │
│  │ - Liquid.    │    │              │    │                    │ │
│  │ - Ctas cobro │    │ Capacitación │    │ Módulos premium    │ │
│  │ - Dashboard  │    │ básica       │    │ (rentabilidad,     │ │
│  │ - APK emplead│    │              │    │  SCLM+, reportes)  │ │
│  └─────────────┘    └──────────────┘    └────────────────────┘ │
│                                                                 │
│  MODELO PREFERIDO: Suscripción por MET/mes + Setup fee          │
│  ALTERNATIVA: Suscripción fija por tier (Small/Medium/Large)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Estructura de Planes

#### Plan Esencial — Operador Pequeño

| Aspecto | Detalle |
|---------|---------|
| **Perfil** | 1 contrato, 80-150 MET's, 1-3 salas |
| **Precio** | COP $3,500 - $5,000 /MET/mes → COP $280K - $750K/mes |
| **Incluye** | Procesamiento Excel, Liquidación básica, 1 empresa, Dashboard |
| **No incluye** | Multi-empresa, ACDV/Bingo, APK, Análisis de rentabilidad |
| **Setup fee** | COP $500K - $1M (one-time) |

#### Plan Profesional — Operador Mediano

| Aspecto | Detalle |
|---------|---------|
| **Perfil** | 1-3 contratos, 150-500 MET's, 3-15 salas |
| **Precio** | COP $2,500 - $4,000 /MET/mes → COP $375K - $2M/mes |
| **Incluye** | Todo lo Esencial + Multi-empresa + Cuentas de Cobro + Cartera + APK Asistencias |
| **No incluye** | ACDV/Bingo, SCLM+, Reportes avanzados Coljuegos |
| **Setup fee** | COP $1.5M - $3M (one-time) |

#### Plan Enterprise — Grandes Operadores / Holdings

| Aspecto | Detalle |
|---------|---------|
| **Perfil** | 3+ contratos, 500+ MET's, 15+ salas, múltiples modalidades |
| **Precio** | COP $1,800 - $3,000 /MET/mes → COP $900K - $5M+/mes |
| **Incluye** | Todo lo Profesional + Multi-modalidad + SCLM+ + Reportes Coljuegos + Rentabilidad + Soporte priority |
| **No incluye** | Desarrollo custom |
| **Setup fee** | COP $3M - $8M (one-time + migración datos) |

### 4.3 Proyección de Ingresos — Escenario Conservador (Año 1-3)

| Período | Clientes | MET's Gestionadas | MRR (COP) | ARR (COP) |
|---------|----------|-------------------|-----------|-----------|
| **Mes 1-3** (MVP/Beta) | 1-2 | 200-400 | $600K - $1.2M | — |
| **Mes 4-6** (Lanzamiento) | 3-5 | 500-1,200 | $1.5M - $4M | — |
| **Mes 7-12** (Crecimiento) | 8-12 | 1,500-4,000 | $4M - $12M | $48M - $144M |
| **Año 2** (Escala) | 15-25 | 4,000-10,000 | $12M - $30M | $144M - $360M |
| **Año 3** (Consolidación) | 30-50 | 10,000-25,000 | $30M - $75M | $360M - $900M |

> **Break-even estimado:** Mes 6-8 (con costos fijos de ~COP $3M/mes: hosting, soporte, desarrollo)

### 4.4 Consideraciones Técnicas Multi-Tenant

| Aspecto | Estrategia Recomendada |
|---------|----------------------|
| **Aislamiento de datos** | Firestore con document paths prefijados por tenant (`tenants/{tenantId}/...`) |
| **Autenticación** | Firebase Auth con claims custom por tenant + rol |
| **Personalización** | Logo, colores y nombre de empresa por tenant (ya existe parcialmente) |
| **Onboarding** | Self-service con asistente paso a paso + primer Excel importado |
| **Migración** | De single-tenant actual a multi-tenant: ~4-6 semanas de refactoring |
| **Escalabilidad** | Firebase escala automáticamente hasta ~50 tenants. Después: evaluar Supabase |

### 4.5 Métricas de Negocio a Trackear

| Métrica | Target Año 1 | Target Año 2 |
|---------|-------------|-------------|
| **MRR** (Monthly Recurring Revenue) | COP $8M+ | COP $25M+ |
| **Churn mensual** | < 3% | < 2% |
| **LTV** (Lifetime Value) | > COP $15M | > COP $30M |
| **CAC** (Customer Acquisition Cost) | < COP $3M | < COP $2M |
| **LTV/CAC Ratio** | > 5x | > 10x |
| **NPS** (Net Promoter Score) | > 50 | > 70 |
| **Time to Value** (primer Excel procesado) | < 30 min | < 15 min |

---

## 5. ROADMAP DE 12 MESES {#5-roadmap-de-12-meses}

### 5.1 Visión General

```
         2026                                                    2027
    MAR   ABR   MAY   JUN   JUL   AGO   SEP   OCT   NOV   DIC   ENE   FEB
    ─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
         │     │           │           │           │           │           │
    ◄────┤  FASE 1        │  FASE 2   │  FASE 3   │  FASE 4   │  FASE 5  ►
    NUEVA│  ADAPTAR       │  FUNDAMEN │  DIFERENC │  ESCALA   │  FUTURO  
    RES. │  + MVP SaaS    │  TOS      │  IACIÓN   │  + VENTAS │  SCLM+   
    VIGNT│                │           │           │           │           
    ─────┴────────────────┴───────────┴───────────┴───────────┴───────────
```

### 5.2 FASE 1 — Adaptación Regulatoria + MVP SaaS (Marzo - Abril 2026)

**Objetivo:** Cumplir con la Resolución 20250029784 y preparar la plataforma para multi-tenant.

| Sprint | Duración | Entregable | Features |
|--------|----------|-----------|----------|
| **S1** | 2 semanas | Adaptación de fórmulas | F-1 (BLTV = CoinIn − CoinOut − Jackpots), F-4 (no compensación), F-6 (VBL ≥ 0) |
| **S2** | 2 semanas | Clasificación TV/TF + Eventos | F-2 (6 condiciones TV/TF), F-3 (eventos 03/05/07/08), F-5 (períodos fraccionados) |
| **S3** | 2 semanas | Arquitectura multi-tenant | Refactoring Firestore para tenant isolation, auth claims, onboarding flow |
| **S4** | 2 semanas | Beta privada | Testing con DR Group como tenant piloto. Validación de liquidaciones marzo 2026 contra liquidación oficial |

**KPI de éxito Fase 1:**
- ✅ Liquidación de marzo 2026 coincide con la generada por Coljuegos
- ✅ Clasificación TV/TF automática funciona correctamente
- ✅ Arquitectura multi-tenant funcional con 1 tenant de prueba

### 5.3 FASE 2 — Módulos Fundamentales (Mayo - Julio 2026)

**Objetivo:** Construir los módulos que completan la propuesta de valor core para vender.

| Sprint | Duración | Entregable | Features |
|--------|----------|-----------|----------|
| **S5** | 2 semanas | Inventario de Máquinas | F-11 — Colección `maquinas/{nuc}`, ficha con estado, ubicación, historial, integración con liquidaciones |
| **S6** | 2 semanas | Dashboard de Cartera | F-12 — Aging 0-30/31-60/61-90/90+, conciliación cobro/pago, semáforo de mora |
| **S7** | 2 semanas | Contratos Coljuegos | F-13 — Alertas de vencimiento (12/6/3/1 mes), novedades, cumplimiento mínimo |
| **S8** | 2 semanas | Cumplimiento Regulatorio | F-14 — Tablero semáforo: contratos, docs, MET's, conectividad |
| **S9** | 2 semanas | QA + Reportes Coljuegos | F-15 — Pre-llenado declaración mensual, inventario elementos. QA integral |

**KPI de éxito Fase 2:**
- ✅ Primer cliente externo (beta) usando el sistema
- ✅ Dashboard de cartera reduciendo CxC en >30 días
- ✅ Cero sorpresas de vencimiento de contratos

### 5.4 FASE 3 — Diferenciación + Multi-Modalidad (Agosto - Octubre 2026)

**Objetivo:** Agregar funcionalidades que diferencian de cualquier competidor y expandir a nuevas modalidades.

| Sprint | Duración | Entregable | Features |
|--------|----------|-----------|----------|
| **S10** | 2 semanas | Rentabilidad por Sala | F-16 — Producción - costos = margen. ROI por máquina. Ranking de salas |
| **S11** | 2 semanas | Soporte Bingos | F-7 — BLTV = Ventas − Premios, clasificación BINGO ONLINE / NO CONECTADO |
| **S12** | 2 semanas | Soporte ACDV | F-8 — Terminales de Venta, ingresos brutos − premios, disponibilidad |
| **S13** | 2 semanas | Consolidación Multi-Modalidad | F-10 — VPDE = Σ(LTV) + Σ(LTF) por modalidad. Sin compensación cruzada |
| **S14** | 2 semanas | Mesas de Casino + Docs + KPIs | F-9 (Mesas/Esferódromos siempre TF), F-18 (Vencimiento docs), F-19 (KPIs avanzados) |

**KPI de éxito Fase 3:**
- ✅ 3-5 clientes activos pagando suscripción
- ✅ Al menos 1 cliente con multi-modalidad (MET + Bingo o ACDV)
- ✅ MRR de COP $3M+

### 5.5 FASE 4 — Escala + Ventas (Noviembre 2026 - Enero 2027)

**Objetivo:** Crecimiento activo de clientes y optimización del producto.

| Sprint | Duración | Entregable | Features |
|--------|----------|-----------|----------|
| **S15** | 2 semanas | Proveedores Online | F-17 — Fichas IGT/Novomatic, costos por máquina, comparativo |
| **S16** | 2 semanas | Onboarding self-service | Flujo guiado: registro → primer Excel → primera liquidación → primera cuenta de cobro |
| **S17** | 2 semanas | Optimización + React Query | Reducción 75% lecturas Firestore (plan existente en `docs/REACT_QUERY_IMPLEMENTATION.md`) |
| **S18** | 2 semanas | Ventas & Marketing | Landing page, demo interactivo, contenido para Fecoljuegos/Feceazar, caso de estudio DR Group |

**KPI de éxito Fase 4:**
- ✅ 10+ clientes activos
- ✅ MRR de COP $8M+
- ✅ Onboarding < 30 minutos sin intervención humana
- ✅ Churn < 3%

### 5.6 FASE 5 — Futuro SCLM+ (Febrero 2027+)

**Objetivo:** Preparar la plataforma para la era de datos en tiempo real.

| Sprint | Entregable | Features |
|--------|-----------|----------|
| **S19-S20** | Dashboard SCLM+ | F-20 — Monitoreo de transmisión en tiempo real, alertas de no-transmisión |
| **S21-S22** | Reconciliación SCLM+ | Datos propios vs Coljuegos, detección de discrepancias |
| **S23-S24** | API Gateway | API REST para integración con software contable de clientes |

### 5.7 Hitos Clave (Milestones)

| Fecha | Hito | Criterio de Éxito |
|-------|------|-------------------|
| **Mar 2026** | Resolución 20250029784 en vigor | Dashboard adaptado a nueva fórmula |
| **Abr 2026** | Beta validada | Liquidación mar-2026 coincide con Coljuegos |
| **Jun 2026** | Primer cliente externo | Al menos 1 operador externo en beta pagada |
| **Sep 2026** | Product-Market Fit | 5+ clientes, NPS > 50, churn < 5% |
| **Dic 2026** | Escala | 10+ clientes, MRR $8M+, multi-modalidad |
| **Mar 2027** | Consolidación SaaS | 20+ clientes, MRR $20M+, SCLM+ preparado |

---

## 6. RIESGOS Y OPORTUNIDADES REGULATORIAS {#6-riesgos-y-oportunidades-regulatorias}

### 6.1 Análisis de la Resolución 20250029784 — Implicaciones Estratégicas

#### Cambios Clave y su Impacto

| Cambio Regulatorio | Artículo | Impacto en el Dashboard | Acción Requerida |
|-------------------|----------|------------------------|-----------------|
| **Nueva fórmula MET: CoinIn − CoinOut − Jackpots** | Art. 5 | ALTO — Modifica el motor de cálculo core | Actualizar `LiquidacionesPage.jsx` antes de marzo 2026 |
| **6 condiciones para TV** | Art. 4 | ALTO — Se necesita validar conectividad, confiabilidad, eventos, producción | Nuevo módulo de clasificación automática |
| **Eventos significativos (03/05/07/08)** | Art. 6 | MEDIO — Tratamiento especial de deltas de contadores | Parser de eventos en Excel, reglas de prioridad |
| **Valores negativos → cero, sin carryover** | Art. 5, 8 | MEDIO — Reglas de negocio más estrictas | Validaciones en procesamiento de liquidación |
| **No compensación entre modalidades** | Art. 24, Prf. 5° | ALTO si multi-modalidad — Cada tipo se liquida independientemente | Arquitectura de consolidación separada |
| **Protocolo único para ALL modalidades** | Art. 1 | OPORTUNIDAD — Un solo sistema que liquide MET + Bingo + ACDV + Casino | Expandir de MET-only a multi-modalidad |
| **Vigencia desde marzo 2026** | Art. 29 | URGENTE — Quedan semanas para adaptarse | Sprint de emergencia si no está listo |
| **Derogatoria de Res. 20202100002044** | Art. 30 | MEDIO — El protocolo anterior ya no aplica | Eliminar lógica obsoleta del código |
| **Restricción de traslados último día del mes** | Art. 27 | BAJO — Regla del Portal del Operador | Informar a usuarios en el dashboard |
| **Cesión de contratos** | Art. 28 | BAJO — Cedente hasta fin de mes, cesionario desde el 1° del siguiente | Manejar cambio de titularidad en el sistema |

#### Resolución 20211200034224 de 2021 — Confiabilidad MET

Esta resolución (referenciada en los considerandos de la Res. 20250029784) establece el marco de **confiabilidad de las MET y la gradualidad en su implementación**. Sus conceptos clave ahora están **absorbidos e integrados** en la nueva resolución:

| Concepto de la Res. 2021 | Cómo se integra en la Res. 2025 |
|--------------------------|--------------------------------|
| **Confiabilidad del SCLM** | Condición #2 de las 6 para clasificación TV (Art. 4) |
| **Confiabilidad de la MET** | Condición #3 de las 6 para clasificación TV (Art. 4) |
| **Gradualidad** | Ya no aplica gradualidad — la Res. 2025 es definitiva desde marzo 2026 |
| **Porcentajes mínimos de disponibilidad** | Ahora definidos en el Anexo Técnico de Confiabilidad |
| **Memorando 20250192993** | Referenciado en Art. 7 como criterio para detectar "ventas atípicas" |

### 6.2 Mapa de Riesgos

```
                          PROBABILIDAD
                     Baja ◄───────────────► Alta
                  ┌────────────────────────────────┐
           Alto   │                    │            │
                  │  Cambio radical    │ Excel de   │
                  │  en Ley 643       │ Coljuegos  │
                  │                    │ cambia     │
      I           │  Competidor       │ formato    │
      M           │  fuerte entra     │            │
      P   ────────┼────────────────────┼────────────┤
      A           │                    │            │
      C           │  Firebase se      │ SCLM+      │
      T           │  vuelve costoso   │ reduce     │
      O           │                    │ necesidad  │
                  │  Operador grande  │ de Excel   │
           Bajo   │  hace sw propio   │            │
                  │                    │            │
                  └────────────────────────────────┘
```

### 6.3 Análisis de Riesgos Específicos

#### RIESGO 1: SCLM+ hace obsoleto el procesamiento de Excel
| Aspecto | Detalle |
|---------|---------|
| **Probabilidad** | Media-Alta (2-3 años) |
| **Impacto** | Alto si el Excel desaparece |
| **Mitigación** | Posicionar DR Group como **intermediario inteligente** del SCLM+. El SCLM+ transmite datos CRUDOS a Coljuegos — el operador aún necesita PROCESAR y ENTENDER esos datos |
| **Oportunidad** | Nuevo módulo de monitoreo de transmisión SCLM+ (F-20) es aún MÁS valioso que procesar Excel porque es en TIEMPO REAL |

#### RIESGO 2: Coljuegos modifica el formato del Excel mensual
| Aspecto | Detalle |
|---------|---------|
| **Probabilidad** | Alta (podría cambiar para reflejar CoinIn/CoinOut/Jackpots) |
| **Impacto** | Medio — requiere actualizar parser |
| **Mitigación** | Parser con auto-detección flexible de encabezados (ya implementado). Agregar detección de columnas nuevas (CoinIn, CoinOut, Jackpots) |
| **Oportunidad** | Ser el primero en soportar el nuevo formato refuerza posicionamiento |

#### RIESGO 3: Cambios legislativos en la Ley 643
| Aspecto | Detalle |
|---------|---------|
| **Probabilidad** | Baja-Media (ya fue modificada por Ley 2294/2023) |
| **Impacto** | Variable — depende del alcance de la reforma |
| **Mitigación** | Todas las constantes (12%, 1%, 80 MET's, tarifas SMMLV) deben ser configurables vía `system_config`, NUNCA hardcodeadas |
| **Oportunidad** | Cada cambio regulatorio genera demanda de actualización de herramientas |

#### RIESGO 4: Competidor con más recursos entra al mercado
| Aspecto | Detalle |
|---------|---------|
| **Probabilidad** | Media (mercado pequeño pero rentable) |
| **Impacto** | Alto si tiene red comercial |
| **Mitigación** | Velocidad + conocimiento regulatorio + base instalada + switching costs |
| **Oportunidad** | Validación del mercado — si alguien más entra, confirma la oportunidad |

### 6.4 Mapa de Oportunidades Regulatorias

| Oportunidad | Fuente | Temporalidad | Valor |
|-------------|--------|-------------|-------|
| **Adaptación a Res. 20250029784** | Art. 29 — vigencia marzo 2026 | INMEDIATA | Capturar operadores que no entienden el nuevo protocolo |
| **Multi-modalidad** | Títulos II-V de la resolución | 6-12 meses | Expandir de MET-only a Bingos, ACDV, Mesas |
| **Certificación de confiabilidad** | Art. 4, condiciones 2-3 | Post SCLM+ | Herramienta que ayude al operador a cumplir los % de confiabilidad |
| **Preparación para SCLM+** | Resoluciones 2024 | 12-24 meses | Ser el "bridge" entre la operación del operador y los requisitos del SCLM+ |
| **Consultoría + Software** | Complejidad del protocolo | Continuo | Vender no solo software, sino conocimiento regulatorio embebido |
| **Alianza con Fecoljuegos/Feceazar** | Gremios empresariales | 3-6 meses | Canal de distribución natural — los gremios buscan herramientas para sus afiliados |
| **Eventos del sector** | SAGSE, LAC Gaming | Semestral | Exposición como solución colombiana nativa |

---

## 7. ANÁLISIS COMPETITIVO {#7-análisis-competitivo}

### 7.1 Panorama Competitivo

| Categoría | Competidores | Fortaleza | Debilidad vs DR Group |
|-----------|-------------|-----------|----------------------|
| **Software internacional de casino** | IGT Advantage, Bally CMS, DRGT, Konami Synkros | Madurez, features avanzadas de slot management | No entienden regulación colombiana (Ley 643, tarifas, NUC's). Precio prohibitivo (USD $50K-$200K+). Diseñados para casinos integrados, NO para operadores de salas distribuidas |
| **ERPs genéricos** | SAP, Oracle, Siigo, World Office | Contabilidad robusta | No tienen módulo de liquidación de JSA, no procesan Excel de Coljuegos, no generan cuentas de cobro específicas del sector |
| **Excel + Google Sheets** | El competidor #1 actual | Costo cero, ubiquidad | Sin automatización, propenso a errores, no escala, no alerta de vencimientos, no genera documentos automáticos |
| **Desarrollos propios** | Algunos grandes operadores | Personalización total | Caro de mantener ($10M+/año en desarrollador interno), no compartido entre operadores, sin soporte ni actualizaciones regulatorias |
| **Startups locales** | No identificadas aún | — | No hay producto SaaS colombiano especializado en JSA localizados (océano azul confirmado) |

### 7.2 Análisis de Sustitutos

| Sustituto | Uso Actual | Limitación | Ventaja DR Group |
|-----------|-----------|-----------|------------------|
| **Hoja de Excel manual** | 80%+ de operadores | Errores de cálculo, sin alertas, sin trazabilidad | Automatización + cero errores + auditoría |
| **Contador externo** | ~60% de operadores | Costo ($2M-$5M/mes), dependencia personal, no tiempo real | Self-service 24/7, costo menor, resultados inmediatos |
| **Asistente administrativo** | ~90% de operadores | Tiempo 4+ horas para procesar 1 Excel, rotación de personal | 30 segundos para procesar, independiente del personal |
| **Portal del Operador (Coljuegos)** | 100% (obligatorio) | Solo muestra datos crudos, no analiza ni consolida ni genera CdC | Inteligencia operacional sobre datos crudos |

### 7.3 Ventaja Competitiva Sostenible (Moat)

```
┌─────────────────────────────────────────────────────────────────┐
│                       MOAT DE DR GROUP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONOCIMIENTO REGULATORIO EMBEBIDO                          │
│     • Ley 643, Decreto 2372, Res. 20250029784                 │
│     • Fórmulas exactas de liquidación parametrizadas           │
│     • Actualizaciones automáticas ante cambios normativos      │
│                                                                 │
│  2. PROCESAMIENTO NATIVO DE EXCEL DE COLJUEGOS                 │
│     • Parser con auto-detección de encabezados                 │
│     • Auto-match por contrato                                  │
│     • Imposible de replicar sin acceso al formato real         │
│                                                                 │
│  3. SWITCHING COSTS                                             │
│     • Datos históricos de liquidaciones (meses/años)           │
│     • Configuración de salas, máquinas, contratos              │
│     • Capacitación del equipo operativo                        │
│     • Integración con flujo de trabajo existente               │
│                                                                 │
│  4. EFECTO DE RED (futuro)                                      │
│     • Más operadores → más datos comparativos                  │
│     • Benchmarking anónimo entre operadores                    │
│     • Comunidad de mejores prácticas regulatorias              │
│                                                                 │
│  5. BASE INSTALADA + ITERACIÓN                                 │
│     • DR Group como cliente piloto = conocimiento real         │
│     • Cada mes se procesan liquidaciones reales                │
│     • Feedback loop más rápido que cualquier competidor        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Posicionamiento vs Alternativas

| Dimensión | Excel Manual | ERP Genérico | SW Internacional | **DR Group** |
|-----------|-------------|-------------|-----------------|-------------|
| **Costo mensual** | $0 | $200K-$1M | $5M-$20M+ | **$280K-$3M** |
| **Regulación colombiana** | Manual | ❌ | ❌ | **✅ Nativa** |
| **Procesa Excel Coljuegos** | Manual | ❌ | ❌ | **✅ Automático** |
| **Multi-modalidad (Res. 2025)** | Manual | ❌ | Parcial | **✅ Planificado** |
| **Cuentas de Cobro** | Manual | Genérica | ❌ | **✅ Específica JSA** |
| **Multi-empresa** | Difícil | ✅ | ✅ | **✅ Nativo** |
| **Máquinas en cero** | Imposible | ❌ | Posible | **✅ Automático** |
| **APK Empleados** | ❌ | Posible | ❌ | **✅ Incluida** |
| **Implementación** | Inmediata | 3-6 meses | 6-12+ meses | **< 1 día** |
| **Soporte en español** | N/A | Variable | ❌/Limitado | **✅ Nativo** |

---

## 8. ESTRATEGIA DE PRICING {#8-estrategia-de-pricing}

### 8.1 Filosofía de Pricing

> **Principio:** El precio debe ser **una fracción del ahorro** que genera al operador.
>
> Si un operador ahorra 4 horas de trabajo × 22 días × COP $25,000/hora = COP $2,200,000/mes en mano de obra directa, más errores de cálculo evitados (que pueden costar sanciones de COP $10M+), el precio de COP $500K-$2M/mes se justifica económicamente con creces.

### 8.2 Modelos de Pricing Evaluados

| Modelo | Ventajas | Desventajas | Recomendación |
|--------|----------|-------------|---------------|
| **Por MET/mes** | Escala con el cliente, justo, predecible | Clientes con muchas MET's podrían resistir | ✅ **RECOMENDADO** — Alinea incentivos |
| **Por sala/mes** | Más simple de comunicar | No refleja complejidad (salas de 20 vs 150 MET's) | ⚠️ Alternativa válida |
| **Tarifa fija por tier** | Simple, sin sorpresas | No escala bien, subsidia grandes operadores | ⚠️ Para plan de entrada |
| **Por transacción** | Pay-per-use | Impredecible, causa "ansiedad de uso" | ❌ No recomendado |
| **Freemium** | Atrae usuarios | Difícil monetizar en mercado pequeño | ❌ No recomendado para Y1 |

### 8.3 Pricing Recomendado — Modelo por MET/mes

#### Tabla de Precios

| Rango de MET's | Precio por MET/mes | Rango Mensual | Incluye |
|----------------|-------------------|---------------|---------|
| **80-150** (Esencial) | COP $5,000 | $400K - $750K | Procesamiento Excel, Liquidación MET, Dashboard, 1 empresa |
| **151-300** (Profesional) | COP $3,500 | $528K - $1,050K | + Multi-empresa, Cuentas de Cobro PDF, Cartera, APK |
| **301-500** (Premium) | COP $2,800 | $842K - $1,400K | + Multi-modalidad, Reportes Coljuegos, Rentabilidad |
| **501+** (Enterprise) | COP $2,000 | $1,002K+ | + SCLM+, API, Soporte Priority, SLA 99.5% |

#### Descuentos

| Tipo | Descuento | Condición |
|------|----------|-----------|
| **Pago anual** | 15% | Pago de 12 meses por adelantado |
| **Early adopter** | 20% | Primeros 10 clientes (lifetime) |
| **Referido** | 1 mes gratis | Por cada cliente referido que active |
| **Gremio** | 10% | Afiliados a Fecoljuegos o Feceazar |

#### Setup Fees

| Servicio | Precio |
|----------|--------|
| **Configuración básica** (1 empresa, importar salas) | COP $500K |
| **Migración de datos** (liquidaciones históricas) | COP $1M - $3M |
| **Capacitación presencial** (4 horas) | COP $800K |
| **Capacitación virtual** (2 horas) | COP $400K |
| **Consultoría regulatoria** (Resolución 20250029784) | COP $1.5M por sesión |

### 8.4 Análisis de Valor para el Cliente

```
┌─────────────────────────────────────────────────────────────────┐
│              ROI PARA UN OPERADOR MEDIANO (200 MET's)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COSTOS SIN DR GROUP (mensual):                                │
│  ├── Asistente administrativo (parcial): COP $800,000          │
│  ├── Tiempo del operador en Excel: COP $600,000                │
│  ├── Errores de cálculo promedio: COP $500,000                 │
│  ├── Riesgo de sanción (prorrateo): COP $400,000               │
│  ├── Contador para declaraciones: COP $300,000                 │
│  └── TOTAL COSTO ACTUAL: COP $2,600,000/mes                   │
│                                                                 │
│  COSTOS CON DR GROUP:                                           │
│  ├── Suscripción (200 × $3,500): COP $700,000                 │
│  ├── Tiempo operador (supervisión): COP $100,000               │
│  └── TOTAL CON DR GROUP: COP $800,000/mes                     │
│                                                                 │
│  ═══════════════════════════════════════════════                │
│  AHORRO MENSUAL: COP $1,800,000                                │
│  AHORRO ANUAL: COP $21,600,000                                 │
│  ROI: 225% (ahorro / costo DR Group)                           │
│  PAYBACK: < 1 mes                                               │
│  ═══════════════════════════════════════════════                │
│                                                                 │
│  SIN CONTAR: Sanciones evitadas, tiempo ganado para crecer,    │
│  transparencia con clientes, trazabilidad de auditoría         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Elasticidad y Sensibilidad

| Escenario | Precio/MET | Clientes Y1 | MRR Estimado | Riesgo |
|-----------|-----------|-------------|-------------|--------|
| **Agresivo (penetración)** | $2,500 | 15-20 | $6M-$10M | Margen bajo, difícil subir después |
| **Moderado (recomendado)** | $3,500 | 10-15 | $5M-$8M | Balance valor/volumen |
| **Premium** | $5,000 | 5-8 | $4M-$6M | Pocos clientes, alto churn risk |
| **Value-based** | Personalizado | Variable | Variable | Complejidad operativa |

### 8.6 Estrategia de Go-to-Market

```
FASE 1 (Mes 1-3): VALIDACIÓN
├── Precio: Early Adopter -20%
├── Canal: Contacto directo (Diego conoce operadores)
├── Meta: 2-3 clientes beta pagando
└── Estrategia: "Resolvemos tu problema con la Resolución 20250029784"

FASE 2 (Mes 4-6): TRACCIÓN
├── Precio: Lista regular
├── Canal: Gremios (Fecoljuegos, Feceazar) + referidos
├── Meta: 5-8 clientes activos
└── Estrategia: Casos de éxito + demos en eventos del sector

FASE 3 (Mes 7-12): ESCALA
├── Precio: Descuento por volumen para holdings
├── Canal: Website + demos self-service + inside sales
├── Meta: 10-15 clientes, $8M MRR
└── Estrategia: "La plataforma que usan los operadores serios"

FASE 4 (Año 2): CONSOLIDACIÓN
├── Precio: Revisión anual basada en datos
├── Canal: Partnerships con proveedores (IGT, Novomatic)
├── Meta: 20-30 clientes, $20M MRR
└── Estrategia: Estándar de facto de la industria colombiana
```

---

## APÉNDICE A: RESUMEN DE LA RESOLUCIÓN 20250029784

### Datos del Acto Administrativo

| Campo | Valor |
|-------|-------|
| **Número** | 20250029784 |
| **Fecha de expedición** | 26 de diciembre de 2025 |
| **Código del documento** | GJU-FR-001, Versión 19 |
| **Vigencia** | Desde liquidación de marzo de 2026 (liberada abril 2026) |
| **Firmante** | Marco Emilio Hincapié Ramírez, Presidente de Coljuegos |
| **Deroga** | Resolución 20202100002044 del 31 de enero de 2020 (Protocolo MET anterior) |

### Estructura de la Resolución

| Título | Artículos | Contenido | Vigencia |
|--------|-----------|-----------|----------|
| **I — Disposiciones Generales** | Art. 1-2 | Objeto, definiciones generales (TV, TF, conectividad, confiabilidad, SCL's) | Marzo 2026 |
| **II — MET** | Art. 3-10 | Definiciones MET, liquidación TV/TF, eventos significativos, VBL, obligaciones | Marzo 2026 (Parágrafo 2°) |
| **III — Bingos** | Art. 11-15 | SCLB, MCJ, tramas, BINGO ONLINE vs NO CONECTADO, validaciones | Desde publicación (Parágrafo 3°) |
| **IV — ACDV** | Art. 16-19 | SCJ, TDV, disponibilidad, liquidación ingresos − premios | Desde publicación (Parágrafo 4°) |
| **V — Mesas/Esferódromos** | Art. 20-23 | Siempre TF, proporcional por días, obligaciones, sanciones | Desde publicación |
| **VI — Liquidación Consolidada** | Art. 24-30 | VPDE, GA (1%), VL total, no compensación, cesión contratos, vigencia | Marzo 2026 |

### Fórmulas Clave

```
═══════════════════════════════════════════════════════════════
MET (Tarifa Variable):
  BLTV_MET  = Σ(ΔtE) − Σ(ΔtS) − Σ(ΔtP)
              CoinIn     CoinOut    Jackpots
  LTV_MET   = Σ(BLTV por cada MET clasificada TV) × 12%
  Si BLTV < 0 → BLTV = 0 (sin carryover)

MET (Tarifa Fija):
  LTF_MET   = Tarifa SMMLV según Art. 34 Ley 643

═══════════════════════════════════════════════════════════════
BINGO (Tarifa Variable):
  BLTV_BINGO = Σ(Ventas) − Σ(Premios)
  LTV_BINGO  = BLTV × 12%

═══════════════════════════════════════════════════════════════
ACDV (Tarifa Variable):
  BLTVt      = Σ(Ingresos Brutos) − Σ(Premios Pagados)
               por terminal t en período [n,N]
  BLTVj      = Σ(BLTVt para todos los TDV en TV)
  LTV_ACDV   = BLTVj × 12%

ACDV (Tarifa Fija — si IB > 0):
  LTF        = IB × 17% (Art. 34, Numeral 5, Ley 643)

ACDV (Tarifa Fija — si IB ≤ 0):
  LTF        = 4 SMLMV por terminal

═══════════════════════════════════════════════════════════════
MESAS/ESFERÓDROMOS (siempre TF):
  LTF        = (TF / I) × n
               Tarifa fija mensual / días mes × días operación

═══════════════════════════════════════════════════════════════
CONSOLIDACIÓN:
  VPDE       = Σ(LTV) + Σ(LTF)         (sin compensación entre modalidades)
  GA         = VPDE × 1%
  VL         = VPDE + GA
═══════════════════════════════════════════════════════════════
```

### 6 Condiciones para Clasificación TV (Art. 4 — MET)

| # | Condición | Criterio |
|---|-----------|---------|
| 1 | Conectividad | Cumple requisitos técnicos vigentes de conexión al SCLM+ |
| 2 | Confiabilidad del SCLM | % de disponibilidad del sistema de conexión cumple mínimo |
| 3 | Confiabilidad de la MET | % de disponibilidad de la máquina individual cumple mínimo |
| 4 | Evento 00 diario | La MET reporta cierre diario (evento significativo 00) todos los días del período |
| 5 | Sin cero prolongado | No registra ventas en 0 por más de 1 mes consecutivo |
| 6 | Requisitos técnicos | Cumple todos los demás requerimientos técnicos establecidos por Coljuegos |

**Si falla CUALQUIERA → Tarifa Fija (TF) para ese período.**

---

## APÉNDICE B: GLOSARIO EJECUTIVO

| Término | Significado |
|---------|------------|
| **JSA** | Juegos de Suerte y Azar — Industria regulada por Coljuegos |
| **MET** | Máquina Electrónica Tragamonedas — Elemento principal de juego localizado |
| **CoinIn** | Total de dinero insertado en la máquina (contador de entradas) |
| **CoinOut** | Total de dinero pagado por la máquina (contador de salidas) |
| **Jackpot** | Premios progresivos o especiales pagados (contador independiente) |
| **BLTV** | Base de Liquidación por Tarifa Variable = CoinIn − CoinOut − Jackpots |
| **LTV** | Liquidación por Tarifa Variable = BLTV × 12% |
| **LTF** | Liquidación por Tarifa Fija (según Art. 34 Ley 643) |
| **TV** | Tarifa Variable — Clasificación de MET que cumple 6 condiciones |
| **TF** | Tarifa Fija — Clasificación de MET que NO cumple alguna condición |
| **VPDE** | Valor a Pagar por Derechos de Explotación = Σ(LTV) + Σ(LTF) |
| **GA** | Gastos de Administración = VPDE × 1% |
| **VL** | Valor Total de Liquidación = VPDE + GA |
| **NUC** | Número Único de Clasificación — ID regulatorio de cada máquina |
| **SCLM+** | Sistema de Conexión en Línea MET — Plataforma de Coljuegos para tiempo real |
| **SCLB** | Sistema de Conexión en Línea de Bingos |
| **SCJ** | Sistema Central del Juego (para ACDV) |
| **MCJ** | Módulo de Control de Juego (para Bingos) |
| **ACDV** | Apuestas en Carreras y Deportes Virtuales |
| **TDV** | Terminal de Venta ACDV |
| **SMMLV** | Salario Mínimo Mensual Legal Vigente (~COP $1,423,500 en 2026) |
| **Modelo A** | Operador directo — tiene contrato y opera sus propias salas |
| **Modelo B** | Concesionario — tiene contrato pero sus clientes operan las salas |
| **Fecoljuegos** | Federación Colombiana de Juegos — Gremio de operadores |
| **Feceazar** | Federación Colombiana de Empresarios de Azar — Gremio empresarial |
| **MRR** | Monthly Recurring Revenue — Ingreso mensual recurrente |
| **ARR** | Annual Recurring Revenue — Ingreso anual recurrente |
| **TAM/SAM/SOM** | Total/Serviceable/Obtainable Addressable Market |
| **Churn** | Tasa de cancelación de clientes |
| **LTV/CAC** | Lifetime Value / Customer Acquisition Cost — Métrica de eficiencia |

---

## APÉNDICE C: REFERENCIAS NORMATIVAS

| # | Norma | Descripción | Relevancia para DR Group |
|---|-------|-------------|-------------------------|
| 1 | **Ley 643 de 2001** | Régimen del monopolio rentístico de JSA | Marco legal fundamental. Art. 32-44 para juegos localizados |
| 2 | **Ley 1955 de 2019** | Plan Nacional de Desarrollo | Art. 59: Tarifa variable del 12% con condiciones de conectividad |
| 3 | **Decreto Ley 2106 de 2019** | Simplificación de trámites | Art. 56: Resultados negativos igualados a cero |
| 4 | **Decreto 2372 de 2019** | Reglamenta Art. 59 Ley 1955 | Condiciones de conectividad y confiabilidad |
| 5 | **Decreto 1068 de 2015** | Decreto Único Reglamentario Hacienda | Libro 2, Parte 7, Título 5: juegos localizados |
| 6 | **Resolución 20250029784 de 2025** | Protocolo Integral de Liquidación v19 | **NUEVA** — Unifica y reemplaza todos los protocolos anteriores |
| 7 | **Resolución 20211200034224 de 2021** | Confiabilidad MET y gradualidad | Absorbida por la Res. 2025. Establece framework de confiabilidad |
| 8 | **Resolución 20202100002044 de 2020** | Protocolo MET anterior | **DEROGADA** por Res. 2025. Ya no aplica desde marzo 2026 |
| 9 | **Resolución 20241200014754 de 2024** | Requerimientos Técnicos SCLM+ | Especificaciones técnicas de conexión en línea |
| 10 | **Resolución 20245100027144 de 2024** | Modificación plazos SCLM+ | Ajustes de cronograma de implementación |
| 11 | **Ley 1393 de 2010** | Sanciones JSA | Art. 14 y 20: Sanciones por evasión |
| 12 | **Ley 599 de 2000** | Código Penal | Art. 312: Ejercicio ilícito de actividad monopolística |
| 13 | **Decreto 2483 de 2003** | Operación a través de terceros | Base legal de la concesión a operadores |
| 14 | **Memorando 20250192993 de 2025** | Ventas atípicas | Criterios para detectar comportamiento atípico en ventas MET |

---

> **DISCLAIMER:** Este documento es un análisis estratégico interno elaborado con base en información pública de Coljuegos, la Resolución 20250029784 del 26 de diciembre de 2025, la Ley 643 de 2001 y sus modificaciones, y el análisis del producto DR Group Dashboard. No constituye asesoría legal, tributaria ni de inversión. Para decisiones regulatorias o fiscales, consultar siempre con profesionales especializados en derecho de juegos de suerte y azar.

---

**Documento elaborado:** Febrero 2026
**Próxima revisión:** Abril 2026 (post primera liquidación bajo nuevo protocolo)
**Responsable:** Consultoría Estratégica — DR Group
