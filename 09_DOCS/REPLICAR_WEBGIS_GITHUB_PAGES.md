# Guia para replicar una WebGIS en GitHub Pages

## Objetivo

Esta carpeta `SERVER` sirve como plantilla para montar una WebGIS estatica similar a las usadas en los proyectos Audorf-Kassoe y Karben. La idea es separar claramente:

- fuentes GIS originales,
- datos procesados para la web,
- aplicacion Leaflet,
- documentos y activos,
- entregables PDF/KMZ,
- scripts de actualizacion,
- despliegue en GitHub Pages.

La web final debe poder publicarse como una pagina estatica de GitHub Pages, normalmente desde la carpeta `05_WEB`.

## Estructura creada

```text
SERVER/
  .github/
    workflows/
  01_QGIS/
  02_CAD/
  03_DATA/
    raw/
    processed/
  04_PERMITS/
  05_WEB/
    assets/
      logos/
      pdf/
    data/
      wbk/
      catastro/
      permits/
      environment/
      infrastructure/
    tools/
  06_ATLAS/
    exports_pdf/
    screenshots/
  07_ASSETS/
  08_KMZ/
  09_DOCS/
  10_DEPLOY/
  tools/
```

## Uso de cada carpeta

### `.github/workflows`

Contiene los workflows de GitHub Actions. Se usa si se quiere automatizar el despliegue de GitHub Pages o ejecutar conversiones antes de publicar.

Para una web estatica sencilla, GitHub Pages puede configurarse directamente desde:

`Settings > Pages > Deploy from branch > main > /05_WEB`

Si GitHub no permite elegir `/05_WEB`, se puede publicar desde la raiz y dejar un `index.html` que redirija a `05_WEB/index.html`, o usar un workflow.

### `01_QGIS`

Aqui se guarda el proyecto QGIS principal del servidor.

Recomendaciones:

- Usar rutas relativas en QGIS siempre que sea posible.
- Guardar el proyecto como `.qgz`.
- Mantener una unica version principal con nombre claro, por ejemplo:
  `italia_webgis.qgz`
- Si se crean backups, ponerlos en una subcarpeta o no subirlos al repositorio.

Capas tipicas:

- apoyos o torres,
- trazado de linea,
- accesos existentes,
- accesos temporales,
- superficies de trabajo,
- zonas ambientales,
- catastro,
- puntos de rescate,
- almacenes,
- zonas de proteccion.

### `02_CAD`

Carpeta para ficheros CAD de entrada y salida.

Ejemplos:

- `export_autocad.dxf`
- planos CAD recibidos del proyectista,
- DXF generados desde QGIS,
- DWG/DXF de entrega,
- capas auxiliares exportadas.

Si la web se alimenta desde DXF, esta carpeta debe contener siempre el ultimo DXF oficial que se va a convertir a GeoJSON.

### `03_DATA/raw`

Datos originales sin modificar.

Ejemplos:

- KMZ recibidos,
- GPKG originales,
- shapefiles,
- Excel originales,
- datos descargados de servicios WFS/WMS,
- exports iniciales de QGIS.

No editar directamente estos archivos salvo que sea necesario. Sirven como trazabilidad.

### `03_DATA/processed`

Datos ya limpiados o transformados.

Ejemplos:

- GeoPackage consolidado,
- capas reproyectadas,
- tablas normalizadas,
- resultados intermedios de scripts.

### `04_PERMITS`

Carpeta para permisos, propietarios y estados de autorizacion.

Formato recomendado para Excel:

| Campo | Uso |
| --- | --- |
| `Flur` | Numero de Flur |
| `Flurstueck` o `Flurstück` | Numero de parcela |
| `Ampel` | Estado visual del permiso |
| `Letzter Kontakt` | Ultimo contacto |
| `Bemerkung` | Observaciones |
| `Eigentuemer` | Propietario, si existe dato legalmente disponible |

Estados recomendados:

- `Zustimmung erteilt`: verde.
- `kontaktiert`: amarillo.
- vacio o `keine Kontaktdaten vorliegen`: rojo.

Importante: los datos personales de propietarios deben tratarse con cautela. En Alemania no se deben inventar ni obtener de fuentes no autorizadas. Si proceden de Grundbuch u otra fuente restringida, debe existir interes legitimo y gestion documental adecuada.

### `05_WEB`

Carpeta publica de la WebGIS.

Contenido minimo recomendado:

```text
05_WEB/
  index.html
  app.js
  style.css
  assets/
  data/
```

La web debe funcionar con Live Server y tambien en GitHub Pages.

Patron usado en proyectos anteriores:

