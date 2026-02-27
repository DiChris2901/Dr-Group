# ANÁLISIS ESTRATÉGICO: DR GROUP DASHBOARD vs. INDUSTRIA DE JUEGOS DE SUERTE Y AZAR EN COLOMBIA

> **Documento de Investigación y Roadmap de Producto**
> **Fecha:** Febrero 2026
> **Autor:** Análisis generado por IA — Arquitecto de Software Senior
> **Versión:** 1.0.0
> **Clasificación:** Documento interno estratégico

---

## TABLA DE CONTENIDOS

1. [Marco Regulatorio — Coljuegos y la Ley 643 de 2001](#1-marco-regulatorio)
2. [Tipos de Juegos Localizados](#2-tipos-de-juegos-localizados)
3. [Obligaciones del Concesionario](#3-obligaciones-del-concesionario)
4. [Sistema Tributario de JSA](#4-sistema-tributario-de-jsa)
5. [SCLM+ — Sistema de Conexión en Línea (Futuro Crítico)](#5-sclm)
6. [Modelo de Negocio DR Group](#6-modelo-de-negocio-dr-group)
7. [Auditoría del Dashboard Actual](#7-auditoría-del-dashboard-actual)
8. [Lo que Tienes que SÍ SIRVE](#8-lo-que-sirve)
9. [Lo que Tienes que NO SIRVE o SOBRA](#9-lo-que-no-sirve)
10. [Lo que NO TIENES y NECESITAS](#10-lo-que-no-tienes)
11. [Mapa Funcional Completo](#11-mapa-funcional)
12. [Roadmap de Implementación por Fases](#12-roadmap)
13. [Visión SaaS para Operadores de JSA](#13-vision-saas)
14. [Riesgos Regulatorios](#14-riesgos)
15. [Glosario de Términos](#15-glosario)

---

## 1. MARCO REGULATORIO — Coljuegos y la Ley 643 de 2001 {#1-marco-regulatorio}

### 1.1 ¿Qué es Coljuegos?

**Coljuegos** (Empresa Industrial y Comercial del Estado Administradora del Monopolio Rentístico de los Juegos de Suerte y Azar) es la entidad del gobierno colombiano que:

- **Administra** el monopolio rentístico de todos los juegos de suerte y azar
- **Autoriza** la operación de juegos localizados mediante contratos de concesión
- **Fiscaliza** el cumplimiento de obligaciones tributarias y regulatorias
- **Sanciona** la operación ilegal con multas millonarias y denuncias penales

**Datos de contacto oficial:**
- Dirección: Cra 11 No. 93A - 85, Bogotá D.C.
- PBX: +57 (601) 742 33 68
- Línea Gratuita: 01 8000 18 28 88
- Email: contactenos@coljuegos.gov.co
- Denuncias: denunciealilegal@coljuegos.gov.co / 01 8000 18 04 17
- Web: [www.coljuegos.gov.co](https://www.coljuegos.gov.co)

### 1.2 La Ley 643 de 2001 — Régimen del Monopolio Rentístico

**Norma madre:** "Por la cual se fija el régimen propio del monopolio rentístico de juegos de suerte y azar."

**Principios fundamentales (Art. 3):**

| Principio | Descripción |
|-----------|-------------|
| **Finalidad social prevalente** | Todo JSA debe contribuir a financiar el servicio público de salud |
| **Transparencia** | La operación debe estar exenta de fraudes o vicios |
| **Racionalidad económica** | Operación con criterios de eficiencia y rentabilidad |
| **Vinculación de la renta a salud** | Los recursos financian servicios de salud — esa es la razón del monopolio |

**Artículos clave para operadores de juegos localizados:**

| Artículo | Tema | Implicación para DR Group |
|----------|------|--------------------------|
| **Art. 1** | Definición del monopolio | El Estado tiene facultad EXCLUSIVA de explotar, organizar, administrar, operar, controlar y vigilar |
| **Art. 4** | Juegos prohibidos | Operación sin concesión = interrupción inmediata + sanciones penales |
| **Art. 7** | Operación mediante terceros | Requiere contrato de concesión (3-5 años). La renta = derechos de explotación |
| **Art. 8** | Derechos de explotación | Porcentaje de ingresos brutos que se paga a Coljuegos |
| **Art. 9** | Gastos de administración | Máximo 1% de los derechos de explotación |
| **Art. 32** | Juegos localizados | Definición: MET's, bingos, esferódromos, casinos. Requiere 80 MET's mínimo |
| **Art. 33** | Modalidad de operación | Solo por intermedio de terceros, previa autorización + contrato de concesión |
| **Art. 34** | Tarifas de derechos | Tabla de tarifas mensuales por tipo de elemento |
| **Art. 35** | Ubicación | Solo en establecimientos de comercio en zonas aptas para actividades comerciales |
| **Art. 41** | Declaración y pago | Dentro de los primeros 10 días hábiles del mes siguiente |
| **Art. 43** | Facultades de fiscalización | Coljuegos puede verificar liquidaciones, adelantar investigaciones, exigir documentos |
| **Art. 44** | Sanciones por evasión | Sin concesión: 200% de derechos causados + cierre + denuncia penal |

### 1.3 Normatividad Complementaria

| Norma | Descripción |
|-------|-------------|
| **Decreto 1068 de 2015** | Decreto Único Reglamentario del Sector Hacienda (Libro 2, Parte 7, Título 5: juegos localizados) |
| **Decreto 2483 de 2003** | Operación de juegos localizados a través de terceros |
| **Resolución 20182300011754 de 2018** | Concesión de juegos localizados |
| **Resolución 20181000016094 de 2018** | Regulación complementaria |
| **Resolución 20241200014754 de 2024** | Requerimientos Técnicos SCLM+ (Sistema de Conexión en Línea MET) |
| **Resolución 20245100027144 de 2024** | Modifica plazos del SCLM+ |
| **Ley 1393 de 2010** | Modificaciones a sanciones (Art. 14 y 20) |
| **Ley 1955 de 2019** | Plan Nacional de Desarrollo (Art. 59 — juegos localizados) |
| **Decreto 808 de 2020** | Modificaciones por COVID-19 |
| **Ley 599 de 2000** | Código Penal — Art. 312: Ejercicio ilícito de actividad monopolística |

---

## 2. TIPOS DE JUEGOS LOCALIZADOS {#2-tipos-de-juegos-localizados}

### 2.1 Definición Legal

> **Art. 32, Ley 643 de 2001:** "Son modalidades de juegos de suerte y azar que operan con equipos o elementos de juego, en establecimientos de comercio, a los cuales asisten los jugadores como condición necesaria para poder apostar."

### 2.2 Elementos de Juego Reconocidos

#### A. Máquinas Electrónicas Tragamonedas (MET's) — **FOCO PRINCIPAL DE DR GROUP**

| Característica | Detalle |
|---------------|---------|
| **Definición** | Elementos de juego que a cambio de una cantidad de dinero otorgan tiempo de juego y eventualmente un premio en efectivo |
| **Frecuencia** | Permanente |
| **Tipos de apuesta** | $0 a $500; $500 en adelante; Progresivas interconectadas |
| **Canal de distribución** | Locales comerciales cuyo objeto social EXCLUSIVO sea la operación de JSA |
| **Selección del operador** | Persona jurídica + Autorización de Coljuegos + Contrato de concesión + Concepto previo del alcalde |
| **Tipo de juego** | Apuesta de contrapartida |
| **Operación ilegal** | Multa de 80 SMMLV (~$72.6M COP en 2026) por máquina + denuncia penal |
| **Identificación** | Cada MET tiene un NUC (Número Único de Clasificación) y un Serial físico |

**Regla Crítica:** El local comercial donde se operen MET's **debe tener como objeto social exclusivo** la operación de juegos de suerte y azar. Excepción: MET's cuya actividad comercial principal es diferente a salas de JSA (regulación separada).

#### B. Mesas de Casino

| Tipo | Tarifa Mensual |
|------|---------------|
| Black Jack | 4 SMMLV |
| Póker | 4 SMMLV |
| Bacará | 4 SMMLV |
| Craps | 4 SMMLV |
| Punto y Banca | 4 SMMLV |
| Ruleta | 4 SMMLV |

**Definición legal de Ruleta:** "Juego de azar en el que se usa una rueda horizontal giratoria numerada por la que se mueve una esfera que al detenerse indica el número que ha ganado la apuesta."

**Definición legal de Casino:** "Locales comerciales en los cuales se desarrollan actividad de juegos de suerte y azar que operan con diferentes elementos de juego: mesas de póquer, ruletas, máquinas tragamonedas, esferódromos, y otras modalidades de juegos localizados."

#### C. Bingos

| Característica | Detalle |
|---------------|---------|
| **Mecánica** | Marcar en tablero/cartón el número anunciado por locutor |
| **Elementos** | Tablero/cartón, tómbola, balotas enumeradas |
| **Frecuencia** | Permanente |
| **Tipo** | Apuesta paramutual |
| **Premios** | Se distribuyen entre ganadores |
| **Normatividad** | Ley 643 de 2001, Resolución 20182300011754 de 2018, Decreto 808 de 2020 |
| **Operación ilegal** | Multa de 1 SMMLV por silla (mínimo 50-200 sillas según habitantes del municipio) |

**Tarifas de Bingo por silla:**

| Municipio | Tipo Cartón | Tarifa por Silla |
|-----------|-------------|-----------------|
| < 100,000 hab. | Hasta $250 | 1.0 SMDLV |
| < 100,000 hab. | > $250 | 1.5 SMDLV |
| > 100,000 hab. | Hasta $250 | 1.0 SMDLV |
| > 100,000 hab. | $250 a $500 | 1.5 SMDLV |
| > 100,000 hab. | > $500 | 3.0 SMDLV |
| Interconectadas | Cualquier tipo | +1 SMDLV adicional |

#### D. Esferódromos

- Tarifa: 4 SMMLV mensuales
- Elemento de juego localizado

#### E. Apuestas en Carreras y Deportes Virtuales (ACDV)

- Modalidad más reciente autorizada por Coljuegos
- Operación en locales autorizados

#### F. Videobingos

- Variante electrónica del bingo tradicional
- Requiere las mismas autorizaciones

### 2.3 Requisitos para Operar Juegos Localizados

| # | Requisito | Detalle |
|---|-----------|---------|
| 1 | **Persona Jurídica** | Solo empresas, no personas naturales |
| 2 | **Autorización Previa** | Emitida por Coljuegos antes de iniciar operación |
| 3 | **Contrato de Concesión** | Mínimo 3 años, máximo 5 años (Art. 7) |
| 4 | **Mínimo 80 MET's** | O su equivalente combinando con otros elementos de juego |
| 5 | **Concepto de Uso de Suelos** | Expedido por autoridad municipal o curador urbano |
| 6 | **Cámara de Comercio** | Registro mercantil vigente |
| 7 | **Concepto Previo Favorable del Alcalde** | Zona apta para actividades comerciales (POT/EOT) |
| 8 | **Objeto Social Exclusivo** | Para locales de MET's: la operación de JSA debe ser la actividad principal |

### 2.4 Tipos de Trámites ante Coljuegos

| Trámite | Descripción |
|---------|-------------|
| **Autorización para Operación** | Solicitar contrato de concesión nuevo |
| **Novedad de Adición** | Agregar más elementos de juego al contrato |
| **Novedad de Reemplazo** | Retirar elementos y simultáneamente agregar la misma cantidad con idéntica apuesta |
| **Novedad de Traslado** | Retirar elementos de un local y ubicarlos en otro |
| **Retiro o Disminución** | Disminuir la cantidad de elementos operando |

---

## 3. OBLIGACIONES DEL CONCESIONARIO {#3-obligaciones-del-concesionario}

### 3.1 Obligaciones Tributarias

| Obligación | Base | Frecuencia | Plazo |
|-----------|------|------------|-------|
| **Derechos de Explotación** | 12% de ingresos brutos (producción) | Mensual | Primeros 10 días hábiles del mes siguiente |
| **Gastos de Administración** | 1% de los derechos de explotación | Mensual | Junto con los derechos |
| **Tarifa Fija (MET's)** | % del SMMLV según tipo de máquina | Mensual | Cuando aplique (vs tarifa variable) |
| **Declaración mensual** | Formulario de liquidación ante Coljuegos | Mensual | Primeros 10 días hábiles del mes siguiente |

### 3.2 Obligaciones Operativas

| Obligación | Detalle |
|-----------|---------|
| **Mantener mínimo de elementos** | 80 MET's o equivalente durante toda la vigencia del contrato |
| **Ubicación autorizada** | Cada máquina debe estar en el local declarado ante Coljuegos |
| **Reportar novedades** | Traslados, reemplazos, adiciones y retiros |
| **Documentación vigente** | Cámara de Comercio, Uso de Suelos, concepto del alcalde |
| **Contabilidad separada** | Registro diario manual o magnético de apuestas (Art. 26) |
| **Disponibilidad para inspección** | Registros disponibles permanentemente para entidades de fiscalización |
| **Transmisión SCLM+** | En implementación — transmisión en tiempo real de actividad de MET's via web service |

### 3.3 Sanciones (Art. 44, Ley 643 de 2001, modificado por Art. 20 Ley 1393/2010)

| Infracción | Sanción |
|-----------|---------|
| **Operar sin concesión** | Liquidación de aforo + 200% de derechos causados + cierre + investigación penal (Art. 312 Código Penal) |
| **Inexactitud en declaración** | 160% de la diferencia entre lo declarado y lo debido |
| **Errores aritméticos** | 30% del mayor valor a pagar |
| **Multa por MET ilegal** | 80 SMMLV por máquina (~$72.6M COP en 2026) + denuncia penal |
| **Multa por bingo ilegal** | 1 SMMLV por silla (mínimo 50-200 sillas según municipio) |
| **Prescripción de revisión** | 3 años desde presentación de declaraciones |
| **Prescripción de aforo** | 5 años de actividades |

### 3.4 Inhabilidades (Art. 10)

No pueden obtener concesión quienes:
- Hayan sido sancionados por evasión tributaria (5 años)
- Sean deudores morosos de transferencias, derechos o multas de JSA (5 años)
- Tengan inhabilidades del Estatuto General de Contratación Pública

---

## 4. SISTEMA TRIBUTARIO DE JSA {#4-sistema-tributario-de-jsa}

### 4.1 Estructura de Tarifas para MET's

Existen **dos modelos** de cálculo que coexisten según el tipo de máquina y la regulación vigente:

#### Tarifa Variable (basada en producción)

```
┌─────────────────────────────────────────────────┐
│          CÁLCULO DE TARIFA VARIABLE              │
├─────────────────────────────────────────────────┤
│                                                  │
│  Producción Bruta = Ingresos totales de la MET  │
│                                                  │
│  Derechos de Explotación = Producción × 12%     │
│                     (Art. 8, Ley 643)            │
│                                                  │
│  Gastos de Administración = Derechos × 1%       │
│                     (Art. 9, Ley 643)            │
│                                                  │
│  Total Impuestos = Derechos + Gastos            │
│                                                  │
│  EJEMPLO:                                        │
│  Producción = $10,000,000                        │
│  Derechos = $1,200,000 (12%)                    │
│  Gastos = $12,000 (1% de derechos)              │
│  Total = $1,212,000                              │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Tarifa Fija (basada en SMMLV)

```
┌─────────────────────────────────────────────────┐
│           CÁLCULO DE TARIFA FIJA                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  SMMLV 2026 = $1,423,500 (referencia)           │
│                                                  │
│  MET $0-$500 apuesta:                           │
│    Tarifa = SMMLV × 30% = $427,050/mes/máquina  │
│                                                  │
│  MET $500+ apuesta:                             │
│    Tarifa = SMMLV × 40% = $569,400/mes/máquina  │
│                                                  │
│  Progresivas interconectadas:                   │
│    Tarifa = SMMLV × 45% = $640,575/mes/máquina  │
│                                                  │
│  El operador paga el MAYOR entre:               │
│    → Tarifa Fija (SMMLV × %)                    │
│    → Tarifa Variable (12% de producción)        │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Tabla Resumen de Tarifas (Art. 34)

| Elemento | Tarifa Mensual |
|----------|---------------|
| MET $0-$500 | 30% SMMLV por máquina |
| MET $500+ | 40% SMMLV por máquina |
| MET Progresiva interconectada | 45% SMMLV por máquina |
| Mesa de Casino (Blackjack, Póker, Bacará, Craps, Ruleta) | 4 SMMLV por mesa |
| Esferódromo | 4 SMMLV |
| Bingo (según tabla de sillas/habitantes) | Variable por silla |
| Demás juegos localizados | 17% de ingresos brutos |

### 4.2 Destino de los Recursos (Art. 42)

Los derechos de explotación se destinan a **salud pública**:

| Destinación | Porcentaje |
|------------|-----------|
| Oferta y demanda prestación servicios de salud | 80% |
| Fondo de Investigación en Salud | 7% |
| Régimen subsidiado tercera edad | 5% |
| Régimen subsidiado discapacitados, salud mental | 4% |
| Régimen subsidiado menores de 18 años | 4% |

### 4.3 Cálculo Completo para una Sala (Modelo B — DR Group cobra al dueño de sala)

```
┌─────────────────────────────────────────────────────┐
│    CUENTA DE COBRO AL DUEÑO DE SALA (MODELO B)      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  (1) Derechos de Explotación                        │
│      = Producción total sala × 12%                  │
│                                                      │
│  (2) Gastos de Administración                       │
│      = Derechos × 1%                                │
│                                                      │
│  (3) Costo de Administración DR Group               │
│      = $XX.XXX × total máquinas de la sala          │
│      (definido por sala en campo `administracion`)   │
│                                                      │
│  (4) Costo de Conexión Online                       │
│      = $XX.XXX × total máquinas de la sala          │
│      (definido por sala en campo `conexion`)         │
│                                                      │
│  ═══════════════════════════════════════════════     │
│  TOTAL A PAGAR = (1) + (2) + (3) + (4)             │
│  ═══════════════════════════════════════════════     │
│                                                      │
│  EJEMPLO: Sala con 20 máquinas                      │
│  Producción mensual: $50,000,000                    │
│  (1) Derechos: $6,000,000                           │
│  (2) Gastos: $60,000                                │
│  (3) Admin: $150,000 × 20 = $3,000,000             │
│  (4) Conexión: $80,000 × 20 = $1,600,000           │
│  TOTAL: $10,660,000                                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. SCLM+ — SISTEMA DE CONEXIÓN EN LÍNEA MET {#5-sclm}

### 5.1 ¿Qué es el SCLM+?

El **Sistema de Conexión en Línea MET (SCLM+)** es una **Plataforma Inteligente de Administración y Control de JSA** que Coljuegos está implementando para conectar TODAS las MET's del país en tiempo real.

**Normativa:**
- **Resolución 20241200014754** del 11 de julio 2024 — Requerimientos Técnicos
- **Resolución 20245100027144** del 29 de noviembre 2024 — Modificación de plazos

### 5.2 ¿Qué implica para los operadores?

| Aspecto | Detalle |
|---------|---------|
| **Transmisión en tiempo real** | Cada MET debe reportar su actividad vía web service a Coljuegos |
| **Identificación individual** | Cada máquina debe ser identificable en el sistema |
| **Datos requeridos** | Entradas de dinero, premios pagados, sesiones de juego, estado operativo |
| **Disponibilidad** | Conexión permanente 24/7 |
| **Certificación** | Los operadores deben certificar su implementación técnica |

### 5.3 Estado actual

- Coljuegos está realizando **mesas de trabajo** con operadores (marzo 2025)
- Existe documentación de **requerimientos técnicos** y un **manual de usuario**
- Se han establecido canales de registro para operadores
- Las memorias de las mesas de trabajo están disponibles públicamente

### 5.4 Impacto en DR Group Dashboard

```
┌─────────────────────────────────────────────────────┐
│               IMPACTO DEL SCLM+                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ANTES (HOY):                                       │
│  ┌──────────────────────────────────┐               │
│  │ Coljuegos genera Excel mensual → │               │
│  │ DR Group lo sube al dashboard →  │               │
│  │ Dashboard procesa y desglosa     │               │
│  └──────────────────────────────────┘               │
│                                                      │
│  DESPUÉS (SCLM+):                                   │
│  ┌──────────────────────────────────┐               │
│  │ Cada MET transmite en tiempo    │               │
│  │ real via web service →          │               │
│  │ Coljuegos recibe directamente → │               │
│  │ DR Group puede consultar datos  │               │
│  │ via API de Coljuegos            │               │
│  └──────────────────────────────────┘               │
│                                                      │
│  OPORTUNIDAD PARA DR GROUP:                         │
│  → Dashboard como INTERMEDIARIO inteligente         │
│  → Monitoreo de transmisión de cada MET             │
│  → Alertas cuando una máquina no transmite          │
│  → Reconciliación: tus datos vs Coljuegos           │
│  → Detección temprana de discrepancias              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 6. MODELO DE NEGOCIO DR GROUP {#6-modelo-de-negocio-dr-group}

### 6.1 Los Dos Modelos de Operación

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  MODELO A — CONCESIONARIO DIRECTO                        │
│                                                           │
│  ┌───────────┐     ┌──────────┐     ┌──────────────┐    │
│  │ Coljuegos │────→│ DR Group │────→│  Salas       │    │
│  │ (Contrato)│     │ (Opera)  │     │  Propias     │    │
│  └───────────┘     └──────────┘     └──────────────┘    │
│                                                           │
│  DR Group tiene el contrato Y opera directamente.        │
│  Ingreso = Producción de máquinas - Impuestos - Costos   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  MODELO B — CONCESIONARIO CON CLIENTES                   │
│                                                           │
│  ┌───────────┐     ┌──────────┐     ┌──────────────┐    │
│  │ Coljuegos │────→│ DR Group │────→│ Dueños de    │    │
│  │ (Contrato)│     │ (Interme-│     │ Sala (Clien- │    │
│  └───────────┘     │  diario) │     │ tes respon-  │    │
│                     └──────────┘     │ sables)      │    │
│                                      └──────────────┘    │
│                                                           │
│  DR Group tiene el contrato pero los dueños de sala      │
│  administran la operación diaria.                        │
│  Ingreso = Admin/máquina + Conexión/máquina              │
│  Responsabilidad = Cumplimiento ante Coljuegos           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Flujo Financiero Completo (Modelo B)

```
                PRODUCCIÓN MENSUAL DE LA SALA
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
    ┌──────────────┐ ┌────────┐ ┌──────────────┐
    │  12% Derechos│ │ 1%     │ │  Producción  │
    │  Explotación │ │ Gastos │ │  Neta = 87%  │
    │  → Coljuegos │ │ Admin  │ │              │
    └──────────────┘ │→Colj.  │ │              │
                      └────────┘ │              │
                                 ▼              
                    ┌──────────────────┐
                    │  CUENTA DE COBRO │
                    │  DR GROUP →      │
                    │  DUEÑO DE SALA   │
                    ├──────────────────┤
                    │ Derechos (12%)   │
                    │ Gastos (1%)      │
                    │ + Admin/máquina  │
                    │ + Conexión/máq.  │
                    ├──────────────────┤
                    │ = TOTAL A PAGAR  │
                    └──────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐ ┌──────────────┐
            │ DR Group paga│ │ DR Group     │
            │ a Coljuegos  │ │ retiene      │
            │ (12% + 1%)   │ │ Admin + Cnx  │
            └──────────────┘ └──────────────┘
```

---

## 7. AUDITORÍA DEL DASHBOARD ACTUAL {#7-auditoría-del-dashboard-actual}

### 7.1 Inventario Completo de Módulos Existentes Relacionados con JSA

#### Páginas (7 páginas dedicadas)

| # | Archivo | Líneas | Funcionalidad |
|---|---------|--------|---------------|
| 1 | `src/pages/SalasPage.jsx` | 2,342 | CRUD completo de salas de juego |
| 2 | `src/pages/LiquidacionesPage.jsx` | 4,726 | Carga/procesamiento de archivos Excel de Coljuegos |
| 3 | `src/pages/LiquidacionesPorSalaPage.jsx` | 2,934 | Visualización/edición de liquidaciones desglosadas por sala |
| 4 | `src/pages/LiquidacionesHistorialPage.jsx` | 2,147 | Archivo histórico de liquidaciones con búsqueda |
| 5 | `src/pages/LiquidacionesEstadisticasPage.jsx` | 2,051 | Análisis estadístico + detección de máquinas en cero |
| 6 | `src/pages/FacturacionPage.jsx` | 1,916 | Generación de Cuentas de Cobro en PDF |
| 7 | `src/pages/ClientesPage.jsx` | — | Lista de clientes derivada de `contactoAutorizado` de salas |

#### Componentes (11 componentes especializados)

| # | Archivo | Líneas | Funcionalidad |
|---|---------|--------|---------------|
| 1 | `src/components/modals/AddSalaModal.jsx` | 1,243 | Formulario completo de creación de sala |
| 2 | `src/components/modals/EditSalaModal.jsx` | — | Edición de sala existente |
| 3 | `src/components/modals/ViewSalaModal.jsx` | — | Vista de solo lectura |
| 4 | `src/components/modals/SalaChangeHistoryModal.jsx` | — | Historial de auditoría de cambios |
| 5 | `src/components/modals/ExportarPorSalaModal.jsx` | — | Exportación agrupada por sala |
| 6 | `src/components/modals/SalaDetallePorMesModal.jsx` | 559 | Métricas mensuales con gráficos de barras |
| 7 | `src/components/modals/MaquinaDetallePorMesModal.jsx` | 528 | Métricas por máquina con gráficos |
| 8 | `src/components/modals/ReporteDiarioModal.jsx` | — | Vista de reportes diarios |
| 9 | `src/components/modals/ConfirmarGuardadoModal.jsx` | — | Confirmación de guardado en Firebase |
| 10 | `src/components/liquidaciones/MaquinasEnCeroStats.jsx` | 2,123 | Estadísticas completas de máquinas sin producción |
| 11 | `src/components/liquidaciones/HistoricoPeriodoFilter.jsx` | — | Filtro de períodos para vistas históricas |

#### Hooks (4 hooks relacionados)

| # | Archivo | Líneas | Funcionalidad |
|---|---------|--------|---------------|
| 1 | `src/hooks/useLiquidacionExport.js` | 722 | 3 formatos de exportación Excel (Python, Spectacular, Simple) |
| 2 | `src/hooks/usePermissions.js` | — | Permisos granulares para liquidaciones y facturación |
| 3 | `src/hooks/useStorageStats.js` | — | Estadísticas de uso de Storage (carpeta `liquidaciones/`) |
| 4 | `src/hooks/useOrphanFileDetector.js` | — | Detección de archivos huérfanos en `liquidaciones/` |

#### Servicios y Utilidades (6 archivos)

| # | Archivo | Líneas | Funcionalidad |
|---|---------|--------|---------------|
| 1 | `src/services/liquidacionPersistenceService.js` | 1,853 | Persistencia en Firebase (guardar, subir archivos, generar IDs, extracción de períodos) |
| 2 | `src/services/maquinasEnCeroService.js` | 1,656 | Tracking pre-computado de máquinas con producción cero |
| 3 | `src/services/systemConfigService.js` | ~50 | Gestión del valor SMMLV para cálculos de tarifa fija |
| 4 | `src/utils/liquidacionExcelExportPythonFormat.js` | — | Exportación Excel formato principal |
| 5 | `src/utils/liquidacionExcelExportDiarioSala.js` | — | Exportación diaria por sala |
| 6 | `src/utils/salaDetalleExcelExport.js` | — | Exportación detalle de sala (2 hojas: histórico + máquinas) |

### 7.2 Colecciones de Firestore Relacionadas

#### `salas` — Salas de Juego

```
salas/{docId}
├── name: string                       // "Casino Royal"
├── companyId: string                  // Referencia a la empresa concesionaria
├── companyName: string                // Nombre de empresa (denormalizado)
├── proveedorOnline: string            // Proveedor de plataforma (IGT, Novomatic, Zitro)
├── fechaInicioContrato: string        // Fecha inicio del contrato de la sala
├── ciudad: string                     // Ciudad
├── departamento: string               // Departamento
├── direccion: string                  // Dirección física
├── status: "active" | "retired"       // Estado operativo
├── fechaRetiro: string                // Fecha de retiro (si aplica)
├── propietario: string                // Nombre del propietario/dueño de sala
├── nombreRepLegal: string             // Representante legal
├── tipoDocumentoRepLegal: string      // CC, NIT, CE, etc.
├── cedulaRepLegal: string             // Número de documento
├── nombreRepLegalSuplente: string     // Rep. legal suplente
├── tipoDocumentoRepLegalSuplente: string
├── cedulaRepLegalSuplente: string
├── contactPhone: string               // Teléfono principal
├── contactEmail: string               // Email principal
├── contactoAutorizado: string         // Contacto autorizado 1 (= cliente en ClientesPage)
├── contactPhone2: string              // Teléfono secundario
├── contactEmail2: string              // Email secundario
├── contactoAutorizado2: string        // Contacto autorizado 2
├── administracion: number             // Costo admin por máquina (COP)
├── conexion: number                   // Costo conexión por máquina (COP)
├── attachments: {
│   ├── camaraComercio: { url, nombre, tamaño }     // Cámara de Comercio
│   ├── usoSuelos: { url, nombre, tamaño }          // Certificado Uso de Suelos
│   └── validacionUsoSuelos: { url, nombre, tamaño } // Validación Uso de Suelos
│ }
├── stats: { totalBookings, totalRevenue, averageUsage }
├── createdAt: Timestamp
├── updatedAt: Timestamp
└── createdBy: string (uid)
```

#### `sala_changes` — Auditoría de Cambios en Salas

```
sala_changes/{docId}
├── salaId: string
├── salaName: string
├── changeType: "estado" | "nombre_sala" | "direccion" | "documento_camara_comercio"
│               | "documento_uso_suelos" | "documento_validacion_uso_suelos"
│               | "proveedor_online" | "fechaInicioContrato"
├── oldValue: string
├── newValue: string
├── timestamp: Timestamp
├── changedBy: { uid, name, email }
├── reason: string
└── extraData: object
```

#### `liquidaciones` — Liquidaciones Procesadas (1 doc por empresa/período)

```
liquidaciones/{empresaNormalizada_periodoLiquidacion}
├── id: string
├── userId: string
├── empresa: { nombre, normalizado }
├── fechas: {
│   ├── periodoLiquidacion: "junio_2025"
│   ├── mesLiquidacion: 5 (0-indexed)
│   ├── añoLiquidacion: 2025
│   ├── fechaProcesamiento: Timestamp
│   ├── periodoDetectadoModal: string
│   └── timestamps: { createdAt, updatedAt }
│ }
├── archivos: {
│   ├── archivoOriginal: { url, nombre, nombreStorage, tamaño, tipo }
│   └── archivoTarifas: { url, nombre, nombreStorage, tamaño, tipo } // Opcional
│ }
├── metricas: {
│   ├── maquinasConsolidadas: number           // Total de MET's procesadas
│   ├── totalEstablecimientos: number           // Total de salas
│   ├── totalProduccion: number (COP)           // Producción bruta total
│   ├── derechosExplotacion: number             // 12% de producción
│   ├── gastosAdministracion: number            // 1% de derechos
│   ├── totalImpuestos: number                  // Derechos + gastos
│   ├── tieneTarifasFijas: boolean
│   └── tieneArchivoTarifas: boolean
│ }
├── procesamiento: object
└── metadatos: object
```

#### `liquidaciones_por_sala` — Desglose por Sala (1 doc por sala/período)

```
liquidaciones_por_sala/{empresaNormalizada_salaNormalizada_periodoLiquidacion}
├── id: string
├── userId: string
├── liquidacionId: string              // Referencia al documento padre
├── empresa: { id, nombre, normalizado }
├── sala: { nombre, normalizado }
├── fechas: { ... misma estructura que padre ... }
├── archivos: { ... mismas referencias ... }
├── metricas: {
│   ├── totalMaquinas: number
│   ├── totalProduccion: number
│   ├── derechosExplotacion: number
│   ├── gastosAdministracion: number
│   └── totalImpuestos: number
│ }
├── datosConsolidados: [               // Array de registros por máquina
│   {
│     serial: string,                  // Serial físico de la MET
│     nuc: string,                     // Número Único de Clasificación
│     establecimiento: string,         // Nombre del establecimiento/sala
│     tipoApuesta: string,             // Tipo de apuesta
│     produccion: number,              // Producción de la máquina
│     derechosExplotacion: number,     // 12% de producción
│     gastosAdministracion: number,    // 1% de derechos
│     totalImpuestos: number,          // Derechos + gastos
│     diasTransmitidos: number,        // Días que transmitió en el mes
│     novedad: string,                 // Alerta si no transmitió todos los días
│     primerDia: string,               // Primer día de transmisión
│     ultimoDia: string,               // Último día de transmisión
│     periodoTexto: string             // Texto del período
│   }
│ ]
├── reporteSala: object
├── facturacion: {
│   ├── estado: "pendiente" | "generada" | "enviada" | "pagada" | "facturada"
│   ├── fechaGeneracion: Timestamp
│   ├── fechaEnvio: Timestamp
│   ├── fechaPago: Timestamp
│   ├── numeroCuentaCobro: string
│   └── urlPdf: string
│ }
└── estadoFacturacion: string
```

#### `maquinas_en_cero` — Análisis Pre-Computado

```
maquinas_en_cero/{empresaNormalizada}
├── empresaNombre: string
├── totalPeriodos: number
├── ultimaActualizacion: Timestamp
└── maquinas: [
    {
      nuc: string,
      serial: string,
      sala: string,
      tipoApuesta: string,
      periodosEnCero: ["enero_2025", "febrero_2025", ...],
      periodosTotales: ["enero_2025", "febrero_2025", ...],
      produccionUltimoPeriodo: number
    }
  ]
```

#### `companies` (campos relevantes para JSA)

```
companies/{docId}
├── name: string                       // Nombre legal de la empresa
├── taxId / nit: string                // NIT colombiano
├── contractNumber: string             // ⭐ NÚMERO DE CONTRATO DE COLJUEGOS
├── address / direccion: string
├── phone / telefono: string
├── logoURL / logo: string
├── bankAccount: string                // Cuenta bancaria para pagos
├── bankName: string                   // Banco
├── accountType: string                // Tipo de cuenta
├── legalRepresentative: string        // Representante legal
└── legalRepresentativeId: string      // Cédula del rep. legal
```

#### `system_config/general` — Configuración del Sistema

```
system_config/general
├── smmlvActual: number                // Valor actual del SMMLV ($1,423,500 en 2026)
├── ultimaActualizacion: Timestamp
└── actualizadoPor: { uid, email, nombre }
```

### 7.3 Flujo de Procesamiento de Liquidaciones (End-to-End)

```
                    ┌─────────────────────────────┐
                    │  1. CARGA DE ARCHIVO EXCEL   │
                    │  Usuario sube archivo Excel  │
                    │  generado por Coljuegos      │
                    │  LiquidacionesPage.jsx       │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  2. DETECCIÓN DE ENCABEZADOS │
                    │  Escanea las primeras 15     │
                    │  filas buscando columnas:    │
                    │  serial, nuc, nuid,          │
                    │  establecimiento, sala,      │
                    │  base_liquidación            │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  3. PROCESAMIENTO DE DATOS   │
                    │  Mapea columnas a campos     │
                    │  Parsea cada fila del Excel  │
                    │  Agrupa registros por NUC    │
                    │  (identificador único de     │
                    │  cada máquina)               │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  4. CONSOLIDACIÓN            │
                    │  Suma producción por NUC     │
                    │  Calcula impuestos:          │
                    │    Derechos = Prod × 12%     │
                    │    Gastos = Derech × 1%      │
                    │  Genera reporte por sala     │
                    │  Detecta # de contrato →    │
                    │  Auto-match con empresa      │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  5. TARIFAS FIJAS (OPCIONAL)  │
                    │  Si aplica: cargar archivo   │
                    │  de tarifas fijas basadas    │
                    │  en SMMLV                    │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  6. VALIDACIÓN Y GUARDADO    │
                    │  ConfirmarGuardadoModal      │
                    │  Confirma período detectado  │
                    │  Sube archivos a Storage     │
                    │  Guarda en Firestore         │
                    └───────────┬─────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
    ┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
    │ liquidaciones   │ │ liquidaciones│ │ maquinas_en    │
    │ (1 doc por      │ │ _por_sala    │ │ _cero          │
    │ empresa/período)│ │ (1 doc por   │ │ (pre-computed  │
    │                 │ │ sala/período)│ │ zero-prod)     │
    └────────┬────────┘ └──────┬───────┘ └────────────────┘
             │                 │
             │                 ▼
             │        ┌──────────────────┐
             │        │  7. FACTURACIÓN  │
             │        │  FacturacionPage │
             │        │  Genera PDF      │
             │        │  "Cuenta de      │
             │        │  Cobro" con:     │
             │        │  - Logo empresa  │
             │        │  - NIT           │
             │        │  - Contrato Colj │
             │        │  - Desglose      │
             │        │  - Datos banco   │
             │        │  Estado:         │
             │        │  pendiente →     │
             │        │  generada →      │
             │        │  enviada →       │
             │        │  pagada          │
             │        └──────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │  8. ANALYTICS           │
    │  Estadísticas por       │
    │  trimestre/semestre/año │
    │  Máquinas en cero       │
    │  Exportación Excel      │
    │  (7 formatos distintos) │
    └─────────────────────────┘
```

### 7.4 Permisos del Sistema Relacionados con JSA

```
gestion_empresarial.salas              → Acceso a SalasPage (CRUD de salas)
liquidaciones                          → Permiso padre para toda la sección
liquidaciones.liquidaciones            → Procesar nuevas liquidaciones
liquidaciones.historico                → Ver historial de liquidaciones
liquidaciones.estadisticas             → Ver estadísticas + análisis de máquinas en cero
facturacion.liquidaciones_por_sala     → Ver desglose de liquidación por sala
facturacion.cuentas_cobro              → Generar Cuentas de Cobro (PDF)
rrhh.liquidaciones                     → Acceso RRHH a liquidaciones
```

---

## 8. LO QUE TIENES QUE SÍ SIRVE {#8-lo-que-sirve}

### Evaluación con calificación

| # | Funcionalidad | Calificación | Justificación |
|---|--------------|-------------|---------------|
| 1 | **Procesamiento de Excel de Coljuegos** | ⭐⭐⭐⭐⭐ | Auto-detección de encabezados, auto-match por contrato, agrupación por NUC. Es el motor core del sistema |
| 2 | **Cálculo de impuestos (12% + 1%)** | ⭐⭐⭐⭐⭐ | Fórmula exacta según Ley 643 Art. 34. Implementación correcta |
| 3 | **Tarifa fija SMMLV** | ⭐⭐⭐⭐⭐ | Correctamente implementada con `system_config/general.smmlvActual`. Actualizable sin deploy |
| 4 | **Liquidación por Sala** | ⭐⭐⭐⭐⭐ | Desglose automático de liquidación global en sub-documentos por sala. Fundamental para Modelo B |
| 5 | **Cuenta de Cobro PDF** | ⭐⭐⭐⭐ | PDF profesional con logo, NIT, contrato Coljuegos, desglose fiscal, datos bancarios. Faltaría aging/cartera |
| 6 | **Estado de facturación** | ⭐⭐⭐⭐ | Ciclo completo: pendiente → generada → enviada → pagada → facturada. Permite control de CxC básico |
| 7 | **CRUD de Salas** | ⭐⭐⭐⭐ | 20+ campos, 3 documentos adjuntos (Cámara Comercio, Uso Suelos, Validación). Falta vencimiento de docs |
| 8 | **Máquinas en Cero** | ⭐⭐⭐⭐⭐ | Detección proactiva con colección pre-computada. Patrón de optimización excelente |
| 9 | **Auditoría de Salas** | ⭐⭐⭐⭐ | `sala_changes` registra todos los cambios con quién/cuándo/por qué. Buena trazabilidad |
| 10 | **Multi-empresa** | ⭐⭐⭐⭐ | Soporta múltiples contratos de concesión. Cada empresa con sus salas y liquidaciones |
| 11 | **Estadísticas/Histórico** | ⭐⭐⭐ | Comparaciones trimestrales/semestrales/anuales. Podría tener más KPIs de negocio |
| 12 | **Exportaciones Excel** | ⭐⭐⭐⭐⭐ | 7 tipos de exportación diferentes. Formato Python profesional. Muy completo |
| 13 | **Empleados + APK** | ⭐⭐⭐⭐ | Asistencias con geolocalización. Complementario al negocio. Bien implementado |
| 14 | **Compromisos Fijos** | ⭐⭐⭐⭐ | Con detección de "Coljuegos" como proveedor y campos específicos de derechos/gastos |
| 15 | **Auto-match por contrato** | ⭐⭐⭐⭐⭐ | Lee el número de contrato del Excel de Coljuegos y lo cruza con `company.contractNumber`. Ingenioso |

### Fortalezas Clave

1. **El procesamiento de Excel es el MVP del producto** — Tomar un archivo crudo de Coljuegos y convertirlo en información accionable (por sala, por máquina, con impuestos calculados) es de altísimo valor.

2. **La arquitectura multi-empresa ya está resuelta** — No muchos competidores soportan múltiples contratos de concesión en una misma plataforma.

3. **Las máquinas en cero son una feature killer** — Ningún Excel de Coljuegos te dice "esta máquina lleva 3 meses sin producir". Tu sistema sí.

4. **El modelo de datos es sólido** — La separación `liquidaciones` (consolidado) → `liquidaciones_por_sala` (desglose) → `datosConsolidados` (máquinas) es limpia y escalable.

---

## 9. LO QUE TIENES QUE NO SIRVE O SOBRA {#9-lo-que-no-sirve}

| # | Funcionalidad | Problema | Recomendación |
|---|--------------|---------|---------------|
| 1 | **Módulo de Ingresos genérico** | No está especializado para JSA. Los "ingresos" en esta industria son "producción de máquinas" y ya están en liquidaciones | Evaluar si se puede integrar o si queda como módulo separado para otros ingresos del negocio (ej: venta de bebidas) |
| 2 | **Módulo de Pagos genérico** | Los pagos en JSA son: derechos a Coljuegos, administración, conexión online. No tienen la misma estructura que pagos de servicios públicos | Especializar para conciliar pagos de dueños de sala vs cuentas de cobro |
| 3 | **`providers` collection** | Naming confuso — tienes "proveedores" financieros (pagos recurrentes) Y "proveedor online" en salas (IGT, Novomatic). Son conceptos completamente distintos | Renombrar `providers` a `beneficiarios` o `acreedores` para evitar confusión con proveedores de plataforma de juego |

**Nota:** Ninguna funcionalidad existente es "inútil" per se. Todas tienen un propósito. Lo que falta es la **especialización** para la industria de JSA.

---

## 10. LO QUE NO TIENES Y NECESITAS {#10-lo-que-no-tienes}

### 10.1 MÓDULO DE GESTIÓN DE CONTRATOS CON COLJUEGOS

**Prioridad: 🔴 ALTA — Riesgo regulatorio directo**

**Problema actual:** El número de contrato se almacena como un simple campo `contractNumber` en `companies`. No hay tracking de vencimiento, novedades, ni cumplimiento.

**Solución propuesta:**

```
Nueva colección: contratos_coljuegos/{docId}

├── empresaId: string                  // Ref a companies
├── empresaNombre: string
├── numeroContrato: string             // Número oficial de Coljuegos
├── tipoContrato: "concesion" | "autorizacion"
├── estado: "vigente" | "en_renovacion" | "vencido" | "suspendido"
├── fechaInicio: Timestamp
├── fechaFin: Timestamp
├── duracionAnios: number              // 3-5 años
├── minimoElementos: number            // 80 MET's o equivalente
├── elementosActuales: number          // Calculado dinámicamente
├── cumplimientoMinimo: boolean        // ¿Tiene los 80 mínimos?
├── novedades: [                       // Historial de novedades
│   {
│     tipo: "adicion" | "retiro" | "traslado" | "reemplazo",
│     fecha: Timestamp,
│     cantidad: number,
│     descripcion: string,
│     aprobadoPor: string,
│     documentoSoporte: { url, nombre }
│   }
│ ]
├── alertas: {
│   ├── alertaDosMeses: boolean        // Alerta a 12 meses
│   ├── alertaSeisMeses: boolean       // Alerta a 6 meses
│   ├── alertaTresMeses: boolean       // Alerta a 3 meses
│   ├── alertaUnMes: boolean           // Alerta a 1 mes
│   └── ultimaAlertaEnviada: Timestamp
│ }
├── documentos: {
│   ├── contratoOriginal: { url, nombre, fecha }
│   ├── otroSi: [{ url, nombre, fecha, descripcion }]  // Modificaciones
│   └── conceptoPrevio: { url, nombre, fecha }
│ }
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

**Funcionalidades del módulo:**

| Feature | Descripción |
|---------|-------------|
| Dashboard de contratos | Vista general con semáforo de vencimiento (verde/amarillo/rojo) |
| Alertas automáticas | Notificaciones a 12, 6, 3, 1 mes del vencimiento |
| Historial de novedades | Registro de todas las adiciones, traslados, reemplazos y retiros |
| Documentos del contrato | Almacenamiento del contrato original, otrosí, conceptos previos |
| Cálculo de cumplimiento | ¿Cumples el mínimo de 80 MET's? ¿Cuántas tienes activas? |
| Generación de novedades | Preparar documentación para presentar ante Coljuegos |

---

### 10.2 INVENTARIO DE MÁQUINAS (MET's)

**Prioridad: 🔴 ALTA — Base de datos centralizada de activos**

**Problema actual:** Las máquinas solo aparecen como registros dentro de `datosConsolidados` en las liquidaciones. No existe una colección persistente de máquinas con su estado actual, ubicación y historial.

**Solución propuesta:**

```
Nueva colección: maquinas/{nuc}

├── nuc: string                        // Número Único de Clasificación (ID primario)
├── serial: string                     // Serial físico de la máquina
├── empresaId: string                  // A qué empresa pertenece
├── empresaNombre: string
├── salaId: string                     // En qué sala está actualmente
├── salaNombre: string
├── marca: string                      // Fabricante (IGT, Novomatic, Zitro, Aristocrat, etc.)
├── modelo: string                     // Modelo específico
├── tipoApuesta: "$0-500" | "$500+" | "progresiva"
├── tarifaFija: number                 // Tarifa SMMLV que aplica (30%, 40%, 45%)
├── estado: "activa" | "mantenimiento" | "fuera_servicio" | "retirada" | "bodega"
├── fechaRegistro: Timestamp           // Cuándo se registró ante Coljuegos
├── fechaUltimaActividad: Timestamp    // Último día que transmitió
├── diasSinTransmitir: number          // Calculado
├── produccionAcumulada: {             // Histórico de producción
│   totalVida: number,                 // Producción total desde registro
│   ultimoMes: number,
│   ultimoTrimestre: number,
│   ultimoAnio: number
│ }
├── historialUbicaciones: [            // Trazabilidad de movimientos
│   {
│     salaId: string,
│     salaNombre: string,
│     fechaIngreso: Timestamp,
│     fechaSalida: Timestamp,
│     motivo: "traslado" | "reemplazo" | "retiro" | "nuevo"
│   }
│ ]
├── historialMantenimientos: [         // Registro de mantenimientos
│   {
│     fecha: Timestamp,
│     tipo: "preventivo" | "correctivo",
│     descripcion: string,
│     costo: number,
│     tecnico: string
│   }
│ ]
├── periodosEnCero: string[]           // Períodos sin producción
├── alertas: {
│   ├── sinProduccion: boolean,        // ¿Tiene producción en cero?
│   ├── mesesEnCero: number,           // ¿Cuántos meses consecutivos?
│   ├── sinTransmitir: boolean,        // ¿No transmite?
│   └── requiereMantenimiento: boolean
│ }
├── notas: string                      // Observaciones
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

**Funcionalidades del módulo:**

| Feature | Descripción |
|---------|-------------|
| Ficha técnica por máquina | Toda la información en una vista: Serial, NUC, marca, modelo, ubicación, producción |
| Mapa de máquinas | ¿Dónde está cada máquina? Búsqueda por NUC o Serial |
| Historial de movimientos | Traslados entre salas con fechas, motivos y soportes |
| Estado operativo | Semáforo: Activa / Mantenimiento / Fuera de servicio / Retirada |
| Producción individual | Gráfico histórico de producción por máquina con tendencia |
| Alertas automáticas | Días sin transmitir, meses sin producción, mantenimiento pendiente |
| Equivalencias | 1 mesa poker = X MET's. Calcular cumplimiento de mínimos |
| Exportación inventario | Excel/PDF con inventario completo para inspecciones de Coljuegos |

---

### 10.3 TABLERO DE CUMPLIMIENTO REGULATORIO

**Prioridad: 🔴 ALTA — Visión ejecutiva de riesgo**

**Problema actual:** No existe un lugar centralizado para ver "¿estoy cumpliendo con todo lo que me exige Coljuegos?".

**Dashboard propuesto:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 CUMPLIMIENTO REGULATORIO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CONTRATOS    │  │ ELEMENTOS    │  │ DOCUMENTOS   │          │
│  │  🟢 2/2      │  │  🟢 156/80   │  │  🟡 18/20    │          │
│  │  Vigentes    │  │  Activos/Min │  │  Vigentes    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ MÁQ EN CERO  │  │ DERECHOS    │  │ DECLARACIÓN  │          │
│  │  🔴 12 máq.  │  │  🟢 Al día  │  │  🟢 Presen-  │          │
│  │  sin prod.   │  │  pagados    │  │  tada Feb.   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ALERTAS ACTIVAS:                                               │
│  ⚠️  Contrato #C-4521 vence en 8 meses (Oct 2026)              │
│  ⚠️  Cámara de Comercio de "Sala Gran Casino" venció hace       │
│      15 días                                                     │
│  🔴  4 máquinas llevan 3+ meses sin producción                  │
│  ⚠️  Declaración de febrero vence el 14/03/2026                 │
│                                                                  │
│  PRÓXIMAS ACCIONES:                                             │
│  📋  Presentar declaración mensual (vence 14/03)                │
│  📋  Renovar Cámara Comercio de "Sala Gran Casino"              │
│  📋  Evaluar retiro de 4 máquinas en cero                       │
│  📋  Iniciar proceso de renovación contrato #C-4521             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 10.4 MÓDULO DE CUENTAS POR COBRAR (CARTERA)

**Prioridad: 🔴 ALTA — Impacto financiero directo (Modelo B)**

**Problema actual:** Tienes Cuenta de Cobro con estados de facturación, pero no hay conciliación de pagos, aging, ni dashboard de cartera.

**Funcionalidades necesarias:**

| Feature | Descripción |
|---------|-------------|
| **Dashboard de cartera** | Total facturado vs cobrado vs vencido, por sala y por cliente |
| **Aging report** | Clasificación a 30, 60, 90 días — ¿quién no ha pagado? |
| **Conciliación de pagos** | Registrar pagos recibidos y cruzar con cuentas de cobro pendientes |
| **Alertas de mora** | Notificación automática cuando un dueño de sala pasa de X días sin pagar |
| **Estado de cuenta por cliente** | PDF con historial completo de facturación y pagos del dueño de sala |
| **Margen por sala** | Producción - cobros propios - impuestos Coljuegos = margen neto |
| **Proyección de cobro** | Basado en histórico, ¿cuánto esperas cobrar este mes? |

**Modelo de datos:**

```
Nueva colección: pagos_recibidos/{docId}

├── cuentaCobroId: string              // Ref a liquidaciones_por_sala
├── salaId: string
├── salaNombre: string
├── clienteId: string                  // Dueño de la sala
├── clienteNombre: string
├── montoFacturado: number             // Valor de la cuenta de cobro
├── montoPagado: number                // Valor efectivamente recibido
├── fechaPago: Timestamp
├── medioPago: "transferencia" | "efectivo" | "cheque" | "otro"
├── comprobante: { url, nombre }       // Soporte del pago
├── periodo: string                    // Período de la liquidación
├── estado: "completo" | "parcial" | "sobrepago"
├── observaciones: string
├── registradoPor: { uid, nombre }
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

---

### 10.5 REPORTES PARA COLJUEGOS

**Prioridad: 🟡 MEDIA-ALTA — Valor agregado diferenciador**

| Reporte | Descripción | Art. Ley 643 |
|---------|-------------|-------------|
| **Declaración mensual de derechos** | Formulario con liquidación de derechos causados en el mes anterior | Art. 41 |
| **Inventario de elementos activos** | Lista de todas las MET's con NUC, serial, sala, estado — para inspecciones | Art. 43 |
| **Reporte de novedades** | Adiciones, traslados, reemplazos en el período | Decreto 2483/2003 |
| **Cálculo automático de declaración** | Suma tarifa fija + variable = total a declarar. Pre-llenado del formulario | Art. 41 |
| **Proyección de pago** | ¿Cuánto debes pagar a Coljuegos este mes? Basado en producción actual | — |
| **Histórico de pagos a Coljuegos** | ¿Cuánto has pagado en total? Tendencia por período | — |

---

### 10.6 ANÁLISIS DE RENTABILIDAD POR SALA

**Prioridad: 🟡 MEDIA — Inteligencia de negocio**

| Métrica | Cálculo | Fuente de Datos |
|---------|---------|-----------------|
| **Producción bruta** | Total generado por todas las MET's de la sala | `liquidaciones_por_sala.metricas.totalProduccion` |
| **Derechos a Coljuegos** | 12% producción + 1% gastos | Calculado |
| **Tarifa fija** | SMMLV × % × cantidad máquinas | `system_config` + `maquinas` |
| **Ingreso por administración** | `sala.administracion` × total máquinas | `salas` + `liquidaciones_por_sala` |
| **Ingreso por conexión** | `sala.conexion` × total máquinas | `salas` + `liquidaciones_por_sala` |
| **Costo de proveedor online** | Tarifa IGT/Novomatic × máquinas (hoy no se registra) | Nuevo campo |
| **Costos fijos de operación** | Arriendo, servicios, personal (si aplica) | Nuevo módulo |
| **Margen neto** | Producción - todos los costos anteriores | Calculado |
| **ROI por máquina** | Producción individual / costos proporcionales | Calculado |
| **Producción por máquina promedio** | Producción total / cantidad de MET's | Calculado |
| **Ranking de salas** | Ordenar por rentabilidad, producción, eficiencia | Dashboard |

---

### 10.7 GESTIÓN DE PROVEEDORES DE PLATAFORMA ONLINE

**Prioridad: 🟢 BAJA-MEDIA**

| Feature | Descripción |
|---------|-------------|
| **Ficha por proveedor** | IGT, Novomatic, Zitro, Aristocrat — datos de contacto, contrato, condiciones |
| **Costos de conexión** | Tarifa mensual por máquina, comisiones, condiciones de pago |
| **SLA y disponibilidad** | ¿El sistema online estuvo caído? ¿Cuántas horas perdidas? |
| **Comparativo de proveedores** | ¿Qué proveedor genera más producción por máquina en salas similares? |
| **Control de facturación** | Cruzar lo que te cobra el proveedor vs lo que cobras tú al dueño de sala |

---

### 10.8 PREPARACIÓN PARA SCLM+

**Prioridad: 🟢 MEDIA (pero creciente — se vuelve ALTA cuando se implemente)**

| Feature | Descripción |
|---------|-------------|
| **Dashboard de transmisión** | ¿Todas las máquinas están transmitiendo hoy? Semáforo en tiempo real |
| **Alertas de no-transmisión** | Si una máquina deja de transmitir → alerta inmediata |
| **Log de transmisiones** | Histórico de envíos al SCLM+ por máquina con timestamps |
| **Reconciliación** | Tus datos internos vs lo que Coljuegos reporta en su plataforma |
| **Detección de discrepancias** | ¿Los números de producción de Coljuegos coinciden con los tuyos? |
| **Reporte de disponibilidad** | % de tiempo que cada máquina estuvo conectada al SCLM+ |

---

## 11. MAPA FUNCIONAL COMPLETO {#11-mapa-funcional}

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DR GROUP DASHBOARD — JUEGOS DE SUERTE Y AZAR          │
├────────────────┬─────────────────┬──────────────────┬────────────────────┤
│   ✅ TIENES     │  🟡 MEJORABLE    │  ❌ NO TIENES     │   🔮 FUTURO       │
│   (Bien hecho) │  (Parcial)      │  (Necesitas)     │   (SCLM+)         │
├────────────────┼─────────────────┼──────────────────┼────────────────────┤
│                │                 │                  │                    │
│ Procesamiento  │ Facturación     │ Inventario de    │ Transmisión        │
│ de Excel       │ (falta aging,   │ máquinas (ficha  │ en tiempo real     │
│ de Coljuegos   │ conciliación,   │ NUC, serial,     │ de cada MET       │
│                │ dashboard de    │ ubicación,       │                    │
│ Cálculo de     │ cartera)        │ estado, historial│ Alertas de         │
│ impuestos      │                 │ de movimientos)  │ no-transmisión     │
│ (12% + 1%)     │ Salas (falta    │                  │                    │
│                │ vencimiento de  │ Gestión de       │ Log de envíos      │
│ Tarifa fija    │ documentos,     │ contratos con    │ al SCLM+           │
│ SMMLV          │ fecha vigencia  │ Coljuegos        │                    │
│                │ de Cámara Com., │ (alertas de      │ Reconciliación     │
│ Liquidación    │ Uso de Suelos)  │ vencimiento,     │ datos propios      │
│ por sala       │                 │ novedades,       │ vs Coljuegos       │
│                │ Multi-empresa   │ cumplimiento)    │                    │
│ Cuenta de      │ (falta margen   │                  │ Dashboard de       │
│ Cobro PDF      │ de rentabilidad │ Cumplimiento     │ disponibilidad     │
│                │ por empresa)    │ regulatorio      │                    │
│ Estado de      │                 │ (dashboard       │                    │
│ facturación    │ Máquinas cero   │ semáforo)        │                    │
│                │ (falta ficha    │                  │                    │
│ Auditoría      │ persistente por │ Cuentas por      │                    │
│ de salas       │ máquina)        │ cobrar (aging,   │                    │
│                │                 │ conciliación,    │                    │
│ Exportación    │ Estadísticas    │ mora)            │                    │
│ Excel (7       │ (faltan KPIs    │                  │                    │
│ formatos)      │ de negocio:     │ Análisis de      │                    │
│                │ ROI, margen,    │ rentabilidad     │                    │
│ Auto-match     │ ranking)        │ por sala         │                    │
│ por contrato   │                 │                  │                    │
│                │                 │ Reportes para    │                    │
│ Empleados      │                 │ Coljuegos        │                    │
│ + APK          │                 │ (declaración,    │                    │
│                │                 │ inventario)      │                    │
│ Compromisos    │                 │                  │                    │
│ fijos          │                 │ Proveedores      │                    │
│                │                 │ online           │                    │
│                │                 │ (costos, SLA)    │                    │
│                │                 │                  │                    │
└────────────────┴─────────────────┴──────────────────┴────────────────────┘
```

---

## 12. ROADMAP DE IMPLEMENTACIÓN POR FASES {#12-roadmap}

### Fase 1 — Fundamentos (Alto ROI — Inmediato)

**Tiempo estimado:** 4-6 semanas
**Prioridad:** 🔴 Crítica

| # | Módulo | Justificación |
|---|--------|---------------|
| 1 | **Inventario de Máquinas** | Base de datos centralizada. Sin esto, no puedes saber exactamente qué tienes ni dónde |
| 2 | **Dashboard de Cartera/CxC** | Impacto financiero directo. ¿Quién te debe? ¿Cuánto? ¿Hace cuánto? |
| 3 | **Alertas de vencimiento de contrato** | Riesgo regulatorio. Un vencimiento no detectado = multa millonaria |

### Fase 2 — Diferenciación (Corto plazo)

**Tiempo estimado:** 4-6 semanas adicionales
**Prioridad:** 🟡 Alta

| # | Módulo | Justificación |
|---|--------|---------------|
| 4 | **Tablero de Cumplimiento Regulatorio** | Visión ejecutiva. Responde "¿estoy cumpliendo?" de un vistazo |
| 5 | **Análisis de Rentabilidad por Sala** | Inteligencia de negocio. ¿Qué salas valen la pena? ¿Cuál deberías cerrar? |
| 6 | **Reportes para Coljuegos** | Reduce tiempo de preparación de declaraciones mensuales |

### Fase 3 — Valor Agregado (Medio plazo)

**Tiempo estimado:** 4-6 semanas adicionales
**Prioridad:** 🟢 Media

| # | Módulo | Justificación |
|---|--------|---------------|
| 7 | **Gestión de Proveedores Online** | Control de costos de plataforma vs ingresos |
| 8 | **Mejoras en vencimiento de documentos de salas** | Alertas cuando Cámara de Comercio o Uso de Suelos estén por vencer |
| 9 | **KPIs avanzados de negocio** | ROI por máquina, ranking de salas, proyecciones |

### Fase 4 — Futuro SCLM+ (Cuando Coljuegos lo implemente)

**Prioridad:** 🔮 Futura (pero prepararse desde ya)

| # | Módulo | Justificación |
|---|--------|---------------|
| 10 | **Dashboard de transmisión SCLM+** | Monitoreo en tiempo real del SCLM+ |
| 11 | **Alertas de no-transmisión** | Detección temprana de problemas |
| 12 | **Reconciliación con Coljuegos** | Tus datos vs los de ellos |

---

## 13. VISIÓN SaaS PARA OPERADORES DE JSA {#13-vision-saas}

### 13.1 Posicionamiento de Producto

**DR Group Dashboard NO es un ERP de juegos.**
**DR Group Dashboard ES un Centro de Control Operacional para Operadores de JSA.**

Complementa (no reemplaza) herramientas contables como Siigo, World Office o software de nómina.

### 13.2 Propuesta de Valor

> "Transforma el Excel mensual de Coljuegos en inteligencia operacional: sabe exactamente cuánto produce cada máquina, cuánto te debe cada dueño de sala, y si estás cumpliendo con toda la regulación."

### 13.3 Mercado Objetivo

| Segmento | Descripción | Dolor |
|----------|-------------|-------|
| **Operadores con contrato propio** (Modelo A) | Empresas que tienen 80+ MET's y operan directamente | "Proceso los Excel de Coljuegos manualmente en hojas de cálculo" |
| **Operadores con clientes** (Modelo B) | Empresas que tienen el contrato pero sus clientes operan las salas | "No sé quién me debe, cuánto, ni hace cuánto. Hago las cuentas de cobro a mano" |
| **Grupos con múltiples contratos** | Holdings con varios NIT y contratos de Coljuegos | "Manejar 3 empresas con 200+ máquinas distribuidas en 15 salas es caótico" |

### 13.4 Features Vendibles (en orden de valor percibido)

1. 🥇 **Procesamiento automático de Excel de Coljuegos** → "Lo que haces en 4 horas, el sistema lo hace en 30 segundos"
2. 🥈 **Cuentas de Cobro automáticas** → "PDF profesional listo para enviar, sin errores de cálculo"
3. 🥉 **Dashboard de cartera** → "Sabe exactamente quién te debe y hace cuánto"
4. 🏅 **Cumplimiento regulatorio** → "Nunca más un vencimiento por sorpresa"
5. 🏅 **Inventario de máquinas** → "¿Dónde está la máquina con NUC X-12345? Un clic"
6. 🏅 **Análisis de rentabilidad** → "¿Vale la pena esta sala? Los números dicen que no"

### 13.5 Consideraciones Multi-Tenant (Para SaaS futuro)

| Aspecto | Estado Actual | Para SaaS |
|---------|--------------|-----------|
| **Aislamiento de datos** | Multi-empresa dentro de un tenant | Requiere aislamiento por tenant (por organización cliente) |
| **Autenticación** | Firebase Auth con correos autorizados | Mantener, pero con domain segregation |
| **Personalización** | Logo/colores por usuario | Logo/colores por tenant (organización) |
| **Pricing** | No aplica (uso interno) | Por máquina/mes o por sala/mes |
| **Onboarding** | Manual | Self-service con período de prueba |

---

## 14. RIESGOS REGULATORIOS {#14-riesgos}

### 14.1 Riesgos que el Dashboard Puede Mitigar

| Riesgo | Consecuencia Sin Dashboard | Con Dashboard |
|--------|---------------------------|---------------|
| **Vencimiento de contrato** | Multa de 200% de derechos + cierre + penal | Alertas automáticas a 12/6/3/1 mes |
| **Menos de 80 MET's activas** | Incumplimiento contractual | Contador en tiempo real de elementos activos |
| **Documentos vencidos** | Sala puede ser clausurada en inspección | Alertas de vencimiento de Cámara Comercio y Uso de Suelos |
| **Declaración fuera de plazo** | Sanción del 30% sobre el mayor valor | Recordatorio automático antes del día 10 hábil |
| **Máquina en sala no autorizada** | Multa de 80 SMMLV por máquina | Inventario con ubicación verificada |
| **Error en cálculo de derechos** | Sanción del 160% de la diferencia | Cálculo automático verificado |
| **Máquinas sin producción prolongada** | Desperdicio de tarifa fija + riesgo de retiro | Detección proactiva con historial |

### 14.2 Riesgos de Negocio

| Riesgo | Descripción | Mitigación |
|--------|-------------|-----------|
| **SCLM+ cambia el paradigma** | Si Coljuegos recibe datos en tiempo real, el procesamiento de Excel se vuelve menos crítico | Prepararse para ser intermediario del SCLM+, no dependiente del Excel |
| **Cambios en Ley 643** | La ley puede modificarse (ya fue modificada por Ley 2294/2023) | Diseñar el sistema con parámetros configurables (no hardcodear 12%, 1%, 80 MET's) |
| **Competencia** | Otros desarrolladores podrían crear soluciones similares | Velocidad de implementación + conocimiento del negocio = ventaja |
| **Dependencia de Excel de Coljuegos** | Si el formato del Excel cambia, el parser debe actualizarse | Parser robusto con detección flexible de encabezados (ya implementado bien) |

---

## 15. GLOSARIO DE TÉRMINOS {#15-glosario}

| Término | Significado | Contexto en el Dashboard |
|---------|------------|--------------------------|
| **JSA** | Juegos de Suerte y Azar | Industria regulada por Coljuegos |
| **MET** | Máquina Electrónica Tragamonedas | Elemento principal de juego localizado |
| **NUC** | Número Único de Clasificación | Identificador regulatorio de cada máquina (campo `nuc` en datos) |
| **Serial** | Número de serie físico | Identificador del hardware (campo `serial` en datos) |
| **SMMLV** | Salario Mínimo Mensual Legal Vigente | Base para cálculo de tarifa fija ($1,423,500 en 2026 aprox.) |
| **SMDLV** | Salario Mínimo Diario Legal Vigente | Base para tarifa de bingos |
| **Derechos de Explotación** | 12% de ingresos brutos (producción) | Impuesto pagado a Coljuegos (Art. 8, Ley 643) |
| **Gastos de Administración** | 1% de los derechos de explotación | Sobrecargo administrativo (Art. 9, Ley 643) |
| **Tarifa Fija** | Porcentaje del SMMLV por tipo de MET | Alternativa cuando no hay producción (se paga el mayor) |
| **Tarifa Variable** | 12% de la producción real | Se compara con tarifa fija y se paga el mayor |
| **Base Liquidación** | Monto diario de liquidación | Columna del Excel de Coljuegos (= producción) |
| **Establecimiento** | Nombre del local/sala en el Excel | Se mapea a la colección `salas` |
| **Novedad** | Alerta de transmisión incompleta | Máquina no transmitió todos los días del mes |
| **Cuenta de Cobro** | Documento de facturación | PDF generado por FacturacionPage para cobrar al dueño de sala |
| **Concepto Previo** | Autorización del alcalde municipal | Requisito de Coljuegos para operar en un municipio |
| **Uso de Suelos** | Certificado de zonificación | Confirma que la ubicación permite actividades comerciales de JSA |
| **Contrato de Concesión** | Acuerdo con Coljuegos para operar | Vigencia 3-5 años, mínimo 80 MET's |
| **Proveedor Online** | Empresa de plataforma de juego | IGT, Novomatic, Zitro, Aristocrat — proveen el software/red |
| **SCLM+** | Sistema de Conexión en Línea MET | Plataforma de Coljuegos para monitoreo en tiempo real |
| **Máquinas en Cero** | MET's sin producción | Problema operativo: máquina conectada pero no genera ingresos |
| **Progresiva Interconectada** | MET con premio acumulado compartido | Tarifa más alta (45% SMMLV) pero potencialmente más producción |
| **ETESA** | Empresa Territorial para la Salud | Entidad predecesora — funciones ahora en Coljuegos |
| **Fecoljuegos** | Federación Colombiana de Juegos | Gremio de operadores de JSA |
| **Feceazar** | Federación Colombiana de Empresarios de Juegos de Azar | Gremio empresarial del sector |

---

## REFERENCIAS NORMATIVAS

1. **Ley 643 de 2001** — Régimen propio del monopolio rentístico de juegos de suerte y azar
   - Fuente: [Función Pública - Gestor Normativo](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4168)

2. **Decreto 1068 de 2015** — Decreto Único Reglamentario del Sector Hacienda (Libro 2, Parte 7, Título 5)

3. **Decreto 2483 de 2003** — Operación de juegos localizados a través de terceros

4. **Resolución 20182300011754 de 2018** — Concesión de juegos localizados

5. **Resolución 20241200014754 de julio 2024** — Requerimientos Técnicos SCLM+

6. **Resolución 20245100027144 de noviembre 2024** — Modificación de plazos SCLM+

7. **Ley 1393 de 2010** — Modificaciones a sanciones (Art. 14 y 20)

8. **Ley 599 de 2000** — Código Penal, Art. 312: Ejercicio ilícito de actividad monopolística

9. **Ley 2294 de 2023** — Plan Nacional de Desarrollo (modificaciones a Ley 643)

10. **Coljuegos** — Portal oficial: [www.coljuegos.gov.co](https://www.coljuegos.gov.co)

---

> **Nota:** Este documento es un análisis estratégico interno generado con base en información pública de Coljuegos, la Ley 643 de 2001 y sus modificaciones, y el análisis del código fuente del Dashboard DR Group. No constituye asesoría legal. Para decisiones regulatorias, consultar siempre con un abogado especializado en derecho de juegos de suerte y azar.

---

**Documento generado:** Febrero 2026
**Próxima revisión sugerida:** Cuando Coljuegos publique requisitos finales del SCLM+
