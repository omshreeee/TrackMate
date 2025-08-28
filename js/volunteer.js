// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, ref, onValue, push, get, child, set, remove } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBSGGsPeIS2Lc3YOpZZDHJIdy4CHuRSgJw",
    authDomain: "trackmate-6d04e.firebaseapp.com",
    databaseURL: "https://trackmate-6d04e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "trackmate-6d04e",
    storageBucket: "trackmate-6d04e.firebasestorage.app",
    messagingSenderId: "940899061665",
    appId: "1:940899061665:web:61910e5951173352b5c5e0"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize the map
const map = L.map('map').setView([12.9716, 77.5946], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);



// Fetch victim locations from Firebase
const victimLocRef = ref(database, 'victimLoc');
onValue(victimLocRef, (snapshot) => {
    const victimData = snapshot.val();
    if (victimData) {
        Object.keys(victimData).forEach((key) => {
            const victim = victimData[key];
            const latitude = victim.latitude;
            const longitude = victim.longitude;

            // Create a coloured marker for each victim
            createMarkerWithKey(latitude, longitude, key, 'victim');
        });
    }
});

// Fetch food locations from Firebase
const foodLocRef = ref(database, 'foodLoc');
onValue(foodLocRef, (snapshot) => {
    const foodData = snapshot.val();
    if (foodData) {
        Object.keys(foodData).forEach((key) => {
            const food = foodData[key];
            const latitude = food.latitude;
            const longitude = food.longitude;

            // Create a coloured marker for each food location
            createMarkerWithKey(latitude, longitude, key, 'food');
        });
    }
});



// Fetch shelter locations from Firebase
const shelterLocRef = ref(database, 'shelterLoc');
onValue(shelterLocRef, (snapshot) => {
    const shelterData = snapshot.val();
    if (shelterData) {
        Object.keys(shelterData).forEach((key) => {
            const shelter = shelterData[key];
            const latitude = shelter.latitude;
            const longitude = shelter.longitude;

            // Create a coloured marker for each shelter location
            createMarkerWithKey(latitude, longitude, key, 'shelter');
        });
    }
});


// Fetch medical locations from Firebase
const medicalLocRef = ref(database, 'medicalLoc');
onValue(medicalLocRef, (snapshot) => {
    const medicalData = snapshot.val();
    if (medicalData) {
        Object.keys(medicalData).forEach((key) => {
            const medical = medicalData[key];
            const latitude = medical.latitude;
            const longitude = medical.longitude;

            // Create a coloured marker for each victim
            createMarkerWithKey(latitude, longitude, key, 'medical');
        });
    }
});


// Variables
let removeMode = false;
let tempMarker =null;


function cancelAddLocation() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('backdrop').style.display = 'none';

    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    map.off('click'); // Disable map click listener
}

// Attach the function to the global scope
window.cancelAddLocation = cancelAddLocation;

// Open the add location modal
function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
    document.getElementById('backdrop').style.display = 'block';

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = L.marker([lat, lng]).addTo(map);
    });
}

// Attach to the global scope
window.openAddModal = openAddModal;



// Close the add location modal
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('backdrop').style.display = 'none';

    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = null;
    map.off('click'); // Disable map click listener
}

// Expose the function to the global scope
window.closeAddModal = closeAddModal;


// Push data to Firebase with category-specific logic
function pushToFirebase(lat, lng, categories) {
    categories.forEach((category) => {
        // Determine the database path based on the category
        let dbPath = '';
        switch (category.toLowerCase()) {
            case 'victim':
                dbPath = 'victimLoc';
                break;
            case 'food':
                dbPath = 'foodLoc';
                break;
            case 'shelter':
                dbPath = 'shelterLoc';
                break;
            case 'medical':
                dbPath = 'medicalLoc';
                break;
            default:
                console.error('Unknown category:', category);
                return;
        }

        const dbRef = ref(database);
        const categoryRef = child(dbRef, dbPath);

        // Check if the database path exists
        get(categoryRef)
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    console.log(`${dbPath} does not exist. Creating it now.`);
                    set(categoryRef, {}); // Create an empty object at the path
                }

                // Push the location data
                push(categoryRef, {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                })
                    .then((newRef) => {
                        console.log(`Location successfully added to ${dbPath}`);
                        // Create the marker after successful push
                        createMarkerWithKey(lat, lng, newRef.key, category);
                    })
                    .catch((error) => {
                        console.error(`Error adding location to ${dbPath}:`, error);
                    });
            })
            .catch((error) => {
                console.error(`Error checking ${dbPath}:`, error);
            });
    });
}