- `index.html`: estructura principal, header, panel lateral, contenedores de mapa y modales.
- `style.css`: UX, colores, paneles, controles, leyendas, popups.
- `app.js`: Leaflet, carga de GeoJSON, WFS/WMS, popups, buscador de apoyo, capas.
- `data/`: GeoJSON publicados.
- `assets/logos/`: logotipos del cliente/proyecto.
- `assets/pdf/`: planos, fichas tecnicas y documentos enlazables.

### `05_WEB/data/wbk`

Capas WBK o superficies constructivas.

Nombres recomendados:

- `wbk_weg_best.geojson`
- `wbk_weg_temp.geojson`
- `wbk_arbeitsflaeche.geojson`
- `wbk_geruest.geojson`
- `wbk_schutzbereich.geojson`
- `wbk_schutznetz.geojson`
- `wbk_sperrung.geojson`

Estilo recomendado para mapa satelite:

- accesos existentes: color solido visible, sin verde ni marron,
- accesos temporales: color vivo y contrastado,
- superficies de trabajo: relleno solido con borde definido,
- protecciones o restricciones: tramas o color distinto,
- evitar transparencias demasiado bajas porque desaparecen sobre ortofoto.

### `05_WEB/data/catastro`

Datos catastrales publicados o cacheados.

Opciones:

- cargar catastro por WFS en tiempo real,
- generar GeoJSON cacheado por buffer de proyecto,
- separar labels de Flurstueck como capa independiente.

Recomendacion:

Para mejorar rendimiento, no cargar todo el WFS al abrir la web. Usar una de estas estrategias:

- cargar catastro solo a partir de cierto zoom,
- cargar por bounding box visible,
- precalcular un GeoJSON para un buffer de 800 m alrededor de la linea,
- tener una capa independiente de etiquetas de parcela para poder activarlas/desactivarlas.

### `05_WEB/data/permits`

GeoJSON o JSON derivado del Excel de permisos.

Uso:

- pintar parcelas con estado de permiso,
- popup con estado y ultima fecha de contacto,
- leyenda de colores.

### `05_WEB/data/environment`

Capas ambientales.

Ejemplos:

- Schutzgebiete,
- biotopos,
- zonas forestales,
- restricciones ambientales,
- Vogelschutzmarker si aplica.

### `05_WEB/data/infrastructure`

Infraestructuras externas.

Ejemplos:

- lineas electricas existentes,
- carreteras,
- ferrocarril,
- cruzamientos,
- conducciones,
- puntos de rescate,
- almacenes.

### `05_WEB/tools`

Scripts especificos de la web.

Ejemplos:

- conversion de Excel a JSON,
- limpieza de GeoJSON,
- generacion de labels,
- validacion de capas.

### `06_ATLAS`

Salidas cartograficas PDF.

Subcarpetas:

- `exports_pdf`: atlas, Lageplaene, planos para cliente.
- `screenshots`: capturas de areas de trabajo o apoyos.

### `07_ASSETS`

Activos generales no necesariamente publicados en la web.

Ejemplos:

- logos fuente,
- fotos,
- iconos,
- PDFs originales,
- plantillas.

Lo que tenga que ser accesible desde GitHub Pages debe copiarse tambien a `05_WEB/assets`.

### `08_KMZ`

KMZ de entrega.

Recomendacion de estructura interna del KMZ:

- `Masten`
- `Leitung`
- `Arbeitsflaechen`
- `Zuwegungen`
- `Schutzbereiche`
- `Rettungspunkte`
- `Baulager`
- `Kataster`
- `Umwelt`

Si un KMZ contiene enlaces a PDF, para que funcionen fuera del ordenador local conviene alojar los PDFs en GitHub Pages o incluirlos junto al KMZ en un ZIP con rutas relativas bien probadas.

### `09_DOCS`

Documentacion tecnica y trazabilidad.

Debe contener:

- este manual,
- changelog,
- notas de despliegue,
- descripcion de fuentes,
- decisiones de diseño,
- instrucciones para actualizar el proyecto.

### `10_DEPLOY`

Carpeta para logs, paquetes de despliegue y comprobaciones.

Ejemplos:

- listado de archivos publicados,
- registro de commits,
- capturas de validacion,
- ZIP final para entrega externa.

### `tools`

Scripts generales del servidor.

Ejemplos:

- `update_webgis.ps1`
- `convert_dxf_to_geojson.py`
- `build_kmz.py`
- `validate_geojson.py`
- `publish.ps1`

## Flujo recomendado para crear una nueva WebGIS

### 1. Crear repositorio local

Abrir PowerShell en `SERVER`:

```powershell
cd "G:\Mi unidad\ITALIA\Proyectos\SERVER"
git init
git branch -M main
```

### 2. Crear repositorio en GitHub

Crear un repositorio nuevo en GitHub, por ejemplo:

