# WebGIS T.842 Quartaie–Molassana

Visor cartografico operativo del progetto **23842B1 – Linea 132 kV Quartaie–Molassana**, realizzato per ELECNOR e pubblicabile come sito statico tramite GitHub Pages.

## Contenuti

- 114 sostegni con ricerca, tipologia e dati tecnici.
- asse della linea e fascia di lavoro di 400 m.
- ortofoto Esri come cartografia di base.
- particelle e fabbricati catastali senza riempimento.
- habitat Natura 2000 e pericolosita alluvionale.
- rete viaria, accessi e strade temporanee da 3,5 m.
- aree macchine e documentazione del piano di stendimento.

## Uso locale

Il sito deve essere aperto attraverso un server HTTP, non direttamente come file:

```powershell
python -m http.server 8000 --directory 05_WEB
```

Aprire quindi `http://localhost:8000`.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` pubblica automaticamente la cartella `05_WEB` su GitHub Pages a ogni aggiornamento del ramo `main`.

## Avvertenza

Il WebGIS e uno strumento operativo di consultazione. Geometrie e informazioni non sostituiscono gli elaborati esecutivi approvati.

La metodologia di replica e descritta in [09_DOCS/REPLICAR_WEBGIS_GITHUB_PAGES.md](09_DOCS/REPLICAR_WEBGIS_GITHUB_PAGES.md).
