let latestReport = null;
let scanHistory = [];

// =====================================================
// PAGE NAVIGATION
// =====================================================
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active-section');
    });

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active-section');

    document.querySelectorAll('.nav-item').forEach(button => {
        button.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.nav-item');
    const pageMap = {
        dashboard: 0,
        newScan: 1,
        findings: 2,
        endpoints: 3,
        reports: 4,
        settings: 5
    };

    if (pageMap[sectionId] !== undefined && buttons[pageMap[sectionId]]) {
        buttons[pageMap[sectionId]].classList.add('active');
    }

    const titles = {
        dashboard: ['Security Dashboard', 'Automated API security assessment'],
        newScan: ['New API Scan', 'Start a new API security assessment'],
        findings: ['Security Findings', 'Review detected security issues'],
        endpoints: ['API Endpoints', 'Review tested API endpoints'],
        reports: ['Security Reports', 'Review previous API security scans'],
        settings: ['Settings', 'Configure scanner preferences']
    };

    if (titles[sectionId]) {
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        if (pageTitle) pageTitle.textContent = titles[sectionId][0];
        if (pageSubtitle) pageSubtitle.textContent = titles[sectionId][1];
    }

    // Refresh data when opening data pages.
    if (['dashboard', 'findings', 'endpoints', 'reports'].includes(sectionId)) {
        loadHistory();
    }

    if (sectionId === 'newScan') hideError();
}

// =====================================================
// API SCAN
// =====================================================

async function scanAPI(scanUrl = null,fromNewScan=false) {

    // =================================================
    // DETERMINE WHICH URL TO SCAN
    // =================================================

    let url;


    // New Scan page sends its URL directly
    if (scanUrl) {

        url = scanUrl.trim();

    }

    // Dashboard uses dashboardapiUrl
    else {

        const dashboardUrl =
            document.getElementById(
                "dashboardapiUrl"
            );


        url =
            dashboardUrl
                ? dashboardUrl.value.trim()
                : "";

    }


    // =================================================
    // VALIDATE URL
    // =================================================

    if (!url) {

        showError(
            "Please enter an API endpoint URL."
        );

        return;
    }


    // =================================================
    // AUTHENTICATION
    // =================================================

    let authentication = {
        type: "none"
    };


    // Authentication is only needed
    // when scanning from New Scan page.

    if (scanUrl) {

        const authenticationSelect =
            document.getElementById(
                "authentication"
            );


        const authenticationType =
            authenticationSelect
                ? authenticationSelect.value
                : "none";


        // ---------------------------------------------
        // Bearer Token
        // ---------------------------------------------

        if (
            authenticationType === "bearer"
        ) {

            const tokenElement =
                document.getElementById(
                    "bearerToken"
                );


            const token =
                tokenElement
                    ? tokenElement.value.trim()
                    : "";


            if (!token) {

                alert(
                    "Please enter the bearer token."
                );

                return;
            }


            authentication = {

                type: "bearer",

                token: token

            };

        }


        // ---------------------------------------------
        // API Key
        // ---------------------------------------------

        else if (
            authenticationType === "api_key"
        ) {

            const apiKeyElement =
                document.getElementById(
                    "apiKey"
                );


            const apiKey =
                apiKeyElement
                    ? apiKeyElement.value.trim()
                    : "";


            if (!apiKey) {

                alert(
                    "Please enter the API key."
                );

                return;
            }


            authentication = {

                type: "api_key",

                key: apiKey

            };

        }

    }


    // =================================================
    // BUTTON / LOADING
    // =================================================

    const scanButton =
        document.getElementById(
            "scanButton"
        );


    const loading =
        document.getElementById(
            "loadingBox"
        );


    hideError();


    if (scanButton) {

        scanButton.disabled = true;

        scanButton.innerHTML =
            "⟳ Scanning...";

    }


    if (loading) {

        loading.style.display =
            "flex";

    }


    // =================================================
    // SEND REQUEST
    // =================================================

    try {

        const settings =
            typeof getSettings === "function"
                ? getSettings()
                : {};


        const response =
            await fetch(
                "/scan",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        url: url,

                        authentication:
                            authentication,

                        settings:
                            settings

                    })

                }
            );


        // =================================================
        // READ RESPONSE
        // =================================================

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Scan failed."
            );

        }

latestReport =
    data.security_report;