```text
Italia-WebGIS
```

Despues conectar:

```powershell
git remote add origin https://github.com/USUARIO/Italia-WebGIS.git
```

### 3. Preparar la web base

Crear estos archivos:

```text
05_WEB/index.html
05_WEB/app.js
05_WEB/style.css
```

El `index.html` debe incluir:

- Leaflet CSS/JS,
- cabecera con nombre del proyecto,
- fecha de estado actualizado,
- contenedor `#map`,
- panel de capas,
- buscador de apoyo,
- modal de apoyo,
- modal de parcela,
- leyenda.

### 4. Preparar datos GIS

Colocar datos originales:

- QGIS en `01_QGIS`.
- CAD/DXF en `02_CAD`.
- KMZ/GPKG/Excel originales en `03_DATA/raw`.
- Excel de permisos en `04_PERMITS`.

Exportar capas web a GeoJSON en `05_WEB/data`.

CRS recomendado para web:

```text
EPSG:4326
```

Leaflet espera coordenadas longitud/latitud en WGS84.

### 5. Conversion desde QGIS

En QGIS:

1. Abrir proyecto principal.
2. Comprobar que las capas tienen geometria correcta.
3. Reproyectar o exportar a `EPSG:4326`.
4. Exportar como GeoJSON a `05_WEB/data/...`.
5. Usar nombres estables para que `app.js` no tenga que cambiar.

### 6. Conversion desde DXF

Si se parte de un DXF, usar GDAL/OGR:

```powershell
ogr2ogr -f GeoJSON "05_WEB\data\wbk\wbk_weg_temp.geojson" "02_CAD\export_autocad.dxf" -t_srs EPSG:4326 -where "Layer='WBK_WEG_TEMP'"
```

Adaptar `Layer='...'` al nombre real de la capa CAD.

Capas habituales:

```text
WBK_WEG_BEST
WBK_WEG_TEMP
WBK_ARBEITSFLAECHE
WBK_GERUEST
WBK_SCHUTZBEREICH
WBK_SCHUTZNETZ
WBK_SPERRUNG
```

### 7. Permisos de propietarios

Flujo recomendado:

1. Actualizar Excel en `04_PERMITS`.
2. Normalizar campos `Flur` y `Flurstueck`.
3. Vincular con catastro por clave:

```text
Gemarkung + Flur + Flurstueck
```

4. Generar GeoJSON de permisos en `05_WEB/data/permits`.
5. Pintar en web:

```text
verde: Zustimmung erteilt
amarillo: kontaktiert
rojo: vacio / keine Kontaktdaten vorliegen
```

6. En popup mostrar:

- Flur,
- Flurstueck,
- estado,
- ultima fecha de contacto,
- observaciones disponibles.

### 8. Catastro

Opciones:

- WFS online.
- GeoJSON precalculado.

Para rendimiento, lo mas estable suele ser:

1. Definir buffer de proyecto, por ejemplo 800 m alrededor de la linea.
2. Descargar/cargar catastro solo en ese buffer.
3. Guardar poligonos en `05_WEB/data/catastro/parcels.geojson`.
4. Guardar etiquetas en `05_WEB/data/catastro/parcels_labels.geojson`.
5. En la web:
   - capa Catastro con poligonos sin relleno,
   - capa Flurstuecknummern con etiquetas activable/desactivable,
   - popup al clickar parcela.

### 9. Popups recomendados

#### Popup de apoyo

Debe incluir:

- numero de apoyo,
- tipo de apoyo,
- Leitung / Abschnitt,
- cadenas o accesorios,
- enlaces a PDFs tecnicos,
- informacion de erdung si aplica,
- enlace de navegacion Google Maps.

Formato de link Google Maps:

```text
https://www.google.com/maps/dir/?api=1&destination=LAT,LON
```

#### Popup de parcela

Debe incluir:

- Gemarkung,
- Flur,
- Flurstueck,
- area si esta disponible,
- estado de permiso,
- ultima fecha de contacto,
- datos WFS disponibles,
- link Google Maps al punto clickado.

### 10. Estilo de capas

Para ortofoto/satelite:

- evitar verdes y marrones para capas constructivas porque se confunden con campo/bosque,
- usar colores de alto contraste,
- usar bordes oscuros o blancos segun fondo,
- no depender solo de transparencia,
- mantener leyenda clara.

Ejemplo de colores:

```text
Arbeitsflaechen: magenta / fucsia
Zuwegung temporaer: cyan / azul electrico
Zuwegung vorhanden: naranja fuerte o blanco con borde oscuro
Geruest: violeta
Sperrung: rojo
Schutzbereich: amarillo con borde negro
Rettungspunkte: rojo con simbolo medico
Baulager: amarillo/negro
```