// Submit the add location form
document.getElementById('addLocationForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    const categories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map(input => input.value);

    if (lat && lng && categories.length) {
        pushToFirebase(lat, lng, categories);
        alert('Location added successfully!');
        closeAddModal();
    } else {
        alert('Please fill all fields and select at least one category.');
    }
});


// Start remove mode
function startRemoveMode() {
    removeMode = true;
    alert('Click on a marker to remove it.');

    // Add a click listener to the map
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            layer.on('click', (e) => {
                if (!removeMode) return;

                // Prompt for confirmation
                const code = prompt('Enter the year of independence to confirm deletion:');
                if (code === '1947') {
                    // Remove marker from map
                    map.removeLayer(layer);

                    // Remove marker data from Firebase
                    if (layer.firebaseKey && layer.category) {
                        let dbPath = '';

                        // Determine the Firebase database path based on the marker's category
                        switch (layer.category) {
                            case 'victim':
                                dbPath = `victimLoc/${layer.firebaseKey}`;
                                break;
                            case 'food':
                                dbPath = `foodLoc/${layer.firebaseKey}`;
                                break;
                            case 'shelter':
                                dbPath = `shelterLoc/${layer.firebaseKey}`;
                                break;
                            case 'medical':
                                dbPath = `medicalLoc/${layer.firebaseKey}`;
                                break;
                            default:
                                alert('Unknown marker category.');
                                return;
                        }

                        const dbRef = ref(database, dbPath);
                        remove(dbRef)
                            .catch((error) => {
                                alert('Error removing marker from Firebase: ' + error.message);
                            });
                    } else {
                        alert('Marker has no Firebase key or category.');
                    }

                    // End remove mode
                    removeMode = false;
                } else {
                    alert('Invalid code. Deletion canceled.');
                }
            });
        }
    });
}


// Function to remove a marker and delete its data from Firebase
function removeMarker(key, category) {
    const dbRef = child(databaseRefs[category], key);
    const markerToRemove = markers.find((marker) => marker.firebaseKey === key);

    if (markerToRemove) {
        map.removeLayer(markerToRemove); // Remove marker from the map
        markers = markers.filter((marker) => marker.firebaseKey !== key); // Update marker list

        // Remove marker data from Firebase
        remove(dbRef)
            .catch((error) => {
                alert('Error removing marker from Firebase: ' + error.message);
            });
    } else {
        alert('Marker not found.');
    }
}

// Event listener to load all markers when the page is reloaded
document.addEventListener('DOMContentLoaded', () => {
    loadAllMarkers();
});




// Attach the function to the global scope
window.startRemoveMode = startRemoveMode;

// Attach the function to the global scope
window.startRemoveMode = startRemoveMode;


// Initialize a global array to track markers
let markers = []; // This must be defined before using it

// Function to filter markers by category
function filterSelection(category) {
    // Clear all existing markers from the map
    markers.forEach((marker) => map.removeLayer(marker));
    markers = []; // Reset the markers array

    if (category === 'all') {
        loadAllMarkers(); // Load all markers
    } else {
        // Load markers for the selected category only
        loadMarkers(category);
    }
}

// Attach event listeners to buttons
function setupFilterButtons() {
    document.querySelector('.btnAll').addEventListener('click', () => filterSelection('all'));
    document.querySelector('.btnvictim').addEventListener('click', () => filterSelection('victim'));
    document.querySelector('.btnfood').addEventListener('click', () => filterSelection('food'));
    document.querySelector('.btnshelter').addEventListener('click', () => filterSelection('shelter'));
    document.querySelector('.btnmedical').addEventListener('click', () => filterSelection('medical'));
}

// Call this function on page load to set up event listeners
setupFilterButtons();



