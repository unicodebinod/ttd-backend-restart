/***************************************************************************************************
    Abhängige Pakete die in der package.json definiert sind
*****************************************************************************************************/
const express = require('express')                  // http-server framework
const cors = require('cors')                        // CORS deaktivieren
const csv = require('csv-parser');                  // handler für CSV Dateien
const fs = require('fs');                           // handler zum lesen/schreiben von Dateien
const ObjectsToCsv = require('objects-to-csv')      // Wandlet CSV Zeilen in JSON-Objekte um

/***************************************************************************************************
    Konfigurationen
*****************************************************************************************************/
const port = process.env.PORT || 3000               // Konfiguration des Webserver-Ports
let morgan = require('morgan')                      // http-zugriff logging auf der CLI
let bodyParser = require('body-parser');            // einfacher handler für POST/PUT payloads
const corsOptions = {                               // CORS-Optionen definieren
    origin: '*'
}

/***************************************************************************************************
    express framework initialisieren
****************************************************************************************************/
const app = express()                               // express app erstellen

app.use(bodyParser.json());                         // den body-parser übergeben
app.use(morgan('combined'))                         // den http-logger übergeben
app.use(cors(corsOptions))                          // CORS-Einstellungen übergeben

/***************************************************************************************************
    todo liste
****************************************************************************************************/
let todoListe = []                                  // Array Liste der todo-Einträge

/***************************************************************************************************
    CSV Datei lesen und zur Liste hinzufügen
****************************************************************************************************/
fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (row) => {
        todoListe.push(row)
    })

/***************************************************************************************************
    Standard-Route, ohne funktion
****************************************************************************************************/
app.get("/", (request, response) => {
    response.json({
        greeting: "Hello World of Techstarter!"
    })
});

/***************************************************************************************************
    Ausgabe aller Objekte als Array
****************************************************************************************************/
app.get('/todos', (request, response) => {
    // Ausgabe der Liste
    response.json(todoListe);
})

/***************************************************************************************************
    Erstellen eines neuen Eintrags
    Übertragen wird der payload in der form
    ```
    {
        "name": "Ein neuer Eintrag"
    }
    ```
****************************************************************************************************/
app.post('/todos', function(request, response) {
    // letzte ID ermitteln
    let lastId = 0;

    // alle elemente durchlaufen und die größte ID ermitteln
    for(let i = 0; i < todoListe.length; i++){
        let currentId = parseInt(todoListe[i]['id']);

        if(currentId > lastId){
            lastId = currentId;
        }
    }

    // neues Objekt, mit neuer ID und payload
    let item = {
        id: lastId + 1,
        name: request.body['name'],
        done: 'false'
    }

    // Eintrag an die Liste hängen
    todoListe.push(item)

    // CSV speichern
    const csv = new ObjectsToCsv(todoListe)
    csv.toDisk('./data.csv')

    // Ausgabe der Liste
    response.json(todoListe);
});

/***************************************************************************************************
    Aktualisieren eines bestehenden Eintrags
    Übertragen wird der payload in der form
    ```
    {
        "id": 1,
        "done": true
    }
    ```
****************************************************************************************************/
app.put('/todos', function(request, response) {
    // payload
    let body = request.body
    // ID ermitteln die mitgeschickt wird
    let id = body['id'];

    // eintrag mit der ID suchen
    const indexOfObject = todoListe.findIndex(object => {
        return object.id == id;
    });

    // wenn das objekt gefunden wurde, wird es aktualisiert
    if (indexOfObject >= 0) {
        todoListe[indexOfObject].done = body['done'].toString();
        // CSV speichern
        const csv = new ObjectsToCsv(todoListe)
        csv.toDisk('./data.csv')
    }

    // Ausgabe der neuen Liste
    response.json(todoListe);
});

/***************************************************************************************************
    Löschen eines bestehenden Eintrags
****************************************************************************************************/
app.delete('/todos/:id', function(request, response) {
    // ID aus der URL ermitteln
    let id = request.params['id']

    // objekt in der liste finden
    const indexOfObject = todoListe.findIndex(object => {
        return object.id === id;
    });

    // array der objekte an der position "zerschneiden" um das objekt zu entfernen
    todoListe.splice(indexOfObject, 1);

    // CSV speichern
    const csv = new ObjectsToCsv(todoListe)
    csv.toDisk('./data.csv')

    // Ausgabe der Liste
    response.json(todoListe)
});


/***************************************************************************************************
    Starten der express Anwendung
****************************************************************************************************/
app.listen(port, () => console.log(`Techstarter Todo App listening on port ${port}!`))