await loadHistory();


// ================================================
// RESULT LOCATION
// ================================================

if (fromNewScan) {

    // New Scan → Reports page

    showSection("reports");

} else {

    // Dashboard Scan → Dashboard

    displayReport(
        latestReport
    );

    showSection("dashboard");
}
        console.log(
            "API scan completed:",
            url
        );

    }


    catch (error) {

        console.error(
            "Scan error:",
            error
        );


        showError(
            error.message ||
            "An error occurred while scanning."
        );

    }


    finally {

        if (scanButton) {

            scanButton.disabled =
                false;

            scanButton.innerHTML =
                "▶ &nbsp; Scan API";

        }


        if (loading) {

            loading.style.display =
                "none";

        }

    }

}
// =====================================================
// DISPLAY CURRENT REPORT
// =====================================================
function displayReport(report) {
    if (!report) return;

    latestReport = report;
    const summary = report.summary || {};
    const high = Number(summary.High || 0);
    const medium = Number(summary.Medium || 0);
    const low = Number(summary.Low || 0);
    const info = Number(summary.Informational || 0);

    const highCount = document.getElementById('highCount');
    const mediumCount = document.getElementById('mediumCount');
    const lowCount = document.getElementById('lowCount');
    const infoCount = document.getElementById('infoCount');

    if (highCount) highCount.textContent = high;
    if (mediumCount) mediumCount.textContent = medium;
    if (lowCount) lowCount.textContent = low;
    if (infoCount) infoCount.textContent = info;

    const statusCode = document.getElementById('statusCode');
    if (statusCode) {
        statusCode.textContent = report.status_code ?? '-';
    }

    const responseTime = document.getElementById('responseTime');
    if (responseTime) {
        responseTime.textContent =
            report.response_time !== undefined && report.response_time !== null
                ? report.response_time + ' seconds'
                : '-';
    }

    const findings = Array.isArray(report.findings) ? report.findings : [];
    displayFindings(findings);
    displayAllFindings(findings);
    updateDonut(high, medium, low, info);
    updateEndpoints(report);
}

// =====================================================
// REPORT HISTORY
// =====================================================
function displayReports() {
    const table = document.getElementById('reportsTable');
    if (!table) return;

    table.innerHTML = '';

    if (!scanHistory.length) {
        table.innerHTML = `
            <tr><td colspan="7" class="empty">No scan reports available.</td></tr>
        `;
        return;
    }

    scanHistory.forEach(item => {
        const report = item.report || {};
        const summary = report.summary || {};
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(report.scan_id || '-')}</td>
            <td>${escapeHtml(report.timestamp || '-')}</td>
            <td>${escapeHtml(report.target || '-')}</td>
            <td><strong>${escapeHtml(String(report.status_code || '-'))}</strong></td>
            <td>${summary.High || 0}</td>
            <td>${summary.Medium || 0}</td>
            <td>
                <button class="report-action view" onclick="viewReport('${escapeJs(item.filename)}')">View</button>
                <button class="report-action delete" onclick="deleteReport('${escapeJs(item.filename)}')">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });
}


function displayDashboardHistory() {
    const table = document.getElementById("dashboardHistoryTable");
    const total = document.getElementById("dashboardHistoryTotal");

    if (!table) return;

    const reports = Array.isArray(scanHistory) ? scanHistory : [];

    if (total) {
        total.textContent = `${reports.length} scans`;
    }

    if (reports.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No scan history available.
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = "";

    reports.slice(0, 5).forEach(item => {
        const report = item.report || {};
        const summary = report.summary || {};
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(report.scan_id || "-")}</td>
            <td>${escapeHtml(report.timestamp || "-")}</td>
            <td>${escapeHtml(report.target || "-")}</td>
            <td>${escapeHtml(String(report.status_code ?? "-"))}</td>
            <td>${Number(summary.High) || 0}</td>
            <td>${Number(summary.Medium) || 0}</td>
        `;

        table.appendChild(row);
    });
}

// =====================================================
// FINDINGS
// =====================================================
function displayFindings(findings) {
    const table = document.getElementById('findingsTable');
    if (!table) return;

    table.innerHTML = '';

    if (!Array.isArray(findings) || !findings.length) {
        table.innerHTML = `
            <tr><td colspan="3" class="empty">No security findings detected.</td></tr>
        `;
        return;
    }

    findings.slice(0, 8).forEach(finding => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="severity-badge ${getSeverityClass(finding.severity)}">
                    ${escapeHtml(finding.severity || 'Informational')}
                </span>
            </td>
            <td><strong>${escapeHtml(finding.name || 'Security Check')}</strong></td>
            <td>${escapeHtml(finding.message || '')}</td>
        `;
        table.appendChild(row);
    });
}