// Function to load all markers
function loadAllMarkers() {
    loadMarkers('victim');
    loadMarkers('food');
    loadMarkers('shelter');
    loadMarkers('medical');
}

// Function to load markers based on a specific category
function loadMarkers(category) {
    let dbPath = '';
    switch (category) {
        case 'victim':
            dbPath = 'victimLoc';
            break;
        case 'food':
            dbPath = 'foodLoc';
            break;
        case 'shelter':
            dbPath = 'shelterLoc';
            break;
        case 'medical':
            dbPath = 'medicalLoc';
            break;
        default:
            console.error('Unknown category:', category);
            return;
    }

    // Fetch data from Firebase
    const dbRef = ref(database, dbPath);
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach((key) => {
                const location = data[key];
                const latitude = location.latitude;
                const longitude = location.longitude;

                // Create a marker with the appropriate color based on the category
                const marker = createMarkerWithKey(latitude, longitude, key, category);

                // Add the marker to the global markers array
                markers.push(marker);
            });
        }
    });
}


// Load all markers when the page loads
loadAllMarkers();


// Function to create markers and associate them with Firebase keys
function createMarkerWithKey(lat, lng, key, category) {
    let markerColor;

    // Determine the marker color based on the category
    switch (category.toLowerCase()) {
        case 'victim':
            markerColor = 'green';
            break;
        case 'food':
            markerColor = 'yellow';
            break;
        case 'shelter':
            markerColor = 'red';
            break;
        case 'medical':
            markerColor = 'blue';
            break;
        default:
            console.error('Unknown category:', category);
            return;
    }

    const marker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: `images/marker-${markerColor}.png`,
            shadowUrl: 'images/marker-shadow.png',
            iconSize: [50, 82],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [82, 82],
        }),
    });

    // Associate Firebase key and category with the marker
    marker.firebaseKey = key;
    marker.category = category;

    // Add the marker to the map
    marker.addTo(map);

    // Add a popup to the marker
    marker.bindPopup(`
        <b>Category:</b> ${category}<br>
        <b>Latitude:</b> ${lat}<br>
        <b>Longitude:</b> ${lng}<br>
    `);

    // Track the marker globally
    markers.push(marker);

    return marker;
}


// Function to handle reload intervals
document.getElementById('reload-interval').addEventListener('change', (e) => {
    const interval = parseInt(e.target.value, 10);

    if (interval && !isNaN(interval)) {
        setInterval(() => {
            fetchAndAddMarkers();
        }, interval * 60 * 1000); // Convert minutes to milliseconds
    }
});


//----------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------EXTRA INFO ADDED----------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------

//Location not getting saved, grey marker not appearing to choose location. trackmate gmail chatgpt.

