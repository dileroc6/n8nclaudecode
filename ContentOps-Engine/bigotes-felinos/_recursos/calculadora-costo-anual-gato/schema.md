# Schema JSON-LD — Calculadora costo anual gato Colombia

## Justificación de la elección

Evaluamos tres tipos de schema para esta pieza. Cada uno tiene consecuencias distintas en cómo Google y los motores de respuesta interpretan el contenido:

| Schema | Encaje | Veredicto |
|--------|--------|-----------|
| `HowTo` | Bajo. `HowTo` describe pasos para realizar una acción física o un procedimiento (ej: "cómo bañar a un gato"). Una calculadora no es un procedimiento — es una herramienta. Forzar `HowTo` desorienta a Google y arriesga penalización de rich snippet por uso indebido. | Descartado |
| `WebApplication` | Alto. Es el tipo correcto para herramientas interactivas embebidas en una página. Comunica a Google que esta página tiene una utilidad activa y no solo texto editorial. | Adoptado |
| `FAQPage` | Alto. La sección de preguntas frecuentes de la página es elegible para rich snippets de FAQ. | Adoptado |
| `Article` | Medio. La pieza tiene componente editorial extenso (1.100+ palabras), lo que justifica `Article` como envoltura de la página. | Adoptado |

**Decisión:** combo de tres schemas en JSON-LD separados:

1. `WebApplication` — describe la calculadora como herramienta.
2. `FAQPage` — captura los rich snippets de las preguntas frecuentes.
3. `Article` — envuelve el contenido editorial con autor, fecha y publisher.

Los tres pueden convivir en la misma página sin conflicto. Google rastrea cada bloque por separado y elige el más relevante según la query del usuario.

## Bloque 1 — WebApplication (la calculadora)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculadora del costo anual de tu gato en Colombia",
  "description": "Calculadora interactiva que estima el costo mensual y anual de tener un gato en Colombia, ajustado por ciudad, edad del gato, tipo de alimento, estado de esterilización y frecuencia de visitas veterinarias.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any (browser-based)",
  "url": "https://bigotesfelinos.com/cuanto-cuesta-tener-un-gato-en-colombia/",
  "browserRequirements": "Requires JavaScript enabled",
  "isAccessibleForFree": true,
  "inLanguage": "es-CO",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "COP"
  },
  "creator": {
    "@type": "Organization",
    "name": "Bigotes Felinos",
    "url": "https://bigotesfelinos.com/"
  },
  "audience": {
    "@type": "Audience",
    "geographicArea": {
      "@type": "Country",
      "name": "Colombia"
    }
  }
}
</script>
```

## Bloque 2 — FAQPage (preguntas frecuentes)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Por qué la calculadora prorratea las vacunas mensualmente?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las vacunas anuales (refuerzo trivalente, leucemia, rabia) se aplican una vez al año pero el costo se distribuye en el presupuesto mensual para que no te tome por sorpresa. Si prefieres ahorrar el monto exacto en una alcancía aparte, multiplica el valor mensual de la categoría por doce."
      }
    },
    {
      "@type": "Question",
      "name": "¿La esterilización es realmente necesaria?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, y no solo por control reproductivo. Los gatos esterilizados tienen menor incidencia de cáncer de mama, infecciones uterinas y enfermedades transmitidas en peleas. La inversión única se paga sola en cuentas veterinarias evitadas a lo largo de la vida del peludito."
      }
    },
    {
      "@type": "Question",
      "name": "¿Por qué el costo del veterinario varía tanto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La diferencia entre clínicas básicas, especializadas y hospitales 24 horas es enorme. Una consulta general puede costar 60.000 pesos en un barrio residencial y 180.000 en una clínica especializada del norte de Bogotá. La calculadora usa promedios de clínicas de gama media en cada ciudad."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué pasa si tengo dos gatos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "El gasto no se duplica exactamente: la arena, los juguetes y algunos antiparasitarios escalan con descuento. Como regla práctica, multiplica el resultado por 1.7 para dos gatos y por 2.4 para tres."
      }
    },
    {
      "@type": "Question",
      "name": "¿Estos números aplican para razas grandes como Maine Coon?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las razas grandes consumen entre 30% y 50% más alimento. Para un Maine Coon adulto suma aproximadamente 80.000 pesos mensuales al rubro de alimento que te entregue la calculadora. Las razas con pelaje denso también pueden necesitar peluquería profesional ocasional."
      }
    }
  ]
}
</script>
```

## Bloque 3 — Article (envoltura editorial)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "¿Cuánto cuesta tener un gato al año en Colombia? Calculadora 2026",
  "description": "Calcula en 30 segundos el costo mensual y anual de tener un gato en Colombia ajustado a tu ciudad, edad del peludito y tipo de alimento. Datos 2026 de Bogotá, Medellín, Cali, Barranquilla y Cartagena.",
  "image": "https://bigotesfelinos.com/wp-content/uploads/2026/05/calculadora-costo-gato-colombia.webp",
  "datePublished": "2026-05-07",
  "dateModified": "2026-05-07",
  "inLanguage": "es-CO",
  "author": {
    "@type": "Organization",
    "name": "Equipo Editorial Bigotes Felinos",
    "url": "https://bigotesfelinos.com/equipo-editorial/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Bigotes Felinos",
    "url": "https://bigotesfelinos.com/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bigotesfelinos.com/wp-content/uploads/2024/logo-bigotes-felinos.webp"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://bigotesfelinos.com/cuanto-cuesta-tener-un-gato-en-colombia/"
  },
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".respuesta-directa", ".key-takeaways"]
  }
}
</script>
```

## Notas de implementación

- Los tres bloques van juntos en el `<head>` o al final del `<body>` del post WP. WordPress + Yoast permite inyectarlos vía el campo "Esquema personalizado" de Yoast Premium o, si no se tiene Premium, vía un plugin de inserción de código en el header.
- El selector `speakable` apunta a clases CSS que ya existen en los artículos AEO de BF (`.respuesta-directa`, `.key-takeaways`). Mantener consistencia con el resto del catálogo.
- Validar los tres bloques en `https://search.google.com/test/rich-results` después de publicar.
- La URL canónica debe coincidir exactamente entre los tres bloques y el `<link rel="canonical">` del post.