function displayAllFindings(findings) {
    const table = document.getElementById('allFindingsTable');
    if (!table) return;

    table.innerHTML = '';

    if (!Array.isArray(findings) || !findings.length) {
        table.innerHTML = `
            <tr><td colspan="4" class="empty">No findings available.</td></tr>
        `;
        return;
    }

    findings.forEach(finding => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="severity-badge ${getSeverityClass(finding.severity)}">
                    ${escapeHtml(finding.severity || 'Informational')}
                </span>
            </td>
            <td>${escapeHtml(finding.category || '')}</td>
            <td>${escapeHtml(finding.name || '')}</td>
            <td>${escapeHtml(finding.message || '')}</td>
        `;
        table.appendChild(row);
    });
}

// =====================================================
// FINDINGS
// =====================================================
function displayFindings(findings) {
    const table = document.getElementById('findingsTable');
    const totalElement = document.getElementById('findingTotal');

    // Ensure findings is a valid array
    const validFindings = Array.isArray(findings) ? findings : [];
    const total = validFindings.length;

    // Update the total beside the Security Findings heading
    if (totalElement) {
        totalElement.textContent = `${total} total`;
    }

    if (!table) return;

    table.innerHTML = '';

    // Display message when no findings exist
    if (total === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="3" class="empty">
                    No security findings detected.
                </td>
            </tr>
        `;
        return;
    }

    // Display a maximum of 8 findings in the dashboard table
    validFindings.slice(0, 8).forEach(finding => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <span class="severity-badge ${getSeverityClass(finding.severity)}">
                    ${escapeHtml(finding.severity || 'Informational')}
                </span>
            </td>
            <td>
                <strong>${escapeHtml(finding.name || 'Security Check')}</strong>
            </td>
            <td>${escapeHtml(finding.message || '')}</td>
        `;

        table.appendChild(row);
    });
}

// =====================================================
// ALL FINDINGS
// =====================================================
function displayAllFindings(findings) {
    const table = document.getElementById('allFindingsTable');
    if (!table) return;

    table.innerHTML = '';

    if (!Array.isArray(findings) || findings.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4" class="empty">No findings available.</td>
            </tr>
        `;
        return;
    }

    findings.forEach(finding => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <span class="severity-badge ${getSeverityClass(finding.severity)}">
                    ${escapeHtml(finding.severity || 'Informational')}
                </span>
            </td>
            <td>${escapeHtml(finding.category || '')}</td>
            <td>${escapeHtml(finding.name || '')}</td>
            <td>${escapeHtml(finding.message || '')}</td>
        `;

        table.appendChild(row);
    });
}

// =====================================================
// DONUT CHART
// =====================================================
function updateDonut(high, medium, low, info) {
    const donut = document.getElementById('severityDonut');
    const totalElement = document.getElementById('totalFindingNumber');
    const legendHigh = document.getElementById('legendHigh');
    const legendMedium = document.getElementById('legendMedium');
    const legendLow = document.getElementById('legendLow');
    const legendInfo = document.getElementById('legendInfo');

    high = Number(high) || 0;
    medium = Number(medium) || 0;
    low = Number(low) || 0;
    info = Number(info) || 0;

    const total = high + medium + low + info;

    if (totalElement) totalElement.textContent = total;
    if (legendHigh) legendHigh.textContent = high;
    if (legendMedium) legendMedium.textContent = medium;
    if (legendLow) legendLow.textContent = low;
    if (legendInfo) legendInfo.textContent = info;

    if (!donut) return;

    if (total === 0) {
        donut.style.background = 'conic-gradient(#293653 0deg 360deg)';
        return;
    }

    const highDeg = (high / total) * 360;
    const mediumDeg = (medium / total) * 360;
    const lowDeg = (low / total) * 360;
    const mediumEnd = highDeg + mediumDeg;
    const lowEnd = mediumEnd + lowDeg;

    donut.style.background = `
        conic-gradient(
            #ff4e51 0deg ${highDeg}deg,
            #ffad25 ${highDeg}deg ${mediumEnd}deg,
            #42a5ef ${mediumEnd}deg ${lowEnd}deg,
            #29c5d8 ${lowEnd}deg 360deg
        )
    `;
}

// =====================================================
// LOAD HISTORY
// =====================================================
async function loadHistory() {
    try {
        const response = await fetch('/history');

        if (!response.ok) {
            throw new Error('Could not load scan history. HTTP ' + response.status);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error('History endpoint did not return JSON: ' + text.substring(0, 150));
        }

        const data = await response.json();
        scanHistory = Array.isArray(data.reports) ? data.reports : [];
        displayReports();
        displayDashboardHistory();

        const total = data.total_scans !== undefined
            ? data.total_scans
            : scanHistory.length;

        const totalScans = document.getElementById('totalScans');
        if (totalScans) totalScans.textContent = total;

        const reportsTotal = document.getElementById('reportsTotal');
        if (reportsTotal) reportsTotal.textContent = total + ' scans';

        if (scanHistory.length > 0) {
            const latest = scanHistory[0];
            const report = latest.report || {};
            latestReport = report;

            const lastScan = document.getElementById('lastScan');
            if (lastScan) lastScan.textContent = report.timestamp || 'Recently';

            // IMPORTANT: populate Dashboard, Findings and Endpoints from saved data.
            displayReport(report);
        } else {
            latestReport = null;
            displayFindings([]);
            displayAllFindings([]);
            updateEndpoints(null);
            updateDonut(0, 0, 0, 0);
        }

        displayReports();

    } catch (error) {
        console.error('History error:', error);
        showError('History error: ' + error.message);
    }
}

// =====================================================
// ENDPOINT INFORMATION
// =====================================================
function updateEndpoints(report) {
    const container = document.getElementById('endpointContent');
    if (!container) return;

    if (!report || !report.target) {
        container.innerHTML = `
            <div class="empty-large">No endpoint information available.</div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="endpoint-card">
            <div>
                <strong>${escapeHtml(report.target)}</strong>
                <p>Last scanned endpoint</p>
            </div>
            <div class="endpoint-status">
                ${escapeHtml(String(report.status_code || '-'))}
            </div>
        </div>
    `;
}

// =====================================================
// NEW SCAN
// =====================================================

function startNewScan() {

    const newScanInput =
        document.getElementById("apiUrl");

    if (!newScanInput) {
        alert("New Scan API URL field was not found.");
        return;
    }

    const url =
        newScanInput.value.trim();

    if (!url) {
        alert("Please enter an API URL.");
        return;
    }

    // IMPORTANT:
    // Pass the New Scan URL directly.
    scanAPI(url, "newscan");
}


// =====================================================
// API SCAN
// =====================================================

async function scanAPI(
    suppliedUrl = null,
    scanSource = "dashboard"
) {

    let url;


    // ================================================
    // GET TARGET URL
    // ================================================

    if (scanSource === "newscan") {

        // New Scan page
        url = suppliedUrl;

    } else {

        // Dashboard page
        const dashboardInput =
            document.getElementById(
                "dashboardapiUrl"
            );

        url =
            dashboardInput
                ? dashboardInput.value.trim()
                : "";
    }


    // ================================================
    // VALIDATE
    // ================================================

    if (!url) {

        showError(
            "Please enter an API endpoint URL."
        );

        return;
    }


    console.log(
        "SCAN SOURCE:",
        scanSource
    );

    console.log(
        "SCAN URL:",
        url
    );


    // ================================================
    // AUTHENTICATION
    // ================================================

    let authentication = {
        type: "none"
    };


    // Authentication is only taken from
    // New Scan page.

    if (scanSource === "newscan") {

        const authenticationSelect =
            document.getElementById(
                "authentication"
            );

        const authenticationType =
            authenticationSelect
                ? authenticationSelect.value
                : "none";


        if (
            authenticationType === "bearer"
        ) {

            const token =
                document.getElementById(
                    "bearerToken"
                )?.value.trim();


            if (!token) {

                alert(
                    "Please enter the bearer token."
                );

                return;
            }


            authentication = {

                type: "bearer",

                token: token

            };

        }


        else if (
            authenticationType === "api_key"
        ) {

            const apiKey =
                document.getElementById(
                    "apiKey"
                )?.value.trim();


            if (!apiKey) {

                alert(
                    "Please enter the API key."
                );

                return;
            }


            authentication = {

                type: "api_key",

                key: apiKey

            };

        }

    }


    // ================================================
    // UI
    // ================================================

    const scanButton =
        document.getElementById(
            "scanButton"
        );

    const loading =
        document.getElementById(
            "loadingBox"
        );


    hideError();


    if (scanButton) {

        scanButton.disabled = true;

        scanButton.innerHTML =
            "⟳ Scanning...";

    }


    if (loading) {

        loading.style.display =
            "flex";

    }


    // ================================================
    // SEND TO FLASK
    // ================================================

    try {

        const settings =
            typeof getSettings === "function"
                ? getSettings()
                : {};


        const response =
            await fetch(
                "/scan",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        url: url,

                        authentication:
                            authentication,

                        settings:
                            settings

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Scan failed."
            );

        }


        console.log(
            "SERVER SCANNED:",
            data.security_report?.target
        );


        latestReport =
            data.security_report;


        await loadHistory();


        // ============================================
        // WHERE TO SHOW RESULT
        // ============================================

        if (
            scanSource === "newscan"
        ) {

            // New Scan → Reports
            showSection("reports");

        } else {

            // Dashboard → Dashboard
            displayReport(
                latestReport
            );

            showSection(
                "dashboard"
            );

        }

    }


    catch (error) {

        console.error(
            "Scan error:",
            error
        );

        showError(
            error.message ||
            "An error occurred while scanning."
        );

    }


    finally {

        if (scanButton) {

            scanButton.disabled =
                false;

            scanButton.innerHTML =
                "▶ &nbsp; Scan API";

        }


        if (loading) {

            loading.style.display =
                "none";

        }

    }

}
// =====================================================
// NEW SCAN API
// =====================================================

async function scanNewAPI(url) {

    const authenticationSelect =
        document.getElementById("authentication");

    const authenticationType =
        authenticationSelect
            ? authenticationSelect.value
            : "none";

    let authentication = {
        type: "none"
    };


    // Bearer Token
    if (authenticationType === "bearer") {

        const tokenElement =
            document.getElementById("bearerToken");

        const token =
            tokenElement
                ? tokenElement.value.trim()
                : "";

        if (!token) {
            alert("Please enter the bearer token.");
            return;
        }

        authentication = {
            type: "bearer",
            token: token
        };
    }


    // API Key
    else if (authenticationType === "api_key") {

        const apiKeyElement =
            document.getElementById("apiKey");

        const apiKey =
            apiKeyElement
                ? apiKeyElement.value.trim()
                : "";

        if (!apiKey) {
            alert("Please enter the API key.");
            return;
        }

        authentication = {
            type: "api_key",
            key: apiKey
        };
    }


    const newScanButton =
        document.getElementById("newScanButton");

    const loading =
        document.getElementById("loadingBox");


    if (newScanButton) {
        newScanButton.disabled = true;
        newScanButton.innerHTML = "⟳ Scanning...";
    }

    if (loading) {
        loading.style.display = "flex";
    }


    try {

        const settings =
            typeof getSettings === "function"
                ? getSettings()
                : {};


        const response =
            await fetch("/scan", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    url: url,

                    authentication:
                        authentication,

                    settings:
                        settings

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Scan failed."
            );

        }


        latestReport =
            data.security_report;


        await loadHistory();


        displayReport(
            latestReport
        );


        showSection(
            "dashboard"
        );


        console.log(
            "New Scan completed:",
            url
        );

    }

    catch (error) {

        console.error(
            "New Scan error:",
            error
        );

        alert(
            "Scan failed: " +
            error.message
        );

    }

    finally {

        if (newScanButton) {

            newScanButton.disabled = false;

            newScanButton.innerHTML =
                "⚡ Start Security Scan";

        }

        if (loading) {
            loading.style.display = "none";
        }

    }
}
// =====================================================
// SEARCH
// =====================================================
function searchDashboard() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const search = searchInput.value.trim().toLowerCase();
    const tables = ['#findingsTable', '#allFindingsTable', '#reportsTable'];

    tables.forEach(selector => {
        const table = document.querySelector(selector);
        if (!table) return;

        table.querySelectorAll('tr').forEach(row => {
            if (row.querySelector('th')) {
                row.style.display = '';
                return;
            }

            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        });
    });
}

// =====================================================
// ERROR HELPERS
// =====================================================
function showError(message) {

    const errorBox =
        document.getElementById("errorBox");

    const errorMessage =
        document.getElementById("errorMessage");

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorBox) {
        errorBox.style.display = "block";
    }
}


function hideError() {

    const errorBox =
        document.getElementById("errorBox");

    if (errorBox) {
        errorBox.style.display = "none";
    }

}
// =====================================================
// HELPERS
// =====================================================
function getSeverityClass(severity) {
    if (!severity) return 'info';
    return String(severity).toLowerCase().replace('informational', 'info');
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value === undefined || value === null ? '' : String(value);
    return div.innerHTML;
}

function escapeJs(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// =====================================================
// VIEW REPORT
// =====================================================

async function viewReport(filename) {

    try {

        const response = await fetch(
            "/history/" + encodeURIComponent(filename)
        );

        if (!response.ok) {

            throw new Error(
                "Could not load report. HTTP " +
                response.status
            );

        }

        const data = await response.json();

        // Flask normally returns:
        // { success: true, report: {...} }
        //
        // This also supports the older nested format:
        // { report: { report: {...} } }

        let report = data.report || data;

        if (
            report.report &&
            typeof report.report === "object"
        ) {
            report = report.report;
        }

        const summary = report.summary || {};

        const findings =
            Array.isArray(report.findings)
                ? report.findings
                : [];


        // =================================================
        // FINDINGS HTML
        // =================================================

        let findingsHTML = "";

        if (findings.length > 0) {

            findingsHTML = findings.map(finding => {

                const severity =
                    finding.severity || "Informational";

                const category =
                    finding.category || "Security";

                const name =
                    finding.name ||
                    finding.title ||
                    "Security Finding";

                const message =
                    finding.message ||
                    finding.description ||
                    "No description available.";

                return `
                    <div class="report-finding">

                        <div class="report-finding-header">

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <span class="severity-badge ${getSeverityClass(severity)}">
                                ${escapeHtml(severity)}
                            </span>

                        </div>

                        <p>
                            <strong>Category:</strong>
                            ${escapeHtml(category)}
                        </p>

                        <p>
                            ${escapeHtml(message)}
                        </p>

                    </div>
                `;

            }).join("");

        } else {

            findingsHTML = `
                <p class="empty">
                    No security findings.
                </p>
            `;
        }


        // =================================================
        // REMOVE OLD MODAL
        // =================================================

        const oldModal =
            document.getElementById("reportModal");

        if (oldModal) {
            oldModal.remove();
        }


        // =================================================
        // CREATE MODAL
        // =================================================

        const modal =
            document.createElement("div");

        modal.id = "reportModal";
        modal.className = "report-modal";


        modal.innerHTML = `

            <div class="report-modal-content">

                <div class="report-modal-header">

                    <h2>
                        Security Scan Report
                    </h2>

                    <button
                        class="report-modal-close"
                        onclick="closeReportModal()">
                        ×
                    </button>

                </div>


                <!-- REPORT DETAILS -->

                <div class="report-details">

                    <p>
                        <strong>Scan ID:</strong>
                        ${escapeHtml(
                            report.scan_id || filename || "-"
                        )}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHtml(
                            report.timestamp || "-"
                        )}
                    </p>

                    <p>
                        <strong>Target:</strong>
                        ${escapeHtml(
                            report.target || "-"
                        )}
                    </p>

                    <p>
                        <strong>Status Code:</strong>
                        ${
                            report.status_code !== undefined &&
                            report.status_code !== null
                                ? report.status_code
                                : "-"
                        }
                    </p>

                    <p>
                        <strong>Response Time:</strong>
                        ${
                            report.response_time !== undefined &&
                            report.response_time !== null
                                ? report.response_time
                                : "-"
                        }
                        seconds
                    </p>

                </div>


                <!-- SECURITY SUMMARY -->

                <h3>
                    Security Summary
                </h3>

                <div class="report-summary">

                    <div>
                        <strong>
                            ${summary.High || 0}
                        </strong>
                        <span>High</span>
                    </div>

                    <div>
                        <strong>
                            ${summary.Medium || 0}
                        </strong>
                        <span>Medium</span>
                    </div>

                    <div>
                        <strong>
                            ${summary.Low || 0}
                        </strong>
                        <span>Low</span>
                    </div>

                    <div>
                        <strong>
                            ${summary.Informational || 0}
                        </strong>
                        <span>Informational</span>
                    </div>

                </div>


                <!-- FINDINGS -->

                <h3>
                    Findings
                </h3>

                <div class="report-findings">

                    ${findingsHTML}

                </div>

            </div>

        `;


        document.body.appendChild(modal);


    } catch (error) {

        console.error(
            "View report error:",
            error
        );

        alert(
            "Could not load the scan report: " +
            error.message
        );

    }

}

// =====================================================
// CLOSE REPORT MODAL
// =====================================================

function closeReportModal() {

    const modal = document.getElementById("reportModal");

    if (modal) {
        modal.remove();
    }

}

// =====================================================
// DELETE REPORT
// =====================================================
async function deleteReport(filename) {
    if (!confirm('Are you sure you want to delete this scan report?')) return;

    try {
        const response = await fetch(
            '/history/' + encodeURIComponent(filename),
            { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Could not delete report.');
        }

        alert('Scan report deleted successfully.');
        await loadHistory();

    } catch (error) {
        console.error('Delete report error:', error);
        alert('Could not delete the scan report: ' + error.message);
    }
}

// =====================================================
// AUTHENTICATION UI
// =====================================================
function toggleAuthenticationFields() {
    const authentication = document.getElementById('authentication');
    const bearerGroup = document.getElementById('bearerAuthGroup');
    const apiKeyGroup = document.getElementById('apiKeyAuthGroup');
    const bearerToken = document.getElementById('bearerToken');
    const apiKey = document.getElementById('apiKey');

    if (!authentication) return;

    const type = authentication.value;

    if (bearerGroup) {
        bearerGroup.style.display = type === 'bearer' ? 'block' : 'none';
    }

    if (apiKeyGroup) {
        apiKeyGroup.style.display = type === 'api_key' ? 'block' : 'none';
    }

    // Clear hidden credentials.
    if (type !== 'bearer' && bearerToken) bearerToken.value = '';
    if (type !== 'api_key' && apiKey) apiKey.value = '';
}

// =====================================================
// INITIAL LOAD
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    toggleAuthenticationFields();
});

// =====================================================
// SETTINGS
// =====================================================

const DEFAULT_SETTINGS = {

    securityHeaders: true,

    authentication: true,

    httpMethods: true,

    inputValidation: true,

    errorDisclosure: true,

    sensitiveData: true,

    findingsChart: true,

    scanHistory: true,

    responseTime: true

};


// =====================================================
// GET SETTINGS
// =====================================================

function getSettings() {

    try {

        const savedSettings =
            localStorage.getItem(
                "sentraScanSettings"
            );

        if (!savedSettings) {

            return {
                ...DEFAULT_SETTINGS
            };

        }

        const parsedSettings =
            JSON.parse(savedSettings);

        return {
            ...DEFAULT_SETTINGS,
            ...parsedSettings
        };

    } catch (error) {

        console.error(
            "Could not load settings:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}


// =====================================================
// SAVE SETTINGS
// =====================================================

function saveSettings() {

    const settings = {

        securityHeaders:
            document.getElementById(
                "settingSecurityHeaders"
            )?.checked ?? true,

        authentication:
            document.getElementById(
                "settingAuthentication"
            )?.checked ?? true,

        httpMethods:
            document.getElementById(
                "settingHttpMethods"
            )?.checked ?? true,

        inputValidation:
            document.getElementById(
                "settingInputValidation"
            )?.checked ?? true,

        errorDisclosure:
            document.getElementById(
                "settingErrorDisclosure"
            )?.checked ?? true,

        sensitiveData:
            document.getElementById(
                "settingSensitiveData"
            )?.checked ?? true,

        findingsChart:
            document.getElementById(
                "settingFindingsChart"
            )?.checked ?? true,

        scanHistory:
            document.getElementById(
                "settingScanHistory"
            )?.checked ?? true,

        responseTime:
            document.getElementById(
                "settingResponseTime"
            )?.checked ?? true

    };


    localStorage.setItem(
        "sentraScanSettings",
        JSON.stringify(settings)
    );


    showSettingsSaved();

    applyDashboardSettings(settings);


    console.log(
        "Settings saved:",
        settings
    );
}


// =====================================================
// LOAD SETTINGS
// =====================================================

function loadSettings() {

    const settings =
        getSettings();


    const securityHeaders =
        document.getElementById(
            "settingSecurityHeaders"
        );

    const authentication =
        document.getElementById(
            "settingAuthentication"
        );

    const httpMethods =
        document.getElementById(
            "settingHttpMethods"
        );

    const inputValidation =
        document.getElementById(
            "settingInputValidation"
        );

    const errorDisclosure =
        document.getElementById(
            "settingErrorDisclosure"
        );

    const sensitiveData =
        document.getElementById(
            "settingSensitiveData"
        );

    const findingsChart =
        document.getElementById(
            "settingFindingsChart"
        );

    const scanHistory =
        document.getElementById(
            "settingScanHistory"
        );

    const responseTime =
        document.getElementById(
            "settingResponseTime"
        );


    if (securityHeaders)
        securityHeaders.checked =
            settings.securityHeaders;

    if (authentication)
        authentication.checked =
            settings.authentication;

    if (httpMethods)
        httpMethods.checked =
            settings.httpMethods;

    if (inputValidation)
        inputValidation.checked =
            settings.inputValidation;

    if (errorDisclosure)
        errorDisclosure.checked =
            settings.errorDisclosure;

    if (sensitiveData)
        sensitiveData.checked =
            settings.sensitiveData;

    if (findingsChart)
        findingsChart.checked =
            settings.findingsChart;

    if (scanHistory)
        scanHistory.checked =
            settings.scanHistory;

    if (responseTime)
        responseTime.checked =
            settings.responseTime;


    applyDashboardSettings(settings);
}


// =====================================================
// SETTINGS SAVED MESSAGE
// =====================================================

function showSettingsSaved() {

    const status =
        document.getElementById(
            "settingsStatus"
        );

    if (!status) {
        return;
    }


    status.style.display =
        "block";


    clearTimeout(
        window.settingsMessageTimer
    );


    window.settingsMessageTimer =
        setTimeout(
            function () {

                status.style.display =
                    "none";

            },
            2000
        );
}


// =====================================================
// APPLY DASHBOARD SETTINGS
// =====================================================


function applyDashboardSettings(settings) {
    // 1. Findings chart
    const chart = document.getElementById("severityDonut");

    if (chart) {
        const chartPanel = chart.closest(".panel.chart-panel");

        if (chartPanel) {
            chartPanel.style.display =
                settings.findingsChart ? "" : "none";
        }
    }

    // 2. Scan history on Dashboard
    const dashboardHistory =
        document.getElementById("dashboardScanHistory");

    if (dashboardHistory) {
        dashboardHistory.style.display =
            settings.scanHistory ? "" : "none";
    }

    // Also support any other dashboard history elements
    document.querySelectorAll("#scanHistory, .scan-history")
        .forEach(function (element) {
            element.style.display =
                settings.scanHistory ? "" : "none";
        });

    // 3. Scan history on Reports page
    const reportsTable =
        document.getElementById("reportsTable");

    if (reportsTable) {
        const reportsPanel = reportsTable.closest(".panel");

        if (reportsPanel) {
            reportsPanel.style.display =
                settings.scanHistory ? "" : "none";
        }
    }

    // 4. Response time
    const responseTime =
        document.getElementById("responseTime");

    if (responseTime) {
        const responsePanel =
            responseTime.closest(".bottom-stats > div");

        if (responsePanel) {
            responsePanel.style.display =
                settings.responseTime ? "" : "none";
        }
    }

    // Show only the enabled security scanners
    const scannerItems = {
        scanSecurityHeaders: "securityHeaders",
        scanHttpMethods: "httpMethods",
        scanAuthentication: "authentication",
        scanInputValidation: "inputValidation",
        scanErrorDisclosure: "errorDisclosure",
        scanSensitiveData: "sensitiveData"
    };

    Object.entries(scannerItems).forEach(([elementId, settingKey]) => {
        const element = document.getElementById(elementId);

        if (element) {
            element.style.display =
                settings[settingKey] ? "" : "none";
        }
    });

}


// =====================================================
// INITIALIZE SETTINGS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

    }
);