/* Ensure a category is selected before calling closeAddModal and show a submit button
function validateCategoryAndShowSubmitButton() {
    const categoriesSelected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.id = 'submit-button';
    submitButton.style.marginLeft = '10px';
    submitButton.onclick = handleSubmit;

    const medicalButton = document.querySelector('.btnmedical');
    
    if (categoriesSelected.length > 0) {
        closeAddModal();
        if (!document.getElementById('submit-button')) {
            medicalButton.parentNode.insertBefore(submitButton, medicalButton.nextSibling);
        }
    } else {
        alert('Please select at least one category before proceeding.');
    }
}

document.querySelector('.choose-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    validateCategoryAndShowSubmitButton();
});

// Function to let users select a location on the map
function chooseLocationOnMap() {
    alert('Click on the map to choose a location.');
    map.on('click', (event) => {
        const { lat, lng } = event.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        // Remove existing marker if any
        if (tempMarker) map.removeLayer(tempMarker);

        // Add a new marker
        tempMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'images/marker-grey.png',
                shadowUrl: 'images/marker-shadow.png',
                iconSize: [50, 82],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [82, 82],
            })
        }).addTo(map);
    });
}

window.chooseLocationOnMap = chooseLocationOnMap;*/
/*
// Ensure at least one category is selected before closing the modal and show the "Done" button
function validateCategoryAndShowDoneButton() {
    const categoriesSelected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const doneButton = document.createElement('button');
    doneButton.textContent = 'Done';
    doneButton.id = 'done-button';
    doneButton.style.marginLeft = '10px';
    
    const medicalButton = document.querySelector('.btnmedical');

    if (categoriesSelected.length > 0) {
        closeAddModal();

        // Add "Done" button next to the "Medical" button if it doesn't exist
        if (!document.getElementById('done-button')) {
            medicalButton.parentNode.insertBefore(doneButton, medicalButton.nextSibling);
        }
    } else {
        alert('Please select at least one category before proceeding.');
    }

    // Attach event listener for "Done" button to save location and remove marker
    doneButton.addEventListener('click', handleDoneButtonClick);
}

document.querySelector('.choose-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    validateCategoryAndShowDoneButton();
});

// Function to let users select a location on the map
function chooseLocationOnMap() {
    alert('Click on the map to choose a location.');

    map.on('click', (event) => {
        const { lat, lng } = event.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        // Remove existing temporary marker if any
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        // Add a new temporary grey marker
        tempMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'images/marker-grey.png',
                shadowUrl: 'images/marker-shadow.png',
                iconSize: [50, 82],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [82, 82],
            }),
        }).addTo(map);
    });
}

window.chooseLocationOnMap = chooseLocationOnMap;

// Ensure at least one category is selected before closing the modal and show the "Done" button
function validateCategoryAndShowDoneButton() {
    const categoriesSelected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const doneButton = document.createElement('button');
    doneButton.textContent = 'Done';
    doneButton.id = 'done-button';
    doneButton.style.marginLeft = '10px';
    
    const medicalButton = document.querySelector('.btnmedical');

    if (categoriesSelected.length > 0) {
        closeAddModal();

        // Add "Done" button next to the "Medical" button if it doesn't exist
        if (!document.getElementById('done-button')) {
            medicalButton.parentNode.insertBefore(doneButton, medicalButton.nextSibling);
        }
    } else {
        alert('Please select at least one category before proceeding.');
    }

    // Attach event listener for "Done" button to save location and remove marker
    doneButton.addEventListener('click', handleDoneButtonClick);
}

document.querySelector('.choose-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    chooseLocationOnMap();
    validateCategoryAndShowDoneButton();
});

// Function to let users select a location on the map
function chooseLocationOnMap() {
    //alert('Click on the map to choose a location.');

    // Enable click event on map to select location
    map.once('click', (event) => {
        const { lat, lng } = event.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        // Remove existing temporary marker if any
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        // Add a new temporary grey marker
        tempMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'images/marker-grey.png',
                shadowUrl: 'images/marker-shadow.png',
                iconSize: [50, 82],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [82, 82],
            }),
        }).addTo(map);
    });
}

window.chooseLocationOnMap = chooseLocationOnMap;

/* Handle submit button click to save data to Firebase
function handleSubmit() {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const selectedCategories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map(input => input.value);

    if (latitude && longitude && selectedCategories.length > 0) {
        selectedCategories.forEach(category => {
            let dbPath = '';
            switch (category.toLowerCase()) {
                case 'victim':
                    dbPath = 'victimLoc';
                    break;
                case 'food':
                    dbPath = 'foodLoc';
                    break;
                case 'shelter':
                    dbPath = 'shelterLoc';
                    break;
                case 'medical':
                    dbPath = 'medicalLoc';
                    break;
                default:
                    console.error('Unknown category:', category);
                    return;
            }

            const dbRef = ref(database);
            const categoryRef = child(dbRef, dbPath);

            push(categoryRef, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            }).then(() => {
                console.log(`Location added to ${dbPath}`);
            }).catch(error => {
                console.error('Error adding location:', error);
            });
        });

        alert('Location added successfully!');

        // Remove the submit button
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.remove();
        }

        // Clear inputs
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);

    } else {
        alert('Please ensure all fields are filled and at least one category is selected.');
    }
}

// Function to handle "Done" button click, save data to Firebase, and remove grey marker
function handleDoneButtonClick() {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const selectedCategories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (latitude && longitude && selectedCategories.length > 0) {
        selectedCategories.forEach((category) => {
            let dbPath = '';

            // Determine Firebase path based on category
            switch (category.toLowerCase()) {
                case 'victim':
                    dbPath = 'victimLoc';
                    break;
                case 'food':
                    dbPath = 'foodLoc';
                    break;
                case 'shelter':
                    dbPath = 'shelterLoc';
                    break;
                case 'medical':
                    dbPath = 'medicalLoc';
                    break;
                default:
                    console.error('Unknown category:', category);
                    return;
            }

            const dbRef = ref(database);
            const categoryRef = child(dbRef, dbPath);

            // Save location to Firebase
            push(categoryRef, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            })
                .then(() => {
                    console.log(`Location added to ${dbPath}`);
                })
                .catch((error) => {
                    console.error('Error adding location:', error);
                });
        });

        alert('Location added successfully!');

        // Remove the "Done" button and grey marker
        const doneButton = document.getElementById('done-button');
        if (doneButton) {
            doneButton.remove();
        }

        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }

        // Clear input fields
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => (checkbox.checked = false));
    } else {
        alert('Please ensure all fields are filled and at least one category is selected.');
    }
}
// Function to handle "Done" button click, save data to Firebase, and remove grey marker
function handleDoneButtonClick() {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const selectedCategories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (latitude && longitude && selectedCategories.length > 0) {
        selectedCategories.forEach((category) => {
            let dbPath = '';

            // Determine Firebase path based on category
            switch (category.toLowerCase()) {
                case 'victim':
                    dbPath = 'victimLoc';
                    break;
                case 'food':
                    dbPath = 'foodLoc';
                    break;
                case 'shelter':
                    dbPath = 'shelterLoc';
                    break;
                case 'medical':
                    dbPath = 'medicalLoc';
                    break;
                default:
                    console.error('Unknown category:', category);
                    return;
            }

            const dbRef = ref(database);
            const categoryRef = child(dbRef, dbPath);

            // Save location to Firebase
            push(categoryRef, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            })
                .then(() => {
                    console.log(`Location added to ${dbPath}`);
                })
                .catch((error) => {
                    console.error('Error adding location:', error);
                });
        });

        alert('Location added successfully!');

        // Remove the "Done" button and grey marker
        const doneButton = document.getElementById('done-button');
        if (doneButton) {
            doneButton.remove();
        }

        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }

        // Clear input fields
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => (checkbox.checked = false));
    } else {
        alert('Please ensure all fields are filled and at least one category is selected.');
    }
}*/
/*

// Ensure at least one category is selected before closing the modal and show the "Done" button
function validateCategoryAndShowDoneButton() {
    const categoriesSelected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const medicalButton = document.querySelector('.btnmedical');

    if (categoriesSelected.length > 0) {
        closeAddModal();

        // Add "Done" button next to the "Medical" button if it doesn't exist
        if (!document.getElementById('done-button')) {
            const doneButton = document.createElement('button');
            doneButton.textContent = 'Done';
            doneButton.id = 'done-button';
            doneButton.style.marginLeft = '10px';
            medicalButton.parentNode.insertBefore(doneButton, medicalButton.nextSibling);

            // Attach event listener for "Done" button to save location and remove marker
            doneButton.addEventListener('click', handleDoneButtonClick);
        }
    } else {
        alert('Please select at least one category before proceeding.');
    }
}

document.querySelector('.choose-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    chooseLocationOnMap();
    validateCategoryAndShowDoneButton();
});

// Function to let users select a location on the map
function chooseLocationOnMap() {
    alert('Click on the map to choose a location.');

    // Enable click event on map to select location
    map.once('click', (event) => {
        const { lat, lng } = event.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        // Remove existing temporary marker if any
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        // Add a new temporary grey marker
        tempMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'images/marker-grey.png',
                shadowUrl: 'images/marker-shadow.png',
                iconSize: [50, 82],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [82, 82],
            }),
        }).addTo(map);
    });
}

window.chooseLocationOnMap = chooseLocationOnMap;

// Function to handle "Done" button click, save data to Firebase, and remove grey marker
function handleDoneButtonClick() {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const selectedCategories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (latitude && longitude && selectedCategories.length > 0) {
        selectedCategories.forEach((category) => {
            let dbPath = '';

            // Determine Firebase path based on category
            switch (category.toLowerCase()) {
                case 'victim':
                    dbPath = 'victimLoc';
                    break;
                case 'food':
                    dbPath = 'foodLoc';
                    break;
                case 'shelter':
                    dbPath = 'shelterLoc';
                    break;
                case 'medical':
                    dbPath = 'medicalLoc';
                    break;
                default:
                    console.error('Unknown category:', category);
                    return;
            }

            const dbRef = ref(database);
            const categoryRef = child(dbRef, dbPath);

            // Save location to Firebase
            push(categoryRef, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            })
                .then(() => {
                    console.log(`Location added to ${dbPath}`);
                })
                .catch((error) => {
                    console.error('Error adding location:', error);
                });
        });

        alert('Location added successfully!');

        // Remove the "Done" button and grey marker
        const doneButton = document.getElementById('done-button');
        if (doneButton) {
            doneButton.remove();
        }

        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }

        // Clear input fields
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => (checkbox.checked = false));
    } else {
        alert('Please ensure all fields are filled and at least one category is selected.');
    }
}
*/