### 11. Actualizacion de fecha

Cada deploy debe actualizar el texto visible:

```text
Estado actualizado: DD.MM.YYYY
```

En proyectos alemanes puede usarse:

```text
Stand: DD.MM.YYYY
```

En proyectos italianos puede usarse:

```text
Stato aggiornamento: DD.MM.YYYY
```

### 12. Prueba local

Con VS Code Live Server:

```text
http://127.0.0.1:5500/SERVER/05_WEB/index.html
```

Comprobar:

- carga del mapa,
- capas activables,
- buscador de apoyo,
- popup de apoyo,
- popup de parcela,
- leyenda,
- links PDF,
- Google Maps links,
- rendimiento con catastro,
- visualizacion sobre satelite.

### 13. Commit y push

Antes de subir:

```powershell
git status --short
```

Agregar solo lo que se quiere publicar:

```powershell
git add 05_WEB 09_DOCS .github
git commit -m "Initial WebGIS structure"
git push -u origin main
```

Evitar `git add -A` si hay backups, temporales o archivos grandes no deseados.

### 14. Configurar GitHub Pages

En GitHub:

1. Abrir repositorio.
2. Ir a `Settings`.
3. Entrar en `Pages`.
4. Elegir branch `main`.
5. Elegir carpeta:
   - `/05_WEB` si GitHub lo permite,
   - o `/root` si se usa redireccion desde raiz,
   - o workflow si se necesita publicar una subcarpeta.

URL final esperada:

```text
https://USUARIO.github.io/NOMBRE_REPO/
```

O si la web queda en subcarpeta:

```text
https://USUARIO.github.io/NOMBRE_REPO/05_WEB/
```

## Workflow opcional para GitHub Pages

Si se quiere publicar `05_WEB` mediante GitHub Actions, crear:

```text
.github/workflows/pages.yml
```

Contenido recomendado:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./05_WEB

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Luego en GitHub Pages elegir:

```text
Source: GitHub Actions
```

## Checklist de replicacion para otro proyecto

1. Copiar la carpeta `SERVER`.
2. Cambiar el nombre visible del proyecto en `05_WEB/index.html`.
3. Sustituir logos en `05_WEB/assets/logos`.
4. Sustituir PDFs en `05_WEB/assets/pdf`.
5. Guardar QGIS principal en `01_QGIS`.
6. Guardar CAD/KMZ/GPKG originales en `02_CAD` o `03_DATA/raw`.
7. Exportar GeoJSON definitivos a `05_WEB/data`.
8. Actualizar `app.js` con rutas y nombres de capas.
9. Actualizar fecha de estado.
10. Probar en Live Server.
11. Crear repo GitHub.
12. Commit y push.
13. Activar GitHub Pages.
14. Verificar URL publicada.

## Checklist antes de cada deploy

1. Confirmar fuente actualizada:
   - DXF,
   - QGIS,
   - Excel,
   - KMZ,
   - PDFs.
2. Ejecutar conversiones.
3. Validar conteo de features en GeoJSON.
4. Abrir web en local.
5. Comprobar popups.
6. Comprobar capas por defecto.
7. Actualizar fecha de estado.
8. Revisar `git status --short`.
9. Commit solo de archivos relevantes.
10. Push.
11. Verificar GitHub Pages.

## Reglas practicas de mantenimiento

- No cambiar nombres de archivos GeoJSON si `app.js` ya depende de ellos.
- No subir archivos temporales de QGIS salvo necesidad.
- No subir datos personales innecesarios.
- No publicar propietarios si no existe base legal y autorizacion.
- Mantener los PDFs enlazados dentro de `05_WEB/assets/pdf`.
- Para archivos muy pesados, valorar Git LFS o no publicarlos.
- Documentar cada cambio importante en `09_DOCS`.

## Comandos utiles

Ver estado:

```powershell
git status --short
```

Ver ultimo commit:

```powershell
git log --oneline -5
```

Crear commit:

```powershell
git add 05_WEB 09_DOCS
git commit -m "Update WebGIS layers"
```

Subir:

```powershell
git push origin main
```

Contar features de GeoJSON con Python:

```powershell
py -X utf8 -c "import json, pathlib; p=pathlib.Path('05_WEB/data'); [print(f.name, len(json.load(open(f,encoding='utf-8')).get('features',[]))) for f in p.rglob('*.geojson')]"
```

## Entregable creado

Ruta de plantilla:

```text
G:\Mi unidad\ITALIA\Proyectos\SERVER
```

Documento principal:

```text
G:\Mi unidad\ITALIA\Proyectos\SERVER\09_DOCS\REPLICAR_WEBGIS_GITHUB_PAGES.md
```
