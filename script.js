document.addEventListener('DOMContentLoaded', () => {
    const modeButtons = document.querySelectorAll('.mode-selection button');
    const currentListNameEl = document.getElementById('currentListName');
    const checklistEl = document.getElementById('checklist');
    const newItemTextEl = document.getElementById('newItemText');
    const addItemBtn = document.getElementById('addItemBtn');
    const resetListBtn = document.getElementById('resetListBtn');

    const departureTimeEl = document.getElementById('departureTime');
    const setReminderBtn = document.getElementById('setReminderBtn');
    const reminderStatusEl = document.getElementById('reminderStatus');

    let currentMode = null;
    let allLists = {}; // Vil holde alle lister
    let reminderInterval = null;
    let reminderTime = null;

    // Standardlister
    const defaultLists = {
        fritid: [
            { text: "Nøkler (hus, bil)", checked: false },
            { text: "Lommebok/Kort", checked: false },
            { text: "Mobiltelefon", checked: false },
            { text: "Ørepropper/Hodetelefoner", checked: false },
            { text: "Vannflaske", checked: false },
        ],
        jobb: [
            { text: "Nøkler (jobb, medisinskap)", checked: false },
            { text: "ID-kort/Adgangskort", checked: false },
            { text: "Mobiltelefon (jobb/privat)", checked: false },
            { text: "Stetoskop", checked: false },
            { text: "Termometer", checked: false },
            { text: "Penn og notatblokk", checked: false },
            { text: "Matpakke", checked: false },
            { text: "Vannflaske/Kaffekopp", checked: false },
            { text: "Navneskilt", checked: false },
        ],
        stallen: [
            { text: "ALT FRA JOBB-LISTEN", checked: false, isCategory: true },
            { text: "Fulladet jobbtelefon/nettbrett", checked: false },
            { text: "Bilnøkler", checked: false },
            { text: "GPS/Kart-app klar", checked: false },
            { text: "Kjølebag for medisiner/prøver", checked: false },
            { text: "Nødvendige medisiner", checked: false },
            { text: "Prøvetakingsutstyr", checked: false },
            { text: "Hansker (flere par)", checked: false },
            { text: "Hånddesinfeksjon (ekstra)", checked: false },
            { text: "Støvler/Sko-overtrekk", checked: false },
            { text: "Beskyttelsesfrakk/kjeledress", checked: false },
            { text: "Hodelykt", checked: false },
        ],
        langtur: [
            { text: "Billetter/Bookingbekreftelser", checked: false },
            { text: "Pass/ID", checked: false },
            { text: "Toalettsaker", checked: false },
            { text: "Personlige medisiner", checked: false },
            { text: "Klær for X dager", checked: false },
            { text: "Lader(e) til alle enheter", checked: false },
            { text: "Powerbank", checked: false },
        ]
    };

    // Last lister fra localStorage eller bruk standard
    function loadLists() {
        const storedLists = localStorage.getItem('veskeVaktenLists');
        if (storedLists) {
            allLists = JSON.parse(storedLists);
            // Sørg for at alle default moduser finnes, i tilfelle nye er lagt til i koden
            for (const mode in defaultLists) {
                if (!allLists[mode]) {
                    allLists[mode] = defaultLists[mode];
                }
            }
        } else {
            allLists = JSON.parse(JSON.stringify(defaultLists)); // Deep copy
        }
        // Last lagret avreisetid
        const storedDepartureTime = localStorage.getItem('veskeVaktenDepartureTime');
        if (storedDepartureTime) {
            departureTimeEl.value = storedDepartureTime;
            reminderTime = storedDepartureTime;
        }
    }

    // Lagre lister til localStorage
    function saveLists() {
        localStorage.setItem('veskeVaktenLists', JSON.stringify(allLists));
    }
     // Lagre avreisetid
    function saveDepartureTime() {
        localStorage.setItem('veskeVaktenDepartureTime', departureTimeEl.value);
    }


    // Vis den valgte listen
    function renderList() {
        if (!currentMode || !allLists[currentMode]) {
            checklistEl.innerHTML = '<li>Velg en modus.</li>';
            resetListBtn.style.display = 'none';
            return;
        }

        const items = allLists[currentMode];
        checklistEl.innerHTML = ''; // Tøm listen

        if (items.length === 0) {
            checklistEl.innerHTML = '<li>Listen er tom. Legg til elementer!</li>';
        } else {
            items.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = item.checked ? 'checked' : '';
                if (item.isCategory) { // For å vise "ALT FRA JOBB-LISTEN" annerledes
                     li.innerHTML = `<strong>${item.text}</strong>`;
                } else {
                    li.innerHTML = `
                        <input type="checkbox" id="item-${index}" ${item.checked ? 'checked' : ''} data-index="${index}">
                        <label for="item-${index}">${item.text}</label>
                        <button class="delete-item" data-index="${index}">×</button>
                    `;
                }
                checklistEl.appendChild(li);
            });
        }
        resetListBtn.style.display = items.length > 0 ? 'inline-block' : 'none';
    }

    // Bytt til en modus
    function selectMode(mode) {
        currentMode = mode;
        const modeName = mode.charAt(0).toUpperCase() + mode.slice(1); // "jobb" -> "Jobb"
        currentListNameEl.textContent = `Pakkeliste: ${modeName}`;
        renderList();
    }

    // Håndter klikk på modusknapper
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectMode(button.dataset.mode);
        });
    });

    // Legg til nytt element i listen
    addItemBtn.addEventListener('click', () => {
        if (!currentMode) {
            alert("Velg en modus først!");
            return;
        }
        const text = newItemTextEl.value.trim();
        if (text) {
            allLists[currentMode].push({ text: text, checked: false });
            newItemTextEl.value = '';
            saveLists();
            renderList();
        }
    });
     newItemTextEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItemBtn.click();
        }
    });


    // Håndter avhuking og sletting
    checklistEl.addEventListener('click', (e) => {
        const target = e.target;
        if (!currentMode) return;

        if (target.type === 'checkbox') {
            const index = parseInt(target.dataset.index);
            allLists[currentMode][index].checked = target.checked;
            saveLists();
            renderList(); // Re-render for å oppdatere stil
        } else if (target.classList.contains('delete-item')) {
            const index = parseInt(target.dataset.index);
            if (confirm(`Sikker på at du vil slette "${allLists[currentMode][index].text}"?`)) {
                allLists[currentMode].splice(index, 1);
                saveLists();
                renderList();
            }
        }
    });

    // Nullstill alle avhukinger for gjeldende liste
    resetListBtn.addEventListener('click', () => {
        if (!currentMode || !allLists[currentMode]) return;
        if (confirm(`Vil du nullstille alle avhukinger for listen "${currentMode}"?`)) {
            allLists[currentMode].forEach(item => item.checked = false);
            saveLists();
            renderList();
        }
    });

    // Påminnelsesfunksjonalitet (enkel)
    setReminderBtn.addEventListener('click', () => {
        reminderTime = departureTimeEl.value;
        if (!reminderTime) {
            reminderStatusEl.textContent = "Vennligst angi et tidspunkt.";
            return;
        }
        saveDepartureTime();
        reminderStatusEl.textContent = `Påminnelse satt for ${reminderTime}. Du får varsel 30 og 10 min før.`;
        
        // Be om varslingstillatelse med en gang
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("VeskeVakten", { body: "Varsler er nå aktivert!" });
                }
            });
        }
        startReminderChecks();
    });

    function startReminderChecks() {
        if (reminderInterval) clearInterval(reminderInterval); // Stopp tidligere intervaller

        reminderInterval = setInterval(() => {
            if (!reminderTime || Notification.permission !== "granted") return;

            const now = new Date();
            const [hours, minutes] = reminderTime.split(':').map(Number);
            
            const departureDate = new Date();
            departureDate.setHours(hours, minutes, 0, 0);

            const diffMs = departureDate.getTime() - now.getTime();
            const diffMinutes = Math.round(diffMs / 60000);

            if (diffMinutes === 30 || diffMinutes === 10) {
                let itemsUnchecked = 0;
                if (currentMode && allLists[currentMode]) {
                    itemsUnchecked = allLists[currentMode].filter(item => !item.checked).length;
                }
                let bodyText = `Det er ${diffMinutes} minutter til avreise!`;
                if (itemsUnchecked > 0) {
                    bodyText += ` Du har ${itemsUnchecked} upakkede ting på "${currentMode}"-listen.`;
                } else if (currentMode) {
                    bodyText += ` Ser ut som alt på "${currentMode}"-listen er pakket. Bra jobba!`;
                }
                new Notification("VeskeVakten Påminnelse!", {
                    body: bodyText,
                    icon: "icon.png" // Du må lage et lite ikon her
                });
            }
            // Stopper intervallet hvis tiden har passert for å spare ressurser
            if (diffMinutes < 0) {
                clearInterval(reminderInterval);
                 reminderStatusEl.textContent = `Avreisetid (${reminderTime}) har passert. Sett ny tid for neste påminnelse.`;
            }

        }, 30000); // Sjekker hvert 30. sekund
    }

    // Initialiser appen
    loadLists();
    if (departureTimeEl.value) { // Hvis det er en lagret tid, start sjekker
        startReminderChecks();
        reminderStatusEl.textContent = `Påminnelse er aktiv for ${departureTimeEl.value}.`;
    }
    // Velg en standard modus ved oppstart, f.eks. Fritid, eller ingen.
    // selectMode('fritid'); // Kan kommenteres ut hvis man vil at brukeren MÅ velge først
});