// Ensure at least one category is selected before closing the modal and show the "Done" button
function validateCategoryAndShowDoneButton() {
    const categoriesSelected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const medicalButton = document.querySelector('.btnmedical');

    if (categoriesSelected.length > 0) {
        closeAddModal();

        // Add "Done" button next to the "Medical" button if it doesn't exist
        if (!document.getElementById('done-button')) {
            const doneButton = document.createElement('button');
            doneButton.textContent = 'Done';
            doneButton.id = 'done-button';
            doneButton.style.marginLeft = '10px';
            medicalButton.parentNode.insertBefore(doneButton, medicalButton.nextSibling);

            // Attach event listener for "Done" button to save location and remove marker
            doneButton.addEventListener('click', handleDoneButtonClick);
        }
    } else {
        alert('Please select at least one category before proceeding.');
    }
}

document.querySelector('.choose-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    chooseLocationOnMap();
    validateCategoryAndShowDoneButton();
});

// Function to let users select a location on the map
function chooseLocationOnMap() {
    alert('Click on the map to choose a location.');

    map.on('click', function(e) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        const { lat, lng } = e.latlng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);

        // Add a new temporary grey marker
        tempMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'images/marker-grey.png',
                shadowUrl: 'images/marker-shadow.png',
                iconSize: [50, 82],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [82, 82],
            }),
        }).addTo(map);
    });
}

