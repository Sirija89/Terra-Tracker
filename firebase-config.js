// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyDVso7bXYMQa85dFytOYaZNsYlF3Ns7xHE",
    authDomain: "soil-health-769e1.firebaseapp.com",
    databaseURL: "https://soil-health-769e1-default-rtdb.firebaseio.com",
    projectId: "soil-health-769e1",
    storageBucket: "soil-health-769e1.appspot.com",
    messagingSenderId: "960893514414",
    appId: "Y1:960893514414:web:0a68eb48d7fe2fc0d3f33f"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

let currentUserId = null;

// ================= AUTH CHECK =================
auth.onAuthStateChanged(user => {
    const url = window.location.href;
    const isLoginPage = url.includes("login.html");
    const isSignupPage = url.includes("signup.html");
    const isIndexPage = url.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/");

    if (user) {
        currentUserId = user.uid;
        console.log("✅ Logged in:", currentUserId);

        // Don't auto-redirect on login or signup pages so users can sign in to different accounts
        if (!isLoginPage && !isSignupPage && !isIndexPage) {
            loadUserProfile();
            startFirebaseListener();
        }
    } else {
        if (!isLoginPage && !isSignupPage && !isIndexPage) {
            window.location.href = "login.html";
        }
    }
});

// ================= LOAD USER PROFILE =================
function loadUserProfile() {
    database.ref("users/" + currentUserId + "/profile")
        .once("value")
        .then(snapshot => {
            const data = snapshot.val();
            if (!data) return;

            const el = document.getElementById("user-name");
            if (el) el.textContent = data.name;
        });
}

// ================= OPTIMAL RANGES =================
const OPTIMAL_RANGES = {
    soilTemperature: { min: 20, max: 35 },
    airTemperature: { min: 18, max: 38 },
    moisture: { min: 30, max: 65 },
    humidity: { min: 40, max: 75 },
    pH: { min: 6.0, max: 7.5 }
};

// ================= STATUS =================
function getStatus(fieldName, value) {
    const range = OPTIMAL_RANGES[fieldName];
    if (!range) return { text: "—", cssClass: "status-optimal" };

    if (value < range.min) return { text: "Low", cssClass: "status-low" };
    if (value > range.max) return { text: "High", cssClass: "status-low" };

    return { text: "Optimal", cssClass: "status-optimal" };
}

// ================= UPDATE CARD =================
function updateCard(valueId, statusId, fieldName, value, unit) {
    const valEl = document.getElementById(valueId);
    const statusEl = document.getElementById(statusId);

    if (valEl) valEl.textContent = value + unit;

    if (statusEl) {
        const status = getStatus(fieldName, value);
        statusEl.textContent = status.text;
        statusEl.className = "metric-status " + status.cssClass;
    }
}

// ================= MAIN LISTENER =================
function startFirebaseListener() {

    const locationId = localStorage.getItem("farmLocation") || "farm1";

    database.ref(`users/${currentUserId}/sensors/${locationId}/soilData`)
        .on("value", snapshot => {

            const data = snapshot.val();
            if (!data) return;

            const values = Object.values(data);
            const latest = values[values.length - 1];

            console.log("📡 Latest Data:", latest);

            updateCard("val-soil-temp", "status-soil-temp", "soilTemperature", latest.soilTemperature, "°C");
            updateCard("val-air-temp", "status-air-temp", "airTemperature", latest.airTemperature, "°C");
            updateCard("val-moisture", "status-moisture", "moisture", latest.moisture, "%");
            updateCard("val-humidity", "status-humidity", "humidity", latest.humidity, "%");
            updateCard("val-ph", "status-ph", "pH", latest.pH, "");

            updateChart(latest);
            checkAlerts(latest);
            updateRecommendation(latest);
        });
}

// ================= SAVE SENSOR DATA =================
function saveSensorData(data) {

    if (!currentUserId) return;

    const locationId = localStorage.getItem("farmLocation") || "farm1";

    database.ref(`users/${currentUserId}/sensors/${locationId}/soilData`)
        .push({
            ...data,
            timestamp: Date.now()
        });
}

// ================= ALERT SYSTEM =================
let lastAlertTime = 0;
const ALERT_COOLDOWN = 300000;

function checkAlerts(data) {

    if (Date.now() - lastAlertTime < ALERT_COOLDOWN) return;

    let msg = null;

    if (data.moisture < 15) msg = `⚠️ Soil too dry (${data.moisture}%)`;
    else if (data.pH < 5) msg = `⚠️ pH too low (${data.pH})`;
    else if (data.soilTemperature > 40) msg = `⚠️ Soil overheating (${data.soilTemperature}°C)`;

    if (msg) {
        alert(msg);
        lastAlertTime = Date.now();
    }
}

// ================= CHART =================
let sensorChart = null;

let historyData = {
    labels: [],
    soilTemp: [],
    moisture: [],
    pH: []
};

function updateChart(data) {

    const ctx = document.getElementById("sensor-chart");
    if (!ctx) return;

    const time = new Date().toLocaleTimeString();

    historyData.labels.push(time);
    historyData.soilTemp.push(data.soilTemperature);
    historyData.moisture.push(data.moisture);
    historyData.pH.push(data.pH);

    if (historyData.labels.length > 20) {
        historyData.labels.shift();
        historyData.soilTemp.shift();
        historyData.moisture.shift();
        historyData.pH.shift();
    }

    if (!sensorChart) {
        sensorChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: historyData.labels,
                datasets: [
                    { label: "Soil Temp", data: historyData.soilTemp },
                    { label: "Moisture", data: historyData.moisture },
                    { label: "pH", data: historyData.pH }
                ]
            }
        });
    } else {
        sensorChart.data.labels = historyData.labels;
        sensorChart.data.datasets[0].data = historyData.soilTemp;
        sensorChart.data.datasets[1].data = historyData.moisture;
        sensorChart.data.datasets[2].data = historyData.pH;
        sensorChart.update();
    }
}

// ================= AI RECOMMENDATION =================
async function updateRecommendation(data) {

    const el = document.getElementById("rec-text");
    if (!el) return;

    el.innerHTML = "🤖 Analyzing soil data...";

    try {
        const response = await fetch("YOUR_BACKEND_API");
        const result = await response.json();

        el.innerHTML = result.text;

    } catch (error) {
        el.innerHTML = "⚠️ AI recommendation unavailable";
    }
}

// ================= TEST DATA (REMOVE LATER) =================
setInterval(() => {
    saveSensorData({
        soilTemperature: (Math.random() * 10 + 25).toFixed(1),
        airTemperature: (Math.random() * 10 + 25).toFixed(1),
        moisture: Math.floor(Math.random() * 60),
        humidity: Math.floor(Math.random() * 80),
        pH: (Math.random() * 2 + 5).toFixed(1)
    });
}, 5000);