window.chooseLocationOnMap = chooseLocationOnMap;

// Function to handle "Done" button click, save data to Firebase, and remove grey marker
function handleDoneButtonClick() {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const selectedCategories = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (latitude && longitude && selectedCategories.length > 0) {
        selectedCategories.forEach((category) => {
            let dbPath = '';

            // Determine Firebase path based on category
            switch (category.toLowerCase()) {
                case 'victim':
                    dbPath = 'victimLoc';
                    break;
                case 'food':
                    dbPath = 'foodLoc';
                    break;
                case 'shelter':
                    dbPath = 'shelterLoc';
                    break;
                case 'medical':
                    dbPath = 'medicalLoc';
                    break;
                default:
                    console.error('Unknown category:', category);
                    return;
            }

            const dbRef = ref(database);
            const categoryRef = child(dbRef, dbPath);

            // Save location to Firebase
            push(categoryRef, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            })
                .then(() => {
                    console.log(`Location added to ${dbPath}`);
                })
                .catch((error) => {
                    console.error('Error adding location:', error);
                });
        });

        alert('Location added successfully!');

        // Remove the "Done" button and grey marker
        const doneButton = document.getElementById('done-button');
        if (doneButton) {
            doneButton.remove();
        }

        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }

        // Clear input fields
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => (checkbox.checked = false));
    } else {
        alert('Please ensure all fields are filled and at least one category is selected.');
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------EXTRA INFO ADDED----------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------


window.openAddModal = openAddModal;
window.cancelAddLocation = cancelAddLocation;
window.startRemoveMode = startRemoveMode;